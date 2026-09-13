import { z } from 'zod';

// ============================================================
// Core AI message types (provider-agnostic)
// ============================================================

export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  type: 'tool_use';
  toolCallId: string;
  toolName: string;
  toolInput: unknown;
}

export interface ToolResultContent {
  type: 'tool_result';
  toolCallId: string;
  content: unknown;
  isError?: boolean;
}

export type MessageContent = TextContent | ToolUseContent | ToolResultContent;

export interface Message {
  role: MessageRole;
  content: string | MessageContent[];
}

// ============================================================
// Tool definitions (provider-agnostic, JSON Schema based)
// ============================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================
// Completion request / response
// ============================================================

export interface CompletionRequest {
  messages: Message[];
  tools?: ToolDefinition[] | undefined;
  toolChoice?: ('auto' | 'none' | 'required') | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  /** If true, return a ReadableStream<string> instead of the full response */
  stream?: false | undefined;
  stopSequences?: string[] | undefined;
}

export interface ToolCall {
  toolCallId: string;
  toolName: string;
  toolInput: unknown;
}

export interface CompletionUsage {
  inputTokens: number;
  outputTokens: number;
  /** USD cost based on provider pricing */
  estimatedCostUsd: number;
}

export interface CompletionResponse {
  id: string;
  provider: string;
  model: string;
  /** The full text content (if no tool calls) */
  text: string | null;
  /** Tool calls requested by the model */
  toolCalls: ToolCall[];
  /** Stop reason */
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error';
  usage: CompletionUsage;
  latencyMs: number;
}

// ============================================================
// Provider interface
// ============================================================

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  readonly supportedModels: readonly string[];

  complete(
    model: string,
    request: CompletionRequest,
  ): Promise<CompletionResponse>;
}

// ============================================================
// Model Router config
// ============================================================

export type ProviderName = 'openai' | 'anthropic' | 'google' | 'openrouter';

export interface ModelRouterConfig {
  /** Default provider to use when no preference is specified */
  defaultProvider: ProviderName;
  /** Map of "provider/model" strings to provider instances */
  providers: Partial<Record<ProviderName, AIProvider>>;
  /** Fallback chain: if primary fails, try these in order */
  fallbackChain?: ProviderName[];
}

// ============================================================
// Pricing table (per 1M tokens, USD)
// Kept in code so it stays in sync with AI SDK versions.
// ============================================================

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'openai/gpt-4o':               { inputPer1M: 2.5,  outputPer1M: 10.0  },
  'openai/gpt-4o-mini':          { inputPer1M: 0.15, outputPer1M: 0.6   },
  'openai/gpt-4-turbo':          { inputPer1M: 10.0, outputPer1M: 30.0  },
  'openai/o1':                   { inputPer1M: 15.0, outputPer1M: 60.0  },
  'openai/o1-mini':              { inputPer1M: 3.0,  outputPer1M: 12.0  },
  // Anthropic
  'anthropic/claude-3-5-sonnet': { inputPer1M: 3.0,  outputPer1M: 15.0  },
  'anthropic/claude-3-5-haiku':  { inputPer1M: 0.8,  outputPer1M: 4.0   },
  'anthropic/claude-3-opus':     { inputPer1M: 15.0, outputPer1M: 75.0  },
  // Google
  'google/gemini-2.5-flash':         { inputPer1M: 0.15, outputPer1M: 0.6   }, // Gemini 2.5 Flash
  'google/gemini-2.5-flash-preview': { inputPer1M: 0.15, outputPer1M: 0.6   }, // Preview alias
  'google/gemini-3.6-flash':         { inputPer1M: 0.15, outputPer1M: 0.6   }, // Gemini 3.6 Flash
  'google/gemini-3.8-flash':         { inputPer1M: 0.15, outputPer1M: 0.6   }, // Gemini 3.8 Flash
  'google/gemini-2.5-pro':           { inputPer1M: 1.25, outputPer1M: 5.0   }, // Gemini 2.5 Pro
  'google/gemini-2.0-flash':         { inputPer1M: 0.1,  outputPer1M: 0.4   },
  'google/gemini-2.0-flash-lite':    { inputPer1M: 0.075, outputPer1M: 0.3  },
  'google/gemini-1.5-pro':           { inputPer1M: 3.5,  outputPer1M: 10.5  },
  'google/gemini-1.5-flash':         { inputPer1M: 0.075, outputPer1M: 0.3  },
};

export function estimateCost(
  providerModel: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[providerModel];
  if (!pricing) return 0;
  return (
    (inputTokens / 1_000_000) * pricing.inputPer1M +
    (outputTokens / 1_000_000) * pricing.outputPer1M
  );
}
