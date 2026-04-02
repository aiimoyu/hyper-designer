import type { ToolDefinition } from './tool'

export interface WorkflowPlatformAdapter {
  sendPrompt: (params: { sessionId: string; agent: string; text: string; schema?: Record<string, unknown>; system?: string }) => Promise<{ structuredOutput?: unknown; text: string }>
  summarizeSession: (sessionId: string) => Promise<void>
  clearSession: (sessionId: string) => Promise<string>
  cancelSession: (params: { sessionId: string }) => Promise<void>
  registerTools?: (tools: Array<{ name: string; description: string; params: Record<string, { type: string; description?: string; optional?: boolean }>; handler: (params: Record<string, unknown>) => Promise<string> }>) => void
}

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
  stageKey: string
  stageName: string
  workflow: WorkflowDefinition
  nodeId?: string
  setMilestone?: (input: { key: string; mark: boolean; detail: unknown }) => void
  setInfo?: (patch: Record<string, unknown>) => void
  sessionID?: string
  adapter?: WorkflowPlatformAdapter
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
  skill?: string
  files?: string[]
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
  before?: WorkflowHookDefinition[]
  after?: WorkflowHookDefinition[]
  requiredMilestones?: (string | MilestoneDefinition)[]
  required?: boolean
  inputs?: StageFileItem[]
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
  id: string
  name: string
  description: string
  version?: string
  promptFile?: string
  promptBasePath?: string
  promptBindings?: WorkflowPromptBindings
  promptTransform?: WorkflowPromptTransformConfig
  entryStageId: string
  stages: Record<string, WorkflowStageDefinition>
  tools?: ToolDefinition[]
}
