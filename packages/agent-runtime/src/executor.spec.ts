import { describe, it, expect, vi } from 'vitest';
import { AgentExecutor, type AgentRunInput } from './executor';
import { ToolRegistry } from '@growthos/tools';
import { CalculatorTool } from '@growthos/tools';
import type { ModelRouter, CompletionResponse } from '@growthos/ai';
import type { PrismaClient } from '@growthos/database';

function makeMockDb() {
  const steps: any[] = [];
  const runs: Record<string, any> = {
    'run-1': { id: 'run-1', status: 'pending' },
  };

  return {
    agentRun: {
      update: vi.fn(async ({ where, data }) => {
        runs[where.id] = { ...runs[where.id], ...data };
        return runs[where.id];
      }),
    },
    agentStep: {
      create: vi.fn(async ({ data }) => {
        steps.push(data);
        return { id: `step-${steps.length}`, ...data };
      }),
    },
    usageEvent: {
      create: vi.fn(async ({ data }) => data),
    },
    _steps: steps,
    _runs: runs,
  } as unknown as PrismaClient & { _steps: any[]; _runs: Record<string, any> };
}

describe('AgentExecutor', () => {
  it('executes a direct answer agent run with no tool calls', async () => {
    const mockDb = makeMockDb();
    const toolRegistry = new ToolRegistry();

    const mockRouter = {
      complete: vi.fn().mockResolvedValueOnce({
        id: 'resp-1',
        provider: 'openai',
        model: 'gpt-4o',
        text: 'The result is 42.',
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 50, outputTokens: 10, estimatedCostUsd: 0.0005 },
        latencyMs: 120,
      } as CompletionResponse),
    } as unknown as ModelRouter;

    const executor = new AgentExecutor({
      db: mockDb,
      modelRouter: mockRouter,
      toolRegistry,
    });

    const stepsReceived: any[] = [];
    const input: AgentRunInput = {
      agentRunId: 'run-1',
      organizationId: 'org-1',
      agent: {
        systemPrompt: 'You are a helpful assistant.',
        allowedTools: [],
        preferredModel: 'openai/gpt-4o',
        maxSteps: 5,
        maxTokens: 1000,
        temperatureX10: 7,
      },
      goal: 'What is the answer?',
      onStep: (s) => {
        stepsReceived.push(s);
      },
    };

    const result = await executor.execute(input);

    expect(result.finalAnswer).toBe('The result is 42.');
    expect(result.totalSteps).toBe(1);
    expect(result.totalInputTokens).toBe(50);
    expect(result.totalOutputTokens).toBe(10);
    expect(stepsReceived).toHaveLength(1);
    expect(stepsReceived[0].type).toBe('final_answer');
    expect(mockDb._runs['run-1'].status).toBe('completed');
  });

  it('executes a tool call and loops back to final answer', async () => {
    const mockDb = makeMockDb();
    const toolRegistry = new ToolRegistry().register(new CalculatorTool());

    const mockRouter = {
      complete: vi
        .fn()
        // Step 1: call calculator tool
        .mockResolvedValueOnce({
          id: 'resp-1',
          provider: 'openai',
          model: 'gpt-4o',
          text: 'Let me calculate that.',
          toolCalls: [
            {
              toolCallId: 'call-1',
              toolName: 'calculator',
              toolInput: { expression: '25 * 4' },
            },
          ],
          stopReason: 'tool_use',
          usage: { inputTokens: 80, outputTokens: 25, estimatedCostUsd: 0.001 },
          latencyMs: 150,
        } as CompletionResponse)
        // Step 2: return final answer
        .mockResolvedValueOnce({
          id: 'resp-2',
          provider: 'openai',
          model: 'gpt-4o',
          text: '25 * 4 equals 100.',
          toolCalls: [],
          stopReason: 'end_turn',
          usage: { inputTokens: 120, outputTokens: 15, estimatedCostUsd: 0.0015 },
          latencyMs: 110,
        } as CompletionResponse),
    } as unknown as ModelRouter;

    const executor = new AgentExecutor({
      db: mockDb,
      modelRouter: mockRouter,
      toolRegistry,
    });

    const stepsReceived: any[] = [];
    const input: AgentRunInput = {
      agentRunId: 'run-1',
      organizationId: 'org-1',
      agent: {
        systemPrompt: 'You calculate things.',
        allowedTools: ['calculator'],
        preferredModel: 'openai/gpt-4o',
        maxSteps: 5,
        maxTokens: 1000,
        temperatureX10: 5,
      },
      goal: 'Calculate 25 * 4',
      onStep: (s) => {
        stepsReceived.push(s);
      },
    };

    const result = await executor.execute(input);

    expect(result.finalAnswer).toBe('25 * 4 equals 100.');
    expect(result.totalInputTokens).toBe(200);
    expect(result.totalOutputTokens).toBe(40);
    // Steps: tool_call -> tool_result -> final_answer
    expect(stepsReceived).toHaveLength(3);
    expect(stepsReceived[0].type).toBe('tool_call');
    expect(stepsReceived[1].type).toBe('tool_result');
    expect(stepsReceived[1].toolResult).toEqual({
      expression: '25 * 4',
      result: 100,
      resultString: '100',
    });
    expect(stepsReceived[2].type).toBe('final_answer');
    expect(mockDb._runs['run-1'].status).toBe('completed');
  });
});
