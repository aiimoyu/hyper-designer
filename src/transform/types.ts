import type { WorkflowDefinition, WorkflowStageDefinition } from '../workflows/core/types'
import type { WorkflowState } from '../workflows/core/state/types'

export interface PromptTransformWorkflowContext {
  workflow: WorkflowDefinition | null
  state: WorkflowState | null
  currentStage: string | null
  stageDefinition: WorkflowStageDefinition | null
}

export interface PromptInjectionRequest extends PromptTransformWorkflowContext {
  systemMessages: string[]
}

export interface PromptInjectionProvider {
  id: string
  inject(input: PromptInjectionRequest): string | null | Promise<string | null>
}
