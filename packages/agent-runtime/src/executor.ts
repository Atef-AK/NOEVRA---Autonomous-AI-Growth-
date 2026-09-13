/**
 * AgentExecutor — implements the ReAct (Reason + Act) loop.
 *
 * Flow per step:
 * 1. Build messages from run history
 * 2. Call AI model → CompletionResponse
 * 3. Record thought/tool_call step in DB
 * 4. If tool_calls present → execute each tool, record tool_result steps
 * 5. If stop_reason == end_turn OR max steps reached → emit final answer
 * 6. Loop
 *
 * All steps are persisted to the database as they execute, so the UI
 * can stream progress in real-time (Phase 3 will add SSE streaming).
 */
import type { ModelRouter, CompletionResponse, Message, ToolCall, ToolDefinition } from '@growthos/ai';
import type { ToolRegistry, ToolContext } from '@growthos/tools';
import { type PrismaClient, Prisma } from '@growthos/database';

export interface AgentExecutorConfig {
  /** Prisma client for persisting steps + usage events */
  db: PrismaClient;
  /** Model router for AI inference */
  modelRouter: ModelRouter;
  /** Tool registry for tool execution */
  toolRegistry: ToolRegistry;
}

export interface AgentRunInput {
  agentRunId: string;
  organizationId: string;
  projectId?: string | undefined;
  /** Agent definition from DB */
  agent: {
    systemPrompt: string;
    allowedTools: string[];
    preferredModel: string;
    maxSteps: number;
    maxTokens: number;
    /** temperature = temperatureX10 / 10 */
    temperatureX10: number;
  };
  /** The goal/task to accomplish */
  goal: string;
  /** Optional callback invoked after each step (for streaming) */
  onStep?: ((step: AgentStep) => void | Promise<void>) | undefined;
}

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'final_answer';
  stepIndex: number;
  content?: string | undefined;
  toolName?: string | undefined;
  toolArgs?: unknown | undefined;
  toolResult?: unknown | undefined;
  toolError?: string | undefined;
  inputTokens: number;
  outputTokens: number;
  provider?: string | undefined;
  model?: string | undefined;
  latencyMs?: number | undefined;
}

export interface AgentRunResult {
  finalAnswer: string;
  totalSteps: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  durationMs: number;
}

export class AgentExecutor {
  constructor(private readonly config: AgentExecutorConfig) {}

  async execute(input: AgentRunInput): Promise<AgentRunResult> {
    const runStart = Date.now();
    const { db, modelRouter, toolRegistry } = this.config;
    const { agentRunId, organizationId, projectId, agent, goal, onStep } = input;

    // Mark run as running
    await db.agentRun.update({
      where: { id: agentRunId },
      data: { status: 'running', startedAt: new Date() },
    });

    const toolContext: ToolContext = {
      organizationId,
      projectId,
      agentRunId,
    };

    // Get allowed tool definitions
    const toolDefinitions: ToolDefinition[] = toolRegistry.toDefinitions(
      Array.isArray(agent.allowedTools) ? agent.allowedTools : [],
    );

    // Build message history
    const messages: Message[] = [
      {
        role: 'system',
        content: agent.systemPrompt,
      },
      {
        role: 'user',
        content: goal,
      },
    ];

    let stepIndex = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let finalAnswer: string | null = null;

    const [providerName, ...modelParts] = agent.preferredModel.split('/');
    const modelStr = modelParts.length > 0
      ? agent.preferredModel
      : `google/${agent.preferredModel}`;

    while (stepIndex < agent.maxSteps && finalAnswer === null) {
      let completion: CompletionResponse;

      try {
        completion = await modelRouter.complete(modelStr, {
          messages,
          tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
          toolChoice: toolDefinitions.length > 0 ? 'auto' : undefined,
          maxTokens: agent.maxTokens,
          temperature: agent.temperatureX10 / 10,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'AI inference failed';
        await this.failRun(db, agentRunId, errorMsg);
        throw err;
      }

      totalInputTokens += completion.usage.inputTokens;
      totalOutputTokens += completion.usage.outputTokens;
      totalCostUsd += completion.usage.estimatedCostUsd;

      // Record usage event
      await db.usageEvent.create({
        data: {
          organizationId,
          agentRunId,
          eventType: 'ai_inference',
          provider: completion.provider,
          model: completion.model,
          inputTokens: completion.usage.inputTokens,
          outputTokens: completion.usage.outputTokens,
          costUsd: completion.usage.estimatedCostUsd,
        },
      });

      // ── Case 1: Tool calls ────────────────────────────────────────────────
      if (completion.toolCalls.length > 0) {
        // Persist tool_call step for each call
        for (const tc of completion.toolCalls) {
          const step = await this.persistStep(db, {
            agentRunId,
            stepIndex,
            type: 'tool_call',
            toolName: tc.toolName,
            toolArgs: tc.toolInput,
            inputTokens: completion.usage.inputTokens,
            outputTokens: completion.usage.outputTokens,
            provider: completion.provider,
            model: completion.model,
            latencyMs: completion.latencyMs,
          });

          const agentStep: AgentStep = {
            type: 'tool_call',
            stepIndex,
            toolName: tc.toolName,
            toolArgs: tc.toolInput,
            inputTokens: completion.usage.inputTokens,
            outputTokens: completion.usage.outputTokens,
            provider: completion.provider,
            model: completion.model,
            latencyMs: completion.latencyMs,
          };

          await onStep?.(agentStep);
          stepIndex++;

          // Execute the tool
          const toolResult = await toolRegistry.call(tc.toolName, tc.toolInput, toolContext);

          // Persist tool_result step
          await this.persistStep(db, {
            agentRunId,
            stepIndex,
            type: 'tool_result',
            toolName: tc.toolName,
            toolResult: toolResult.success ? toolResult.data : undefined,
            toolError: toolResult.success ? undefined : toolResult.error,
            inputTokens: 0,
            outputTokens: 0,
          });

          const resultStep: AgentStep = {
            type: 'tool_result',
            stepIndex,
            toolName: tc.toolName,
            toolResult: toolResult.success ? toolResult.data : undefined,
            toolError: toolResult.success ? undefined : toolResult.error,
            inputTokens: 0,
            outputTokens: 0,
          };

          await onStep?.(resultStep);
          stepIndex++;

          // Void reference to satisfy the linter
          void step;
        }

        // Add tool use + results to message history
        const toolUseContent = completion.toolCalls.map(tc => ({
          type: 'tool_use' as const,
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          toolInput: tc.toolInput,
        }));

        messages.push({ role: 'assistant', content: toolUseContent });

        // Add tool results as a user message
        const toolResultMessages = await Promise.all(
          completion.toolCalls.map(async (tc: ToolCall) => {
            const result = await toolRegistry.call(tc.toolName, tc.toolInput, toolContext);
            return {
              type: 'tool_result' as const,
              toolCallId: tc.toolCallId,
              content: result.success ? result.data : { error: result.error },
              isError: !result.success,
            };
          }),
        );

        messages.push({ role: 'user', content: toolResultMessages });

      // ── Case 2: Final answer ──────────────────────────────────────────────
      } else {
        finalAnswer = completion.text ?? 'Done.';

        // If there was a text response before stop, record as thought
        if (completion.text && completion.stopReason !== 'end_turn') {
          await this.persistStep(db, {
            agentRunId,
            stepIndex,
            type: 'thought',
            content: completion.text,
            inputTokens: completion.usage.inputTokens,
            outputTokens: completion.usage.outputTokens,
            provider: completion.provider,
            model: completion.model,
            latencyMs: completion.latencyMs,
          });
          stepIndex++;
        }

        // Persist final_answer step
        await this.persistStep(db, {
          agentRunId,
          stepIndex,
          type: 'final_answer',
          content: finalAnswer,
          inputTokens: completion.usage.inputTokens,
          outputTokens: completion.usage.outputTokens,
          provider: completion.provider,
          model: completion.model,
          latencyMs: completion.latencyMs,
        });

        const finalStep: AgentStep = {
          type: 'final_answer',
          stepIndex,
          content: finalAnswer,
          inputTokens: completion.usage.inputTokens,
          outputTokens: completion.usage.outputTokens,
          provider: completion.provider,
          model: completion.model,
          latencyMs: completion.latencyMs,
        };

        await onStep?.(finalStep);
        stepIndex++;
      }
    }

    // If we exhausted steps without a final answer
    if (finalAnswer === null) {
      finalAnswer = 'Maximum steps reached without a final answer.';
    }

    const durationMs = Date.now() - runStart;

    // Mark run as completed
    await db.agentRun.update({
      where: { id: agentRunId },
      data: {
        status: 'completed',
        result: finalAnswer,
        completedAt: new Date(),
        totalInputTokens,
        totalOutputTokens,
        totalCostUsd,
      },
    });

    return {
      finalAnswer,
      totalSteps: stepIndex,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd,
      durationMs,
    };
  }

  private async persistStep(
    db: PrismaClient,
    data: {
      agentRunId: string;
      stepIndex: number;
      type: string;
      content?: string | undefined;
      toolName?: string | undefined;
      toolArgs?: unknown | undefined;
      toolResult?: unknown | undefined;
      toolError?: string | undefined;
      inputTokens: number;
      outputTokens: number;
      provider?: string | undefined;
      model?: string | undefined;
      latencyMs?: number | undefined;
    },
  ) {
    return db.agentStep.create({
      data: {
        agentRunId: data.agentRunId,
        stepIndex: data.stepIndex,
        type: data.type,
        content: data.content ?? null,
        toolName: data.toolName ?? null,
        toolArgs: data.toolArgs !== undefined ? (JSON.parse(JSON.stringify(data.toolArgs)) as any) : ((Prisma as any).JsonNull ?? null),
        toolResult: data.toolResult !== undefined ? (JSON.parse(JSON.stringify(data.toolResult)) as any) : ((Prisma as any).JsonNull ?? null),
        toolError: data.toolError ?? null,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        provider: data.provider ?? null,
        model: data.model ?? null,
        latencyMs: data.latencyMs ?? null,
      },
    });
  }

  private async failRun(db: PrismaClient, agentRunId: string, errorMessage: string): Promise<void> {
    await db.agentRun.update({
      where: { id: agentRunId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
      },
    });
  }
}
