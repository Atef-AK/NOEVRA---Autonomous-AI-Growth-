/**
 * OpenAI provider adapter.
 * Translates GrowthOS-internal message/tool types to the OpenAI SDK format.
 */
import OpenAI from 'openai';
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ToolCall,
  ToolDefinition,
  Message,
  MessageContent,
} from '../types';
import { estimateCost } from '../types';

const SUPPORTED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1',
  'o1-mini',
  'o3-mini',
] as const;

function toOpenAIMessages(
  messages: Message[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.flatMap((msg): OpenAI.Chat.ChatCompletionMessageParam[] => {
    if (typeof msg.content === 'string') {
      if (msg.role === 'user') return [{ role: 'user', content: msg.content }];
      if (msg.role === 'assistant') return [{ role: 'assistant', content: msg.content }];
      if (msg.role === 'system') return [{ role: 'system', content: msg.content }];
      return [];
    }

    // Array content
    const parts = msg.content as MessageContent[];
    const toolResultParts = parts.filter(p => p.type === 'tool_result');
    const toolUseParts = parts.filter(p => p.type === 'tool_use');
    const textParts = parts.filter(p => p.type === 'text');

    const result: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Tool use (assistant → tool calls)
    if (toolUseParts.length > 0 || textParts.length > 0) {
      const assistantMsg: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
        role: 'assistant',
        content: textParts.map(p => ({ type: 'text' as const, text: (p as { text: string }).text })),
        tool_calls: toolUseParts.map(p => {
          const tu = p as { toolCallId: string; toolName: string; toolInput: unknown };
          return {
            id: tu.toolCallId,
            type: 'function' as const,
            function: {
              name: tu.toolName,
              arguments: JSON.stringify(tu.toolInput),
            },
          };
        }),
      };
      result.push(assistantMsg);
    }

    // Tool results
    for (const part of toolResultParts) {
      const tr = part as { toolCallId: string; content: unknown; isError?: boolean };
      result.push({
        role: 'tool',
        tool_call_id: tr.toolCallId,
        content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
      });
    }

    return result;
  });
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o';
  readonly supportedModels = SUPPORTED_MODELS;

  private readonly client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  }

  async complete(model: string, request: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();

    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: toOpenAIMessages(request.messages),
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      stream: false,
    };

    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools.map((t: ToolDefinition) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      if (request.toolChoice === 'none') params.tool_choice = 'none';
      else if (request.toolChoice === 'required') params.tool_choice = 'required';
      else params.tool_choice = 'auto';
    }

    if (request.stopSequences?.length) {
      params.stop = request.stopSequences;
    }

    const response = await this.client.chat.completions.create(params);
    const latencyMs = Date.now() - start;

    const choice = response.choices[0];
    if (!choice) throw new Error('OpenAI returned no choices');

    const toolCalls: ToolCall[] = (choice.message.tool_calls ?? []).map(tc => ({
      toolCallId: tc.id,
      toolName: tc.function.name,
      toolInput: JSON.parse(tc.function.arguments) as unknown,
    }));

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const providerModel = `openai/${model}`;

    let stopReason: CompletionResponse['stopReason'] = 'end_turn';
    if (choice.finish_reason === 'tool_calls') stopReason = 'tool_use';
    else if (choice.finish_reason === 'length') stopReason = 'max_tokens';
    else if (choice.finish_reason === 'stop') stopReason = 'end_turn';

    return {
      id: response.id,
      provider: 'openai',
      model,
      text: choice.message.content ?? null,
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
