/**
 * 代理工厂模块
 * 
 * 负责创建和管理 AI 代理的配置，包括：
 * 1. 从文件加载提示词内容
 * 2. 合并默认配置和覆盖配置
 * 3. 创建完整的代理配置对象
 */

import type { AgentConfig, AgentMode } from "./types"
import type { AgentOverrideConfig } from "../config/loader"
import { loadHDConfig } from "../config/loader"
import { readFileSync } from "fs"
import { HyperDesignerLogger } from "../utils/logger"

/**
 * A function that generates a prompt string
 */
export type PromptGenerator = () => string

/**
 * Creates a PromptGenerator that reads content from a file
 * @param filePath Path to the file containing the prompt content
 * @returns PromptGenerator function that reads from the specified file
 */
export function filePrompt(filePath: string): PromptGenerator {
  return () => {
    try {
      HyperDesignerLogger.debug("AgentFactory", `从文件加载提示词`, { filePath })
      return readFileSync(filePath, "utf-8")
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.warn("AgentFactory", `加载提示词文件失败`, {
        filePath,
        action: "loadPromptFile",
        error: err.message
      })
      return `# Failed to load ${filePath}`
    }
  }
}

/**
 * Creates a PromptGenerator that returns a static string
 * @param content Static content to return as the prompt
 * @returns PromptGenerator function that returns the static content
 */
export function stringPrompt(content: string): PromptGenerator {
  return () => content
}

/**
 * Defines the structure of an agent definition
 */
export interface AgentDefinition {
  /** Unique name of the agent */
  name: string
  /** Description of the agent's purpose and capabilities */
  description: string
  /** Mode of operation for the agent */
  mode: AgentMode
  /** Optional color for the agent in UI representations */
  color?: string
  /** Default temperature setting for the agent's model */
  defaultTemperature: number
  /** Optional default maximum tokens for the agent's responses */
  defaultMaxTokens?: number
  /** Optional default variant for the agent's model */
  defaultVariant?: string
  /** Array of prompt generators to construct the agent's prompt */
  promptGenerators: PromptGenerator[]
  /** Optional default permissions for the agent */
  /** Optional default permissions: Record<string, string> */
  defaultPermission?: Record<string, string>
}

/**
 * Creates an agent configuration based on a definition and optional overrides
 * @param definition Agent definition containing base configuration
 * @param model Optional model name to use instead of default
 * @returns Complete agent configuration object
 */
export function createAgent(
  definition: AgentDefinition,
  model?: string
): AgentConfig {
  HyperDesignerLogger.info("AgentFactory", `创建代理`, { agent: definition.name })
  
  const config = loadHDConfig()
  const agentConfig = config.agents[definition.name] as AgentOverrideConfig | undefined

  const promptParts = definition.promptGenerators.map(generator => generator())

  if (agentConfig?.prompt_append) {
    HyperDesignerLogger.debug("AgentFactory", `追加自定义提示词内容`, { 
      agent: definition.name,
      contentLength: agentConfig.prompt_append.length
    })
    promptParts.push(agentConfig.prompt_append)
  }

  const finalPrompt = promptParts.join("\n\n")
  HyperDesignerLogger.debug("AgentFactory", `生成最终提示词`, { 
    agent: definition.name,
    promptLength: finalPrompt.length,
    partCount: promptParts.length
  })

  // 创建基础代理配置
  const result: AgentConfig = {
    name: definition.name,
    description: definition.description,
    mode: definition.mode,
    temperature: agentConfig?.temperature ?? definition.defaultTemperature,
    prompt: finalPrompt,
  }

  // 合并最大令牌数配置（覆盖配置优先）
  const maxTokensValue = agentConfig?.maxTokens ?? definition.defaultMaxTokens
  if (maxTokensValue !== undefined) {
    result.maxTokens = maxTokensValue
  }

  // 合并权限配置（覆盖配置优先）
  const permissionValue = agentConfig?.permission ?? definition.defaultPermission
  if (permissionValue !== undefined) {
    result.permission = permissionValue
  }


  // 设置代理颜色（如果定义中存在）
  if (definition.color !== undefined) {
    result.color = definition.color
  }

  // 合并模型配置
  // 如果 inheritHyperModel 为 true，则忽略 agent 配置的 model，直接使用传入的 model 参数
  // 否则，agent 配置的 model 优先于传入的 model 参数
  const modelValue = config.inheritHyperModel ? model : (agentConfig?.model ?? model)
  if (modelValue !== undefined) {
    result.model = modelValue
  }

  // 合并变体配置（覆盖配置优先）
  const variantValue = config.inheritHyperModel ? undefined : agentConfig?.variant ?? undefined
  if (variantValue !== undefined) {
    result.variant = variantValue
  }

  HyperDesignerLogger.info("AgentFactory", `代理创建成功`, { 
    agent: definition.name,
    temperature: result.temperature,
    hasModel: result.model !== undefined,
    hasMaxTokens: result.maxTokens !== undefined
  })
  return result
}
