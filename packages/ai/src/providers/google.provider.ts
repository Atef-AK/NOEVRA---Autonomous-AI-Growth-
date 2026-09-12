/**
 * Google Gemini provider adapter.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ToolCall,
  Message,
} from '../types';
import { estimateCost } from '../types';

const SUPPORTED_MODELS = [
  'gemini-2.5-flash',          // Latest — fastest, best quality
  'gemini-2.5-flash-preview',  // Preview alias
  'gemini-2.0-flash',          // Stable
  'gemini-2.0-flash-lite',     // Economy
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const;

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function toGeminiRole(role: string): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

export class GoogleProvider implements AIProvider {
  readonly name = 'google';
  readonly defaultModel = 'gemini-2.5-flash';
  readonly supportedModels = SUPPORTED_MODELS;

  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async complete(model: string, request: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();

    // Extract system message
    const systemMessage = request.messages.find(m => m.role === 'system');
    const systemInstruction =
      systemMessage && typeof systemMessage.content === 'string'
        ? systemMessage.content
        : undefined;

    const conversationMessages = request.messages.filter(m => m.role !== 'system');

    const geminiModel = this.client.getGenerativeModel({
      model,
      ...(systemInstruction ? { systemInstruction } : {}),
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        ...(request.stopSequences?.length
          ? { stopSequences: request.stopSequences }
          : {}),
      },
    });

    // Build history (all messages except the last user message)
    const history = conversationMessages.slice(0, -1).map((msg: Message) => ({
      role: toGeminiRole(msg.role),
      parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
    }));

    const lastMsg = conversationMessages[conversationMessages.length - 1];
    const userInput =
      lastMsg && typeof lastMsg.content === 'string'
        ? lastMsg.content
        : JSON.stringify(lastMsg?.content ?? '');

    // Tool definitions
    let tools: object[] | undefined;
    if (request.tools && request.tools.length > 0) {
      tools = [
        {
          functionDeclarations: request.tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const chat = geminiModel.startChat({
      history,
      ...(tools ? { tools } : {}),
    });

    const result = await chat.sendMessage(userInput);
    const latencyMs = Date.now() - start;

    const responseText = result.response.text();
    const candidates = result.response.candidates ?? [];
    const parts = candidates[0]?.content?.parts ?? [];

    const toolCalls: ToolCall[] = parts
      .filter(p => p.functionCall)
      .map((p, idx) => ({
        toolCallId: `gemini-tool-${start}-${idx}`,
        toolName: p.functionCall!.name,
        toolInput: p.functionCall!.args,
      }));

    // Gemini doesn't return token counts reliably in all versions
    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
    const providerModel = `google/${model}`;

    const finishReason = candidates[0]?.finishReason;
    let stopReason: CompletionResponse['stopReason'] = 'end_turn';
    if (finishReason === 'MAX_TOKENS') stopReason = 'max_tokens';
    else if (finishReason === 'STOP') stopReason = toolCalls.length > 0 ? 'tool_use' : 'end_turn';

    return {
      id: `gemini-${start}`,
      provider: 'google',
      model,
      text: responseText || null,
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
