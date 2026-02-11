/**
 * Base agent factory - centralizes common agent creation boilerplate
 */

import type { AgentConfig, AgentMode } from "./types"
import type { AgentOverrideConfig } from "../config/loader"
import { loadHDConfig } from "../config/loader"
import { generateToolsPrompt, type FrontendType } from "../prompts/toolsGenerator"
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
  /** Tools that need prompt documentation (optional) */
  promptTools?: string[]
  frontend?: FrontendType
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
  model?: string,
  frontend?: FrontendType
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

  const toolList = definition.promptTools ?? ["ask_user", "task"]
  const resolvedFrontend = frontend ?? definition.frontend ?? "opencode"
  let toolsPrompt = ""

  try {
    toolsPrompt = generateToolsPrompt(resolvedFrontend, toolList)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to generate tools prompt for ${resolvedFrontend}: ${message}`)
  }

  const finalPrompt = `${prompt}\n\n${toolsPrompt}`

  const result: AgentConfig = {
    name: definition.name,
    description: definition.description,
    mode: definition.mode,
    temperature: agentConfig?.temperature ?? definition.defaultTemperature,
    maxTokens: agentConfig?.maxTokens ?? definition.defaultMaxTokens,
    prompt: finalPrompt,
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
