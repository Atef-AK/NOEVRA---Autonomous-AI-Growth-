import { describe, it, expect } from 'vitest';
import { ToolRegistry } from './registry';
import { CalculatorTool } from './builtin/calculator.tool';
import { FetchUrlTool } from './builtin/fetch-url.tool';
import { createDefaultRegistry } from './default-registry';

describe('ToolRegistry', () => {
  it('registers and lists tools', () => {
    const registry = new ToolRegistry();
    const calc = new CalculatorTool();
    registry.register(calc);

    expect(registry.has('calculator')).toBe(true);
    expect(registry.names()).toEqual(['calculator']);
  });

  it('converts tools to ToolDefinition format', () => {
    const registry = new ToolRegistry();
    registry.register(new CalculatorTool());

    const defs = registry.toDefinitions();
    expect(defs).toHaveLength(1);
    expect(defs[0]?.name).toBe('calculator');
    expect(defs[0]?.description).toContain('mathematical expression');
    expect(defs[0]?.parameters.type).toBe('object');
  });

  it('executes a tool successfully via registry.call', async () => {
    const registry = new ToolRegistry();
    registry.register(new CalculatorTool());

    const result = await registry.call(
      'calculator',
      { expression: '2 + 3 * 4' },
      { organizationId: 'org-1' },
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      expression: '2 + 3 * 4',
      result: 14,
      resultString: '14',
    });
  });

  it('returns validation error on invalid input arguments', async () => {
    const registry = new ToolRegistry();
    registry.register(new CalculatorTool());

    const result = await registry.call(
      'calculator',
      { expression: 12345 }, // invalid type
      { organizationId: 'org-1' },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid tool input:');
  });

  it('returns error on unknown tool call', async () => {
    const registry = new ToolRegistry();
    const result = await registry.call('unknown_tool', {}, { organizationId: 'org-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool: "unknown_tool"');
  });
});

describe('CalculatorTool', () => {
  const calc = new CalculatorTool();
  const ctx = { organizationId: 'org-test' };

  it('evaluates basic arithmetic', async () => {
    const res = await calc.call({ expression: '100 / 4 + 15' }, ctx);
    expect(res.success).toBe(true);
    expect(res.data?.result).toBe(40);
  });

  it('evaluates Math functions', async () => {
    const res = await calc.call({ expression: 'Math.sqrt(144) + Math.pow(2, 3)' }, ctx);
    expect(res.success).toBe(true);
    expect(res.data?.result).toBe(20);
  });

  it('blocks dangerous code injections', async () => {
    const dangerous = [
      'process.exit(1)',
      'eval("2+2")',
      'Function("return 1")()',
      'fetch("http://evil.com")',
      'require("fs")',
    ];

    for (const expr of dangerous) {
      const res = await calc.call({ expression: expr }, ctx);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    }
  });
});

describe('FetchUrlTool - SSRF protection', () => {
  const fetchTool = new FetchUrlTool();
  const ctx = { organizationId: 'org-test' };

  it('blocks loopback and metadata URLs', async () => {
    const blockedUrls = [
      'http://localhost/api',
      'http://127.0.0.1:8080',
      'http://169.254.169.254/latest/meta-data',
    ];

    for (const url of blockedUrls) {
      const res = await fetchTool.call({ url }, ctx);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/SSRF|not allowed|blocked/i);
    }
  });
});

describe('createDefaultRegistry', () => {
  it('creates registry with default tools pre-registered', () => {
    const registry = createDefaultRegistry();
    expect(registry.has('calculator')).toBe(true);
    expect(registry.has('fetch_url')).toBe(true);
    expect(registry.has('web_search')).toBe(true);
  });
});
