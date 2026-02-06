/**
 * Minimal agent registry - only registers the agents your project needs.
 * Returns concrete AgentConfig objects for runtime use.
 */

import type { AgentConfig } from "./types"
import { createHCollectorAgent } from "./HCollector"
import { createHArchitectAgent } from "./HArchitect"
import { createHCriticAgent } from "./HCritic"
import { createHEngineerAgent } from "./HEngineer"



/**
 * createBuiltinAgents: 返回项目实际可用的 agent 配置
 * 这里用简单逻辑：使用同一个默认 model，调用各 factory 生成配置。
 */
export async function createBuiltinAgents(
  model: string | undefined = process.env.DEFAULT_AGENT_MODEL ?? undefined
): Promise<Record<string, AgentConfig>> {
  return {
    HCollector: createHCollectorAgent(model),
    HArchitect: createHArchitectAgent(model),
    HCritic: createHCriticAgent(model),
    HEngineer: createHEngineerAgent(model),
  }
}

// export { agentSources, agentMetadata }
