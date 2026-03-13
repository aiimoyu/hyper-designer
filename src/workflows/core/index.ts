/**
 * 工作流核心模块
 *
 * 统一导出所有子模块的公开接口。
 *
 * 模块结构：
 * - types: 核心类型定义
 * - registry: 工作流注册表
 * - state: 状态管理（持久化、操作）
 * - service: 工作流服务层（WorkflowService）
 * - runtime: 运行时（交接、提示词加载）
 */

// Core types
export type {
  PlatformAdapter,
  StageHookFn,
  WorkflowPromptBindings,
  WorkflowStageDefinition,
  WorkflowDefinition,
} from './types'
export { filePrompt, stringPrompt } from './utils'

// Registry
export { getWorkflowDefinition, getAvailableWorkflows } from './registry'

// State module
export type { WorkflowStage, WorkflowState } from './state/types'
export {
  getStageOrder,
  initializeWorkflowState,
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGatePassed,
  setWorkflowGateResult,
  setWorkflowStageMilestone,
  executeWorkflowHandover,
} from './state'

// Service module
export { WorkflowService, workflowService } from './service'
export type { WorkflowServiceEvents } from './service'

// Runtime module
export {
  getHandoverAgent,
  getHandoverPrompt,
  loadPromptBindings,
  loadWorkflowPrompt,
  loadStagePrompt,
  loadPromptForStage,
  getFrameworkFallbackPrompt,
  resolvePromptBindingsForMode,
  FRAMEWORK_FALLBACK_PROMPT_TOKEN,
} from './runtime'
