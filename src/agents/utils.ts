/**
 * Minimal agent registry - only registers the agents your project needs.
 * Returns concrete AgentConfig objects for runtime use.
 */

import type { AgentConfig } from "./types"
import { createScoutAgent } from "./scout"
import { createClarifierAgent, CLARIFIER_PROMPT_METADATA } from "./clarifier"
import type { AgentFactory, AgentPromptMetadata } from "./types"

const agentSources: Record<"scout" | "clarifier", AgentFactory> = {
  scout: createScoutAgent as unknown as AgentFactory,
  clarifier: createClarifierAgent as unknown as AgentFactory,
}

const agentMetadata: Record<string, AgentPromptMetadata> = {
  clarifier: CLARIFIER_PROMPT_METADATA,
  // If Scout has metadata, you can add it similarly when Scout module exports it.
}

/**
 * createBuiltinAgents: 返回项目实际可用的 agent 配置
 * 这里用简单逻辑：使用同一个默认 model，调用各 factory 生成配置。
 */
export async function createBuiltinAgents(
  model: string = process.env.DEFAULT_AGENT_MODEL ?? "anthropic/claude-sonnet-4-5"
): Promise<Record<string, AgentConfig>> {
  return {
    scout: createScoutAgent(model),
    clarifier: createClarifierAgent(model),
  }
}

export { agentSources, agentMetadata }