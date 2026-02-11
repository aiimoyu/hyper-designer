/**
 * Minimal agent registry - only registers the agents your project needs.
 * Returns concrete AgentConfig objects for runtime use.
 */

import type { AgentConfig } from "./types"
import { createHCollectorAgent } from "./HCollector"
import { createHArchitectAgent } from "./HArchitect"
import { createHCriticAgent } from "./HCritic"
import { createHEngineerAgent } from "./HEngineer"
import type { RuntimeType } from "../tools/toolsGenerator"



/**
 * List of all builtin hyper-designer agent names.
 * Used for filtering hooks to only activate for hyper-designer agents.
 */
export const HD_BUILTIN_AGENT_NAMES = ["HCollector", "HArchitect", "HCritic", "HEngineer"] as const

export type HDBuiltinAgentName = (typeof HD_BUILTIN_AGENT_NAMES)[number]

/**
 * Check if an agent name is a hyper-designer builtin agent.
 */
export function isHDBuiltinAgent(agentName: string | undefined): boolean {
  return agentName !== undefined && HD_BUILTIN_AGENT_NAMES.includes(agentName as HDBuiltinAgentName)
}

/**
 * createBuiltinAgents: 返回项目实际可用的 agent 配置
 * 这里用简单逻辑：使用同一个默认 model，调用各 factory 生成配置。
 */
export async function createBuiltinAgents(
  modelOrRuntime: string | RuntimeType | undefined = process.env.DEFAULT_AGENT_MODEL ?? undefined,
  runtime?: RuntimeType
): Promise<Record<string, AgentConfig>> {
  const resolvedRuntime =
    runtime ?? (modelOrRuntime === "opencode" || modelOrRuntime === "claudecode" ? modelOrRuntime : "opencode")
  const resolvedModel =
    modelOrRuntime === "opencode" || modelOrRuntime === "claudecode"
      ? process.env.DEFAULT_AGENT_MODEL ?? undefined
      : modelOrRuntime

  return {
    HCollector: createHCollectorAgent(resolvedModel, resolvedRuntime),
    HArchitect: createHArchitectAgent(resolvedModel, resolvedRuntime),
    HCritic: createHCriticAgent(resolvedModel, resolvedRuntime),
    HEngineer: createHEngineerAgent(resolvedModel, resolvedRuntime),
  }
}

// export { agentSources, agentMetadata }
