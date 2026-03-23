import type { WorkflowDefinition } from './types'
import { HyperDesignerLogger } from '../utils/logger'
import {
  getAvailableWorkflowPlugins,
  getWorkflowPluginDefinition,
} from './pluginRegistry'

export function getWorkflowDefinition(typeId: string): WorkflowDefinition | null {
  const workflow = getWorkflowPluginDefinition(typeId)
  if (!workflow) {
    HyperDesignerLogger.warn("Workflow", `未知的工作流类型`, {
      workflowId: typeId,
      availableWorkflows: getAvailableWorkflows(),
    })
    return null
  }
  return workflow
}

export function getAvailableWorkflows(): string[] {
  return getAvailableWorkflowPlugins()
}
