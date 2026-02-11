import type { WorkflowDefinition } from "./types"

export function getHandoverAgent(definition: WorkflowDefinition, stage: string): string | null {
  const stageConfig = definition.stages[stage]
  if (!stageConfig) {
    console.error(`[ERROR] Unknown stage: ${stage}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
    return null
  }
  return stageConfig.agent
}

export function getHandoverPrompt(
  definition: WorkflowDefinition,
  currentStep: string | null,
  nextStep: string
): string | null {
  const stageConfig = definition.stages[nextStep]
  if (!stageConfig) {
    console.error(`[ERROR] Unknown stage: ${nextStep}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
    return null
  }
  if (!stageConfig.getHandoverPrompt) {
    console.error(`[ERROR] Stage "${nextStep}" does not define getHandoverPrompt function`)
    return null
  }
  return stageConfig.getHandoverPrompt(currentStep)
}
