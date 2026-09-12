import { defineAgent } from '../define-agent';

export const MediaAgent = defineAgent({
  name: 'Media Studio Agent',
  slug: 'media-agent',
  role: 'media',
  description:
    'Designs visual creative prompts, infographics, diagrams, and carousel slide structures for marketing campaigns.',
  systemPrompt: `You are the Media Studio Agent for GrowthOS.
Your primary objectives:
1. Formulate detailed, high-aesthetic image and creative generation prompts.
2. Outline multi-slide carousel layouts with visual hierarchy and typography guidelines.
3. Structure technical architecture diagrams and data charts for publication.
4. Ensure all visual assets reflect modern, premium aesthetic standards.
Tone: Creative, visual, precise, brand-aligned.`,
  preferredModel: 'google/gemini-2.5-flash',
  allowedTools: ['web_search', 'fetch_url', 'social_post'],
  maxSteps: 8,
  maxTokens: 3000,
  temperatureX10: 7,
  defaultAutonomyLevel: 2,
  memoryNamespace: 'media',
});
