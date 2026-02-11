/**
 * Minimal agent registry - only registers the agents your project needs.
 * Returns concrete AgentConfig objects for runtime use.
 */

import type { AgentConfig } from "./types"
import { createHCollectorAgent } from "./HCollector"
import { createHArchitectAgent } from "./HArchitect"
import { createHCriticAgent } from "./HCritic"
import { createHEngineerAgent } from "./HEngineer"
import type { RuntimeType } from "../tools"



export const BUILTIN_AGENT_FACTORIES = {
  HCollector: createHCollectorAgent,
  HArchitect: createHArchitectAgent,
  HCritic: createHCriticAgent,
  HEngineer: createHEngineerAgent,
} as const

/**
 * List of all builtin hyper-designer agent names.
 * Used for filtering hooks to only activate for hyper-designer agents.
 */
export const HD_BUILTIN_AGENT_NAMES = Object.keys(
  BUILTIN_AGENT_FACTORIES
) as Array<keyof typeof BUILTIN_AGENT_FACTORIES>

export type HDBuiltinAgentName = keyof typeof BUILTIN_AGENT_FACTORIES

/**
 * Check if an agent name is a hyper-designer builtin agent.
 */
export function isHDBuiltinAgent(agentName: string | undefined): boolean {
  return agentName !== undefined && HD_BUILTIN_AGENT_NAMES.includes(agentName as HDBuiltinAgentName)
}

export async function createBuiltinAgents(
  runtime: RuntimeType,
  model?: string
): Promise<Record<HDBuiltinAgentName, AgentConfig>> {
  const result: Partial<Record<HDBuiltinAgentName, AgentConfig>> = {}

  for (const name of HD_BUILTIN_AGENT_NAMES) {
    result[name] = BUILTIN_AGENT_FACTORIES[name](model, runtime)
  }

  return result as Record<HDBuiltinAgentName, AgentConfig>
}

// export { agentSources, agentMetadata }
