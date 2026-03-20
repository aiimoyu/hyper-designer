/**
 * 工作流注册表模块
 * 
 * 负责管理工作流定义的注册和检索，包括：
 * 1. 维护工作流定义的注册表
 * 2. 根据工作流ID获取对应的定义
 * 3. 提供可用工作流列表
 */

import type { WorkflowDefinition } from './types'
import { HyperDesignerLogger } from '../../utils/logger'
import { getStageOrder } from './stageOrder'
import {
  ensureWorkflowPluginsBootstrapped,
  getAvailableWorkflowPlugins,
  getWorkflowPluginDefinition,
} from './pluginRegistry'

/**
 * Returns the workflow definition for the given workflow ID
 * @param typeId - The unique identifier of the workflow
 * @returns The workflow definition, or null if not found
 */
export function getWorkflowDefinition(typeId: string): WorkflowDefinition | null {
  ensureWorkflowPluginsBootstrapped()
  const workflow = getWorkflowPluginDefinition(typeId)
  if (!workflow) {
    HyperDesignerLogger.warn("Workflow", `未知的工作流类型`, {
      workflowId: typeId,
      availableWorkflows: getAvailableWorkflows(),
      action: "getWorkflowDefinition",
      error: `Unknown workflow: ${typeId}`
    })
    return null
  }
  
  HyperDesignerLogger.debug("Workflow", `获取工作流定义`, {
    workflowId: typeId,
    stageCount: getStageOrder(workflow).length
  })
  
  return workflow
}

/**
 * Returns a list of available workflow IDs
 * @returns Array of workflow IDs
 */
export function getAvailableWorkflows(): string[] {
  ensureWorkflowPluginsBootstrapped()
  return getAvailableWorkflowPlugins()
}
