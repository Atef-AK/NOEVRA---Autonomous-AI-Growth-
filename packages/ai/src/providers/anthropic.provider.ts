/**
 * Anthropic provider adapter.
 * Translates GrowthOS-internal types to the Anthropic SDK format.
 */
import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ToolCall,
  Message,
  MessageContent,
} from '../types';
import { estimateCost } from '../types';

const SUPPORTED_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const;

// Model alias → canonical ID
const MODEL_ALIASES: Record<string, string> = {
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku':  'claude-3-5-haiku-20241022',
  'claude-3-opus':     'claude-3-opus-20240229',
  'claude-3-sonnet':   'claude-3-sonnet-20240229',
  'claude-3-haiku':    'claude-3-haiku-20240307',
};

type AnthropicMessage = Anthropic.MessageParam;

function toAnthropicMessages(messages: Message[]): {
  system: string;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const anthropicMessages: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(typeof msg.content === 'string' ? msg.content : '');
      continue;
    }

    if (typeof msg.content === 'string') {
      if (msg.role === 'user') {
        anthropicMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        anthropicMessages.push({ role: 'assistant', content: msg.content });
      }
      continue;
    }

    // Array content
    const parts = msg.content as MessageContent[];
    const toolUseParts = parts.filter(p => p.type === 'tool_use');
    const toolResultParts = parts.filter(p => p.type === 'tool_result');
    const textParts = parts.filter(p => p.type === 'text');

    if (toolUseParts.length > 0 || textParts.length > 0) {
      const content: Anthropic.ContentBlock[] = [
        ...textParts.map(p => ({
          type: 'text' as const,
          text: (p as { text: string }).text,
        })),
        ...toolUseParts.map(p => {
          const tu = p as { toolCallId: string; toolName: string; toolInput: unknown };
          return {
            type: 'tool_use' as const,
            id: tu.toolCallId,
            name: tu.toolName,
            input: tu.toolInput as Record<string, unknown>,
          };
        }),
      ];
      anthropicMessages.push({ role: 'assistant', content });
    }

    if (toolResultParts.length > 0) {
      const content = toolResultParts.map(p => {
        const tr = p as { toolCallId: string; content: unknown; isError?: boolean };
        return {
          type: 'tool_result' as const,
          tool_use_id: tr.toolCallId,
          content:
            typeof tr.content === 'string'
              ? tr.content
              : JSON.stringify(tr.content),
          is_error: tr.isError ?? false,
        };
      });
      anthropicMessages.push({ role: 'user', content });
    }
  }

  return { system: systemParts.join('\n\n'), messages: anthropicMessages };
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly defaultModel = 'claude-3-5-sonnet-20241022';
  readonly supportedModels = SUPPORTED_MODELS;

  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(model: string, request: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();
    const resolvedModel = MODEL_ALIASES[model] ?? model;

    const { system, messages } = toAnthropicMessages(request.messages);

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: resolvedModel,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      ...(system ? { system } : {}),
      stream: false,
    };

    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool['input_schema'],
      }));
      if (request.toolChoice === 'none') params.tool_choice = { type: 'auto' };
      else if (request.toolChoice === 'required') params.tool_choice = { type: 'any' };
      else params.tool_choice = { type: 'auto' };
    }

    const response = await this.client.messages.create(params);
    const latencyMs = Date.now() - start;

    const toolCalls: ToolCall[] = response.content
      .filter(b => b.type === 'tool_use')
      .map(b => {
        const tu = b as Anthropic.ToolUseBlock;
        return {
          toolCallId: tu.id,
          toolName: tu.name,
          toolInput: tu.input,
        };
      });

    const textContent = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('');

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const providerModel = `anthropic/${model}`;

    let stopReason: CompletionResponse['stopReason'] = 'end_turn';
    if (response.stop_reason === 'tool_use') stopReason = 'tool_use';
    else if (response.stop_reason === 'max_tokens') stopReason = 'max_tokens';
    else if (response.stop_reason === 'stop_sequence') stopReason = 'stop_sequence';

    return {
      id: response.id,
      provider: 'anthropic',
      model: resolvedModel,
      text: textContent || null,
      toolCalls,
      stopReason,
      usage: {
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateCost(providerModel, inputTokens, outputTokens),
      },
      latencyMs,
    };
  }
}
