/**
 * Base agent factory - centralizes common agent creation boilerplate
 */

import type { AgentConfig, AgentMode } from "./types"
import type { AgentOverrideConfig } from "../config/loader"
import { loadHDConfig } from "../config/loader"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * Defines the unique characteristics of an agent.
 * The base factory handles all the common boilerplate.
 */
export interface AgentDefinition {
  name: string
  description: string
  mode: AgentMode
  color: string
  defaultTemperature: number
  defaultMaxTokens: number
  /** Paths to .md files for prompt composition, resolved relative to the agent's directory */
  promptFiles: string[]
  /** Default permissions */
  defaultPermission: Record<string, string>
  /** Default tools */
  defaultTools: Record<string, boolean>
}

/**
 * Creates an AgentConfig from an AgentDefinition, handling:
 * - Reading .md prompt files from the agent's directory
 * - Loading and merging user config overrides
 * - Applying defaults for all optional fields
 */
export function createAgent(
  definition: AgentDefinition,
  agentDir: string,
  model?: string
): AgentConfig {
  const config = loadHDConfig()
  const agentConfig = config.agents[definition.name] as AgentOverrideConfig | undefined

  // Read and concatenate prompt files
  const prompt = definition.promptFiles
    .map(file => {
      try {
        return readFileSync(join(agentDir, file), "utf-8")
      } catch {
        return `# ${definition.name} - Failed to load ${file}`
      }
    })
    .join("\n\n")
    + (agentConfig?.prompt_append ? `\n\n${agentConfig.prompt_append}` : "")

  const result: AgentConfig = {
    name: definition.name,
    description: definition.description,
    mode: definition.mode,
    temperature: agentConfig?.temperature ?? definition.defaultTemperature,
    maxTokens: agentConfig?.maxTokens ?? definition.defaultMaxTokens,
    prompt,
    permission: agentConfig?.permission ?? definition.defaultPermission,
    color: definition.color,
    tools: definition.defaultTools,
  }

  const modelValue = agentConfig?.model ?? model
  if (modelValue !== undefined) {
    result.model = modelValue
  }

  if (agentConfig?.variant !== undefined) {
    result.variant = agentConfig.variant
  }

  return result
}
