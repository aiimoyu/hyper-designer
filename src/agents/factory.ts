import type { AgentConfig, AgentMode } from "./types"
import type { AgentOverrideConfig } from "../config/loader"
import { loadHDConfig } from "../config/loader"
import { generateToolsPrompt, type RuntimeType } from "../tools"
import { readFileSync } from "fs"

export type PromptGenerator = (runtime: RuntimeType) => string

export function filePrompt(filePath: string): PromptGenerator {
  return () => {
    try {
      return readFileSync(filePath, "utf-8")
    } catch {
      return `# Failed to load ${filePath}`
    }
  }
}

export function toolsPrompt(toolNames: string[]): PromptGenerator {
  return (runtime) => {
    try {
      return generateToolsPrompt(runtime, toolNames)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to generate tools prompt for ${runtime}: ${message}`)
    }
  }
}

export function stringPrompt(content: string): PromptGenerator {
  return () => content
}

export interface AgentDefinition {
  name: string
  description: string
  mode: AgentMode
  color: string
  defaultTemperature: number
  defaultMaxTokens: number
  promptGenerators: PromptGenerator[]
  defaultPermission: Record<string, string>
  defaultTools: Record<string, boolean>
}

export function createAgent(
  definition: AgentDefinition,
  model?: string,
  runtime?: RuntimeType
): AgentConfig {
  const config = loadHDConfig()
  const agentConfig = config.agents[definition.name] as AgentOverrideConfig | undefined

  const resolvedRuntime = runtime ?? "opencode"

  const promptParts = definition.promptGenerators.map(generator =>
    generator(resolvedRuntime)
  )

  if (agentConfig?.prompt_append) {
    promptParts.push(agentConfig.prompt_append)
  }

  const finalPrompt = promptParts.join("\n\n")

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
