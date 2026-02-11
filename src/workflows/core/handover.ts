import type { WorkflowDefinition } from "./types"

export function getHandoverAgent(definition: WorkflowDefinition, stage: string): string {
  const stageConfig = definition.stages[stage]
  if (!stageConfig) {
    throw new Error(`Unknown stage: ${stage}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
  }
  return stageConfig.agent
}

export function getHandoverPrompt(
  definition: WorkflowDefinition,
  currentStep: string | null,
  nextStep: string
): string {
  const stageConfig = definition.stages[nextStep]
  if (!stageConfig) {
    throw new Error(`Unknown stage: ${nextStep}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
  }
  if (!stageConfig.getHandoverPrompt) {
    throw new Error(`Stage "${nextStep}" does not define getHandoverPrompt function`)
  }
  return stageConfig.getHandoverPrompt(currentStep)
}
