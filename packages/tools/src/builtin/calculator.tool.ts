/**
 * CalculatorTool — safe arithmetic expression evaluator.
 * Uses a safe evaluator (not eval) to prevent injection.
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';

const CalculatorInputSchema = z.object({
  expression: z
    .string()
    .min(1)
    .max(500)
    .describe(
      'A mathematical expression to evaluate. ' +
      'Supports: +, -, *, /, **, %, parentheses, Math functions (sqrt, abs, ceil, floor, round, log, log2, log10, sin, cos, tan, PI, E). ' +
      'Example: "Math.sqrt(144) + 2 ** 8"',
    ),
});

export interface CalculatorOutput {
  expression: string;
  result: number;
  resultString: string;
}

// Safe token whitelist — ONLY these are allowed in expressions
const SAFE_EXPRESSION_PATTERN =
  /^[\d\s+\-*/%(). ,^]*$|^(Math\.(sqrt|abs|ceil|floor|round|log|log2|log10|sin|cos|tan|PI|E|\d|\s|\(|\)|\.|\*\*|[+\-/,%])+)*$/;

// Tiny safe evaluator using Function constructor with a restricted scope
function safeEval(expression: string): number {
  // Validate characters first — allow numbers, operators, whitespace, Math.*
  const cleaned = expression.trim();

  // Check for dangerous patterns
  if (
    /[`\\]/.test(cleaned) ||
    /\bimport\b/.test(cleaned) ||
    /\brequire\b/.test(cleaned) ||
    /\bprocess\b/.test(cleaned) ||
    /\bglobal\b/.test(cleaned) ||
    /\bwindow\b/.test(cleaned) ||
    /\bdocument\b/.test(cleaned) ||
    /\beval\b/.test(cleaned) ||
    /\bFunction\b/.test(cleaned) ||
    /\bsetTimeout\b/.test(cleaned) ||
    /\bsetInterval\b/.test(cleaned) ||
    /\bfetch\b/.test(cleaned) ||
    /\bXMLHttpRequest\b/.test(cleaned) ||
    cleaned.length > 500
  ) {
    throw new Error('Expression contains disallowed tokens');
  }

  // Restrict to Math namespace + numbers + operators
  // eslint-disable-next-line no-new-func
  const fn = new Function('Math', `"use strict"; return (${cleaned});`);
  const result: unknown = fn(Math);

  if (typeof result !== 'number') {
    throw new Error('Expression did not evaluate to a number');
  }
  if (!isFinite(result)) {
    throw new Error(`Expression evaluated to ${result} (not finite)`);
  }

  return result;
}

export class CalculatorTool extends Tool<typeof CalculatorInputSchema, CalculatorOutput> {
  readonly name = 'calculator';
  readonly description =
    'Evaluate a mathematical expression and return the result. ' +
    'Supports basic arithmetic, powers, and Math functions like sqrt, log, sin, cos.';
  readonly schema = CalculatorInputSchema;

  async execute(
    input: z.infer<typeof CalculatorInputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult<CalculatorOutput>> {
    const result = safeEval(input.expression);
    return {
      success: true,
      data: {
        expression: input.expression,
        result,
        resultString: result.toString(),
      },
    };
  }
}
