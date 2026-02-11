import type { WorkflowDefinition } from './types'
import { traditionalWorkflow } from '../plugins/traditional'
import { openSourceWorkflow } from '../plugins/open-source'

const workflowRegistry: Record<string, WorkflowDefinition> = {
  traditional: traditionalWorkflow,
  "open-source": openSourceWorkflow,
}

/**
 * Returns the workflow definition for the given workflow ID
 * @param typeId - The unique identifier of the workflow
 * @returns The workflow definition
 * @throws Error if the workflow ID is not found
 */
export function getWorkflowDefinition(typeId: string): WorkflowDefinition {
  const workflow = workflowRegistry[typeId]
  if (!workflow) {
    throw new Error(`Unknown workflow: ${typeId}. Available: ${getAvailableWorkflows().join(', ')}`)
  }
  return workflow
}

/**
 * Returns a list of available workflow IDs
 * @returns Array of workflow IDs
 */
export function getAvailableWorkflows(): string[] {
  return Object.keys(workflowRegistry)
}
