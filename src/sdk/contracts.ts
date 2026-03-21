import type { AgentConfig, AgentPromptMetadata } from '../agents/types'
import type { AgentDefinition } from '../agents/factory'
import { createAgent, filePrompt as agentFilePrompt, stringPrompt as agentStringPrompt } from '../agents/factory'
import { HyperDesignerLogger } from '../utils/logger'
import type { ToolDefinition } from '../tools/types'
import type {
  MilestoneDefinition,
  StageFileItem,
  StageHookFn,
  WorkflowDefinition,
} from '../workflows/core/types'
import { summarizeHook } from '../workflows/core/stageHooks'
import { filePrompt as workflowFilePrompt } from '../workflows/core/utils'

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

export type {
  AgentConfig,
  AgentDefinition,
  AgentPromptMetadata,
  MilestoneDefinition,
  StageFileItem,
  StageHookFn,
  WorkflowDefinition,
}

export {
  agentFilePrompt,
  agentStringPrompt,
  createAgent as createSdkAgent,
  HyperDesignerLogger,
  summarizeHook,
  workflowFilePrompt,
}
