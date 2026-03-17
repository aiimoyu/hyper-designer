import type { ToolDefinition } from './toolTypes'

import type { PlatformAdapter } from '../../adapters/types'

// 重新导出供上层直接使用
export type { PlatformAdapter } from '../../adapters/types'

export interface WorkflowPromptBindings {
  [placeholder: string]: string
}

export type StageFileItemType = 'file' | 'folder' | 'pattern'

export interface StageFileItem {
  id: string
  path: string
  type: StageFileItemType
  description: string
  content?: string
  error?: string
}

export type StageHookFn = (ctx: {
  /** 阶段 key，如 "IRAnalysis" */
  stageKey: string
  stageName: string
  workflow: WorkflowDefinition
  nodeId?: string
  setMilestone?: (input: { key: string; isCompleted: boolean; detail: unknown }) => void
  setInfo?: (patch: Record<string, unknown>) => void
  sessionID?: string
  /** 平台适配器（平台注入），提供会话管理与 prompt 能力 */
  adapter?: PlatformAdapter
}) => Promise<void>

export interface WorkflowHookDefinition {
  id?: string
  description?: string
  fn: StageHookFn
  agent?: string
}

export type StageHook = WorkflowHookDefinition

export interface StageTransitionDefinition {
  id: string
  toStageId: string
  mode: 'auto' | 'manual'
  priority: number
  description?: string
}

export interface MilestoneDefinition {
  id: string
  name: string
  description: string
  failureMessage: string
}

export interface InjectionConfig {
  provider: string
  tag?: string
  path?: string
}

export interface WorkflowStageDefinition {
  stageId?: string
  name: string
  description: string
  agent: string
  promptFile?: string
  promptBindings?: WorkflowPromptBindings
  inject?: InjectionConfig[]
  injectContent?: string[]
  /** Hooks to run before the stage's primary agent starts */
  before?: WorkflowHookDefinition[]
  after?: WorkflowHookDefinition[]
  /** Milestones required for handover - can be string IDs or full definitions */
  requiredMilestones?: (string | MilestoneDefinition)[]
  /** Whether this stage is required to be completed */
  required?: boolean
  /** Input specifications for this stage */
  inputs?: StageFileItem[]
  /** Output specifications for this stage */
  outputs?: StageFileItem[]
  transitions?: StageTransitionDefinition[]
  getHandoverPrompt: (currentStageName: string | null, thisStageName: string) => string
}

export interface WorkflowPromptInjectionConfig {
  enabled?: boolean
  providers?: string[]
}

export interface WorkflowPromptTransformConfig {
  inject?: WorkflowPromptInjectionConfig
}

export interface WorkflowDefinition {
  /** Unique workflow identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Description */
  description: string
  version?: string
  /** Prompt file path relative to the workflow directory for the entire process */
  promptFile?: string
  /** Placeholder bindings shared by all stages in this workflow */
  promptBindings?: WorkflowPromptBindings
  promptTransform?: WorkflowPromptTransformConfig
  entryStageId: string
  stages: Record<string, WorkflowStageDefinition>
  /**
   * 该工作流提供的工具列表
   * 框架会自动将这些工具注册到运行平台（OpenCode、Claude Code 等）
   */
  tools?: ToolDefinition[]
}
