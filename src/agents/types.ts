/**
 * 代理类型定义模块
 * 
 * 定义 Hyper Designer 代理系统的核心类型，包括：
 * 1. 代理模式定义
 * 2. 代理配置接口
 * 3. 代理工厂类型
 * 4. 代理提示词元数据
 */

/**
 * 代理模式定义
 * 决定代理是否遵循UI选择的模型或使用自己的回退链
 * - primary: 主要代理，遵循UI选择的模型
 * - subagent: 子代理，用于特定任务
 * - all: 所有模式，具有最大灵活性
 */
export type AgentMode = "primary" | "subagent" | "all"

/**
 * Minimal AgentConfig used by this project.
 * Add fields here only when a real usage needs them.
 */
export interface AgentConfig {
  name?: string
  description?: string
  model?: string
  variant?: string
  prompt?: string
  mode?: AgentMode
  temperature?: number
  maxTokens?: number
  color?: string
  // simple, permissive shapes for permission/tools; adapt as needed
  permission?: Record<string, string> | undefined
  tools?: Record<string, boolean> | undefined
}

/**
 * Agent factory type.
 * Some agent factories expose a static `mode` property (optional).
 * Example: const createHCollectorAgent: AgentFactory & { mode: AgentMode } = ...
 */
export type AgentFactory = ((model: string, opts?: { phases?: string[] }) => AgentConfig) & {
  mode?: AgentMode
}

/**
 * Lightweight metadata used when building dynamic prompts (e.g. Sisyphus-style).
 * Keep only helpful fields for prompt generation and UI listing.
 */
export type BuiltinAgentName = import("./utils").HDBuiltinAgentName

/**
 * Metadata for agent prompts, used for dynamic prompt building and agent selection.
 */
export interface AgentPromptMetadata {
  category: string
  cost: string
  promptAlias: string
  keyTrigger: string
  triggers: Array<{ domain: string; trigger: string }>
  useWhen: string[]
  avoidWhen: string[]
}


