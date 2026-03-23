export type { InjectionConfig } from '../workflows/types'
import type { InjectionConfig, WorkflowDefinition, WorkflowStageDefinition } from '../workflows/types'
import type { WorkflowState } from '../workflows/state/types'

export interface PromptTransformWorkflowContext {
  workflow: WorkflowDefinition | null
  state: WorkflowState | null
  currentStage: string | null
  stageDefinition: WorkflowStageDefinition | null
}

export interface PromptInjectionRequest extends PromptTransformWorkflowContext {
  systemMessages: string[]
  config?: InjectionConfig
}

export interface PromptInjectionProvider {
  id: string
  inject(input: PromptInjectionRequest): string | null | Promise<string | null>
}
