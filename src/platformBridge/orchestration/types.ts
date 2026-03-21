import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { AgentConfig as OpencodeAgentConfig } from '@opencode-ai/sdk'

import type { AgentConfig as LocalAgentConfig } from '../../agents/types'
import type { ToolContext } from '../../workflows/core/toolTypes'
import type { PlatformCapabilities } from '../capabilities/types'

export interface PlatformOrchestratorPluginHooks {
  config: (config: Record<string, unknown>) => Promise<void>
  tool: NonNullable<Hooks['tool']>
  event: NonNullable<Hooks['event']>
  'chat.message': NonNullable<Hooks['chat.message']>
  'experimental.chat.system.transform': NonNullable<Hooks['experimental.chat.system.transform']>
}

export interface PlatformOrchestrator {
  toPluginHooks: () => PlatformOrchestratorPluginHooks
}

export interface WorkflowServiceLike {
  listAllTools: () => ReturnType<typeof import('../../workflows/core/service').workflowService.listAllTools>
  getDefinition: () => ReturnType<typeof import('../../workflows/core/service').workflowService.getDefinition>
  getCurrentStage: () => ReturnType<typeof import('../../workflows/core/service').workflowService.getCurrentStage>
  getState: () => ReturnType<typeof import('../../workflows/core/service').workflowService.getState>
  on: (event: 'handoverExecuted' | 'stageCompleted', listener: (payload: { fromStep?: string; toStep?: string; stageName?: string; isCompleted?: boolean }) => void) => void
  isHandoverInProgress: () => boolean
  getHandoverAgent: (stage: string) => string | null
  getHandoverPrompt: (from: string | null, to: string) => string | null
  executeHandover: (sessionID?: string, adapter?: ReturnType<PlatformCapabilities['toAdapter']>) => Promise<unknown>
}

export interface CreateOpenCodeOrchestratorInput {
  ctx: PluginInput
  capabilities: PlatformCapabilities
  workflowService: WorkflowServiceLike
  pluginTools: NonNullable<Hooks['tool']>
  mappedAgents: Record<string, OpencodeAgentConfig & { hidden?: boolean }>
}

export interface BuildWorkflowToolsInput {
  workflowService: WorkflowServiceLike
}

export interface AgentMappingInput {
  agents: Record<string, LocalAgentConfig>
}

export type ToolContextFactory = () => ToolContext
