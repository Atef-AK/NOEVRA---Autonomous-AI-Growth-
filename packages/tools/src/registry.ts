/**
 * Tool Registry — defines the base structure for every GrowthOS tool.
 *
 * A Tool is:
 * 1. A Zod schema for its input parameters (validates at runtime)
 * 2. A handler function that runs the tool
 * 3. Metadata that gets sent to the AI model as a ToolDefinition
 *
 * This ensures:
 * - Input is always validated before execution
 * - TypeScript infers the input/output types from the Zod schema
 * - Tool definitions are always in sync with implementation
 */
import { z } from 'zod';
import { validateUrlFormat } from '@growthos/shared';

// Inline ToolDefinition to avoid circular dep with @growthos/ai
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolContext {
  /** Organization ID for tenant-scoped tools */
  organizationId: string;
  /** Project ID if the tool is project-scoped */
  projectId?: string | undefined;
  /** Agent run ID for logging */
  agentRunId?: string | undefined;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
}

/**
 * Base class for all GrowthOS tools.
 * @template TInput — Zod schema type for input
 * @template TOutput — return type of the handler
 */
export abstract class Tool<
  TSchema extends z.ZodObject<z.ZodRawShape>,
  TOutput = unknown,
> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly schema: TSchema;

  /**
   * Execute the tool after input validation.
   * Never throws — returns a ToolResult with success/error.
   */
  abstract execute(
    input: z.infer<TSchema>,
    context: ToolContext,
  ): Promise<ToolResult<TOutput>>;

  /**
   * Converts this tool to the provider-agnostic ToolDefinition
   * that gets sent to the AI model.
   */
  toDefinition(): ToolDefinition {
    // Convert Zod schema to JSON Schema (simplified)
    const jsonSchema = zodToJsonSchema(this.schema);
    return {
      name: this.name,
      description: this.description,
      parameters: jsonSchema,
    };
  }

  /**
   * Validate + execute. Called by the agent runtime.
   */
  async call(rawInput: unknown, context: ToolContext): Promise<ToolResult<TOutput>> {
    const parsed = this.schema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid tool input: ${parsed.error.message}`,
      };
    }
    try {
      return await this.execute(parsed.data, context);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Tool execution failed',
      };
    }
  }
}

/**
 * Minimal Zod → JSON Schema converter.
 * Handles the subset of Zod types used in tool parameters.
 */
function zodToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): ToolDefinition['parameters'] {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    properties[key] = zodFieldToJsonSchema(field as z.ZodTypeAny);
    // If not optional/nullable, add to required
    if (!(field instanceof z.ZodOptional) && !(field instanceof z.ZodNullable)) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function zodFieldToJsonSchema(field: z.ZodTypeAny): unknown {
  if (field instanceof z.ZodString) {
    const schema: Record<string, unknown> = { type: 'string' };
    if (field.description) schema['description'] = field.description;
    return schema;
  }
  if (field instanceof z.ZodNumber) {
    const schema: Record<string, unknown> = { type: 'number' };
    if (field.description) schema['description'] = field.description;
    return schema;
  }
  if (field instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }
  if (field instanceof z.ZodEnum) {
    return { type: 'string', enum: field.options as string[] };
  }
  if (field instanceof z.ZodArray) {
    return { type: 'array', items: zodFieldToJsonSchema(field.element as z.ZodTypeAny) };
  }
  if (field instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(field.unwrap() as z.ZodTypeAny);
  }
  if (field instanceof z.ZodNullable) {
    return zodFieldToJsonSchema(field.unwrap() as z.ZodTypeAny);
  }
  if (field instanceof z.ZodObject) {
    return zodToJsonSchema(field as z.ZodObject<z.ZodRawShape>);
  }
  // Fallback
  return { type: 'string' };
}

// ============================================================
// ToolRegistry — manages a set of tools for an agent
// ============================================================

export class ToolRegistry {
  private readonly tools = new Map<string, Tool<z.ZodObject<z.ZodRawShape>>>();

  register(...tools: Tool<z.ZodObject<z.ZodRawShape>>[]): this {
    for (const tool of tools) {
      if (this.tools.has(tool.name)) {
        throw new Error(`Tool "${tool.name}" is already registered`);
      }
      this.tools.set(tool.name, tool);
    }
    return this;
  }

  get(name: string): Tool<z.ZodObject<z.ZodRawShape>> | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Returns tool definitions to pass to the AI model */
  toDefinitions(allowedToolNames?: string[]): ToolDefinition[] {
    const allDefs = Array.from(this.tools.values()).map(t => t.toDefinition());
    if (!allowedToolNames || allowedToolNames.length === 0) return allDefs;
    return allDefs.filter(d => allowedToolNames.includes(d.name));
  }

  /** Execute a tool call from the AI model */
  async call(
    toolName: string,
    rawInput: unknown,
    context: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Unknown tool: "${toolName}"` };
    }
    return tool.call(rawInput, context);
  }

  names(): string[] {
    return Array.from(this.tools.keys());
  }
}
