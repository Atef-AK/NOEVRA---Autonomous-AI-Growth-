import { ActionContext } from './types';

export function evaluateEthicsHardStops(context: ActionContext): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check 1: Mass unsolicited spam
  if (context.category === 'email' && (context.recipientCount ?? 0) > 50) {
    violations.push(
      'ETHICS_STOP: Mass unsolicited email dispatch exceeds safe outreach boundary (>50 recipients).',
    );
  }

  // Check 2: Fake accounts, engagement, or review manipulation
  const snippetLower = (context.contentSnippet ?? '').toLowerCase();
  if (
    snippetLower.includes('fake review') ||
    snippetLower.includes('buy followers') ||
    snippetLower.includes('captcha bypass') ||
    snippetLower.includes('spoof identity')
  ) {
    violations.push(
      'ETHICS_STOP: Content or action contains indicators of artificial engagement, CAPTCHA bypass, or identity spoofing.',
    );
  }

  // Check 3: Irrelevant backlink spam
  if (
    context.category === 'community_reply' &&
    context.containsLinks &&
    snippetLower.includes('click here to buy')
  ) {
    violations.push(
      'ETHICS_STOP: Community replies cannot post aggressive unsolicited affiliate or backlink spam.',
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
