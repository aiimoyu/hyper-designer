import type { AgentConfig } from './agent'
import type { ToolDefinition } from './tool'
import type { WorkflowDefinition } from './workflow'

/**
 * OpenCode command definition.
 * @see https://opencode.ai/docs/commands
 */
export interface CommandDefinition {
  template: string
  description?: string
  agent?: string
  model?: string
  subtask?: boolean
}

export type AgentPluginFactory = (model?: string) => AgentConfig | Promise<AgentConfig>

export interface AgentPluginRegistration {
  name: string
  factory: AgentPluginFactory
}

export type WorkflowPluginFactory = () => WorkflowDefinition

export interface WorkflowPluginRegistration {
  factory: WorkflowPluginFactory
}

export type ToolPluginFactory = () => ToolDefinition | Promise<ToolDefinition>

export interface ToolPluginRegistration {
  name: string
  factory: ToolPluginFactory
}

export type CommandPluginFactory = () => CommandDefinition | Promise<CommandDefinition>

export interface CommandPluginRegistration {
  name: string
  factory: CommandPluginFactory
}

export interface PluginContext {
  path?: string
}

export interface PluginHooks {
  agent?: (agents: Record<string, AgentConfig>) => Record<string, AgentConfig> | Promise<Record<string, AgentConfig>>
  workflow?: (workflows: Record<string, WorkflowDefinition>) => Record<string, WorkflowDefinition> | Promise<Record<string, WorkflowDefinition>>
  tool?: (tools: Record<string, ToolDefinition>) => Record<string, ToolDefinition> | Promise<Record<string, ToolDefinition>>
  command?: (commands: Record<string, CommandDefinition>) => Record<string, CommandDefinition> | Promise<Record<string, CommandDefinition>>
}

export type PluginFactory = (ctx?: PluginContext) => PluginHooks | Promise<PluginHooks>

export interface PluginRegistrations {
  agent: Record<string, AgentConfig>
  workflow: Record<string, WorkflowDefinition>
  tool: Record<string, ToolDefinition>
  command: Record<string, CommandDefinition>
}
