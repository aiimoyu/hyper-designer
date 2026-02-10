/**
 * Minimal agent types for a lightweight, HCollector-first project.
 * Keep only fields and concepts needed for prompt/building agents.
 */

/**
 * Agent mode determines whether the agent follows UI-selected model
 * or uses its own fallback chain.
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
export interface AgentPromptMetadata {
  category?: string
  cost?: "FREE" | "CHEAP" | "EXPENSIVE"
  promptAlias?: string
  useWhen?: string[]
  avoidWhen?: string[]
  keyTrigger?: string
  triggers?: Array<{ domain: string; trigger: string }>
}



