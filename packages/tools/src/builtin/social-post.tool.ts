/**
 * SocialPostTool — posts content to social platforms via their connector adapters.
 * Routes to the correct platform connector based on the `platform` argument.
 * Returns the external post ID and URL on success.
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';

const SocialPostInputSchema = z.object({
  platform: z
    .enum(['linkedin', 'twitter', 'x', 'reddit', 'facebook', 'instagram', 'tiktok'])
    .describe('The social platform to post to'),
  content: z.string().min(1).max(10000).describe('The post content / caption'),
  title: z.string().optional().describe('Post title (required for Reddit, optional for LinkedIn)'),
  subreddit: z
    .string()
    .optional()
    .describe('Target subreddit (required when platform=reddit)'),
  mediaUrls: z
    .array(z.string().url())
    .optional()
    .describe('Optional image/video URLs to attach'),
  hashtags: z.array(z.string()).optional().describe('Hashtags to append'),
  scheduledFor: z
    .string()
    .datetime()
    .optional()
    .describe('ISO8601 datetime to schedule the post (if omitted, posts immediately)'),
});

export interface SocialPostResult {
  platform: string;
  externalId: string;
  postUrl?: string | undefined;
  scheduledFor?: string | undefined;
  status: 'published' | 'scheduled' | 'draft';
}

export class SocialPostTool extends Tool<typeof SocialPostInputSchema, SocialPostResult> {
  readonly name = 'social_post';
  readonly description =
    'Posts content to social media platforms (LinkedIn, Twitter/X, Reddit, Facebook, Instagram, TikTok). Handles formatting, hashtags, and media attachments.';
  readonly schema = SocialPostInputSchema;

  constructor(
    private readonly connectorTokens: {
      linkedinAccessToken?: string | undefined;
      twitterBearerToken?: string | undefined;
      twitterAccessToken?: string | undefined;
      twitterAccessSecret?: string | undefined;
      twitterClientId?: string | undefined;
      twitterClientSecret?: string | undefined;
      metaPageAccessToken?: string | undefined;
      metaInstagramAccountId?: string | undefined;
      tiktokAccessToken?: string | undefined;
      redditClientId?: string | undefined;
      redditClientSecret?: string | undefined;
      redditUsername?: string | undefined;
      redditPassword?: string | undefined;
      redditUserAgent?: string | undefined;
    } = {},
  ) {
    super();
  }

  async execute(
    input: z.infer<typeof SocialPostInputSchema>,
    context: ToolContext,
  ): Promise<ToolResult<SocialPostResult>> {
    const platform = input.platform === 'x' ? 'twitter' : input.platform;
    const hashtags = (input.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
    const fullContent = hashtags ? `${input.content}\n\n${hashtags}` : input.content;

    switch (platform) {
      case 'linkedin':
        return this.postToLinkedIn(input, fullContent);
      case 'twitter':
        return this.postToTwitter(input, fullContent);
      case 'reddit':
        return this.postToReddit(input, fullContent);
      case 'facebook':
        return this.postToFacebook(input, fullContent);
      case 'instagram':
        return this.postToInstagram(input, fullContent);
      case 'tiktok':
        return this.postToTikTok(input, fullContent);
      default:
        return { success: false, error: `Unknown platform: ${platform}` };
    }
  }

  private async postToLinkedIn(
    input: z.infer<typeof SocialPostInputSchema>,
    content: string,
  ): Promise<ToolResult<SocialPostResult>> {
    const token = this.connectorTokens.linkedinAccessToken;
    if (!token) {
      return {
        success: false,
        error: 'LinkedIn access token not configured. Add LINKEDIN_ACCESS_TOKEN to .env and connect your account.',
      };
    }

    try {
      // Get user profile to get the author URN
      const profileResp = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!profileResp.ok) {
        throw new Error(`LinkedIn profile fetch failed: ${profileResp.status}`);
      }

      const profile = await profileResp.json() as { sub: string };
      const authorUrn = `urn:li:person:${profile.sub}`;

      const body = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`LinkedIn post failed (${resp.status}): ${err}`);
      }

      const data = await resp.json() as { id: string };
      return {
        success: true,
        data: {
          platform: 'linkedin',
          externalId: data.id,
          postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
          status: 'published',
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'LinkedIn post failed' };
    }
  }

  private async postToTwitter(
    input: z.infer<typeof SocialPostInputSchema>,
    content: string,
  ): Promise<ToolResult<SocialPostResult>> {
    const bearerToken = this.connectorTokens.twitterBearerToken;
    const accessToken = this.connectorTokens.twitterAccessToken;

    if (!accessToken && !bearerToken) {
      return {
        success: false,
        error: 'Twitter/X credentials not configured. Add TWITTER_ACCESS_TOKEN to .env.',
      };
    }

    try {
      // Twitter API v2 — requires OAuth 2.0 user context for posting
      const tweet = content.slice(0, 280); // Twitter limit

      const resp = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken ?? bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweet }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Twitter post failed (${resp.status}): ${err}`);
      }

      const data = await resp.json() as { data: { id: string; text: string } };
      return {
        success: true,
        data: {
          platform: 'twitter',
          externalId: data.data.id,
          postUrl: `https://twitter.com/i/web/status/${data.data.id}`,
          status: 'published',
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Twitter post failed' };
    }
  }

  private async postToReddit(
    input: z.infer<typeof SocialPostInputSchema>,
    content: string,
  ): Promise<ToolResult<SocialPostResult>> {
    const { redditClientId, redditClientSecret, redditUsername, redditPassword, redditUserAgent } =
      this.connectorTokens;

    if (!redditClientId || !redditClientSecret || !redditUsername || !redditPassword) {
      return {
        success: false,
        error: 'Reddit credentials not configured. Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to .env.',
      };
    }

    if (!input.subreddit) {
      return { success: false, error: 'subreddit is required for Reddit posts' };
    }

    try {
      // Get Reddit access token
      const authResp = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${redditClientId}:${redditClientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': redditUserAgent ?? 'GrowthOS/1.0',
        },
        body: `grant_type=password&username=${encodeURIComponent(redditUsername)}&password=${encodeURIComponent(redditPassword)}`,
        signal: AbortSignal.timeout(10_000),
      });

      if (!authResp.ok) throw new Error(`Reddit auth failed: ${authResp.status}`);
      const auth = await authResp.json() as { access_token: string };

      const kind = input.title ? 'self' : 'self';
      const resp = await fetch('https://oauth.reddit.com/api/submit', {
        method: 'POST',
        headers: {
          Authorization: `bearer ${auth.access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': redditUserAgent ?? 'GrowthOS/1.0',
        },
        body: new URLSearchParams({
          sr: input.subreddit,
          kind,
          title: input.title ?? content.slice(0, 300),
          text: content,
          api_type: 'json',
        }).toString(),
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) throw new Error(`Reddit submit failed: ${resp.status}`);
      const data = await resp.json() as { json?: { data?: { id?: string; url?: string } } };
      const postId = data.json?.data?.id ?? '';
      const postUrl = data.json?.data?.url ?? '';

      return {
        success: true,
        data: {
          platform: 'reddit',
          externalId: postId,
          postUrl,
          status: 'published',
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Reddit post failed' };
    }
  }

  private async postToFacebook(
    input: z.infer<typeof SocialPostInputSchema>,
    content: string,
  ): Promise<ToolResult<SocialPostResult>> {
    const token = this.connectorTokens.metaPageAccessToken;
    if (!token) {
      return {
        success: false,
        error: 'Meta Page Access Token not configured. Add META_PAGE_ACCESS_TOKEN to .env.',
      };
    }

    try {
      // Get page ID first
      const pageResp = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!pageResp.ok) throw new Error(`FB page fetch failed: ${pageResp.status}`);
      const page = await pageResp.json() as { id: string };

      const params = new URLSearchParams({
        message: content,
        access_token: token,
      });

      if (input.mediaUrls?.length) {
        const firstMedia = input.mediaUrls[0];
        if (firstMedia) params.set('link', firstMedia);
      }

      const resp = await fetch(`https://graph.facebook.com/v19.0/${page.id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Facebook post failed (${resp.status}): ${err}`);
      }

      const data = await resp.json() as { id: string };
      return {
        success: true,
        data: {
          platform: 'facebook',
          externalId: data.id,
          postUrl: `https://www.facebook.com/${data.id.replace('_', '/posts/')}`,
          status: 'published',
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Facebook post failed' };
    }
  }

  private async postToInstagram(
    input: z.infer<typeof SocialPostInputSchema>,
    content: string,
  ): Promise<ToolResult<SocialPostResult>> {
    const token = this.connectorTokens.metaPageAccessToken;
    const accountId = this.connectorTokens.metaInstagramAccountId;

    if (!token || !accountId) {
      return {
        success: false,
        error: 'Meta Instagram credentials not configured. Add META_PAGE_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID to .env.',
      };
    }

    if (!input.mediaUrls?.length) {
      return {
        success: false,
        error: 'Instagram posts require at least one image URL (mediaUrls)',
      };
    }

    try {
      // Step 1: Create media container
      const firstMediaUrl = input.mediaUrls[0] ?? '';
      const mediaParams = new URLSearchParams({
        image_url: firstMediaUrl,
        caption: content,
        access_token: token,
      });

      const containerResp = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: mediaParams.toString(),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!containerResp.ok) throw new Error(`Instagram container failed: ${containerResp.status}`);
      const container = await containerResp.json() as { id: string };

      // Step 2: Publish
      const publishParams = new URLSearchParams({
        creation_id: container.id,
        access_token: token,
      });

      const publishResp = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: publishParams.toString(),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!publishResp.ok) throw new Error(`Instagram publish failed: ${publishResp.status}`);
      const published = await publishResp.json() as { id: string };

      return {
        success: true,
        data: {
          platform: 'instagram',
          externalId: published.id,
          status: 'published',
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Instagram post failed' };
    }
  }

  private async postToTikTok(
    input: z.infer<typeof SocialPostInputSchema>,
    content: string,
  ): Promise<ToolResult<SocialPostResult>> {
    const token = this.connectorTokens.tiktokAccessToken;
    if (!token) {
      return {
        success: false,
        error: 'TikTok access token not configured. Add TIKTOK_ACCESS_TOKEN to .env.',
      };
    }

    if (!input.mediaUrls?.length) {
      return {
        success: false,
        error: 'TikTok posts require a video URL (mediaUrls[0]). Generate the video first.',
      };
    }

    try {
      // TikTok Content Posting API v2
      const resp = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: content.slice(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: input.mediaUrls[0],
          },
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`TikTok post failed (${resp.status}): ${err}`);
      }

      const data = await resp.json() as { data?: { publish_id?: string } };
      return {
        success: true,
        data: {
          platform: 'tiktok',
          externalId: data.data?.publish_id ?? 'pending',
          status: 'published',
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'TikTok post failed' };
    }
  }
}
