/**
 * Minimal agent registry - only registers the agents your project needs.
 * Returns concrete AgentConfig objects for runtime use.
 */

import type { AgentConfig } from "./types"
import { createHCollectorAgent } from "./HCollector"
import { createHArchitectAgent } from "./HArchitect"
import { createHCriticAgent } from "./HCritic"
import { createHEngineerAgent } from "./HEngineer"
import type { FrontendType } from "../prompts/toolsGenerator"



/**
 * createBuiltinAgents: 返回项目实际可用的 agent 配置
 * 这里用简单逻辑：使用同一个默认 model，调用各 factory 生成配置。
 */
export async function createBuiltinAgents(
  modelOrFrontend: string | FrontendType | undefined = process.env.DEFAULT_AGENT_MODEL ?? undefined,
  frontend?: FrontendType
): Promise<Record<string, AgentConfig>> {
  const resolvedFrontend =
    frontend ?? (modelOrFrontend === "opencode" || modelOrFrontend === "claudecode" ? modelOrFrontend : "opencode")
  const resolvedModel =
    modelOrFrontend === "opencode" || modelOrFrontend === "claudecode"
      ? process.env.DEFAULT_AGENT_MODEL ?? undefined
      : modelOrFrontend

  return {
    HCollector: createHCollectorAgent(resolvedModel, resolvedFrontend),
    HArchitect: createHArchitectAgent(resolvedModel, resolvedFrontend),
    HCritic: createHCriticAgent(resolvedModel, resolvedFrontend),
    HEngineer: createHEngineerAgent(resolvedModel, resolvedFrontend),
  }
}

// export { agentSources, agentMetadata }
