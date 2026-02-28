/**
 * 工作流状态管理模块
 *
 * 统一导出状态类型、持久化函数和操作函数。
 */

// Types
export type { WorkflowStage, WorkflowState } from "./types";

// Persistence
export { readWorkflowStateFile, writeWorkflowStateFile, getWorkflowStatePath } from "./persistence";

// Operations
export {
  getStageOrder,
  initializeWorkflowState,
  getWorkflowState,
  ensureWorkflowStateExists,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGatePassed,
  executeWorkflowHandover,
} from "./operations";