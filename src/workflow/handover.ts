import type { WorkflowDefinition } from "../workflows/types"

/**
 * Returns the agent responsible for a specific workflow stage
 * @param definition - The workflow definition
 * @param stage - The stage name
 * @returns The agent name for this stage
 * @throws Error if the stage is not found in the workflow definition
 */
export function getHandoverAgent(definition: WorkflowDefinition, stage: string): string {
  const stageConfig = definition.stages[stage]
  if (!stageConfig) {
    throw new Error(`Unknown stage: ${stage}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
  }
  return stageConfig.agent
}

/**
 * Returns the handover prompt for transitioning to a workflow stage
 * @param definition - The workflow definition
 * @param currentStep - The current stage (or null if starting)
 * @param nextStep - The next stage to transition to
 * @returns The handover prompt text
 * @throws Error if the next stage is not found in the workflow definition
 */
export function getHandoverPrompt(
  definition: WorkflowDefinition,
  currentStep: string | null,
  nextStep: string
): string {
  const stageConfig = definition.stages[nextStep]
  if (!stageConfig) {
    throw new Error(`Unknown stage: ${nextStep}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
  }
  return stageConfig.getHandoverPrompt(currentStep, nextStep)
}