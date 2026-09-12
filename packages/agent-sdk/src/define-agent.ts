import { AgentDefinition, AgentDefinitionSchema } from './types';

export function defineAgent(config: AgentDefinition): AgentDefinition {
  const parsed = AgentDefinitionSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Invalid agent definition for '${config.name}': ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
