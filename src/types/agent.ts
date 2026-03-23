export type AgentMode = "primary" | "subagent" | "all"

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
  permission?: Record<string, string>
  tools?: Record<string, boolean>
}

export type AgentFactory = ((model: string, opts?: { phases?: string[] }) => AgentConfig) & {
  mode?: AgentMode
}

export type PromptGenerator = () => string

export interface AgentDefinition {
  name: string
  description: string
  mode: AgentMode
  color?: string
  defaultTemperature: number
  defaultMaxTokens?: number
  defaultVariant?: string
  promptGenerators: PromptGenerator[]
  defaultPermission?: Record<string, string>
}

export type BuiltinAgentName = 'HCollector' | 'HArchitect' | 'HCritic' | 'HEngineer' | 'HAnalysis'

export interface AgentPromptMetadata {
  category: string
  cost: string
  promptAlias: string
  keyTrigger: string
  triggers: Array<{ domain: string; trigger: string }>
  useWhen: string[]
  avoidWhen: string[]
}
