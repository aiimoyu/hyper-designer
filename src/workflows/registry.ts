import type { WorkflowDefinition } from './types'
import { traditionalWorkflow } from './traditional'

const workflowRegistry: Record<string, WorkflowDefinition> = {
  traditional: traditionalWorkflow,
}

/**
 * Returns the workflow definition for the given workflow ID
 * @param workflowId - The unique identifier of the workflow
 * @returns The workflow definition
 * @throws Error if the workflow ID is not found
 */
export function getWorkflowDefinition(workflowId: string): WorkflowDefinition {
  const workflow = workflowRegistry[workflowId]
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}. Available: ${getAvailableWorkflows().join(', ')}`)
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