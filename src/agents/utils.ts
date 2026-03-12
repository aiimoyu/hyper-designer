/**
 * 代理工具模块
 * 
 * 提供代理注册和创建的工具函数，包括：
 * 1. 内置代理工厂注册表
 * 2. 内置代理名称列表
 * 3. 代理创建和验证函数
 */

import type { AgentConfig } from "./types"
import { createHCollectorAgent } from "./HCollector"
import { createHArchitectAgent } from "./HArchitect"
import { createHCriticAgent } from "./HCritic"
import { createHEngineerAgent } from "./HEngineer"
import { createHAnalysisAgent } from "./HAnalysis"


export const BUILTIN_AGENT_FACTORIES = {
  HCollector: createHCollectorAgent,
  HArchitect: createHArchitectAgent,
  HCritic: createHCriticAgent,
  HEngineer: createHEngineerAgent,
  HAnalysis: createHAnalysisAgent,
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
  model?: string
): Promise<Record<HDBuiltinAgentName, AgentConfig>> {
  const result: Partial<Record<HDBuiltinAgentName, AgentConfig>> = {}

  for (const name of HD_BUILTIN_AGENT_NAMES) {
    result[name] = BUILTIN_AGENT_FACTORIES[name](model)
  }

  return result as Record<HDBuiltinAgentName, AgentConfig>
}

// export { agentSources, agentMetadata }
