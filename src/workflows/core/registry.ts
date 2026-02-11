import type { WorkflowDefinition } from './types'
import { classicWorkflow } from '../plugins/classic'
import { openSourceWorkflow } from '../plugins/open-source'

const workflowRegistry: Record<string, WorkflowDefinition> = {
  classic: classicWorkflow,
  "open-source": openSourceWorkflow,
}

/**
 * Returns the workflow definition for the given workflow ID
 * @param typeId - The unique identifier of the workflow
 * @returns The workflow definition, or null if not found
 */
export function getWorkflowDefinition(typeId: string): WorkflowDefinition | null {
  const workflow = workflowRegistry[typeId]
  if (!workflow) {
    console.error(`[ERROR] Unknown workflow: ${typeId}. Available: ${getAvailableWorkflows().join(', ')}`)
    return null
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
