import type { AgentConfig } from '../../agents/types'

export type AgentPluginFactory = (model?: string) => AgentConfig | Promise<AgentConfig>

export interface AgentPluginRegistration {
  name: string
  factory: AgentPluginFactory
}
