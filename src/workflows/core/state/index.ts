/**
 * 工作流状态管理模块
 *
 * 统一导出状态类型、持久化函数和操作函数。
 */

// Types
export type { WorkflowStage, WorkflowState, StageMilestone, GateMilestoneDetail } from "./types";

// Persistence
export { readWorkflowStateFile, writeWorkflowStateFile, getWorkflowStatePath } from "./persistence";

export {
  appendHistoryEvent,
  flushCurrentNodeContextToHistory,
  patchCurrentNodeInfo,
  setCurrentNodeContext,
  setCurrentNodeMilestone,
} from './history'

// Operations
export {
  getStageOrder,
  initializeWorkflowState,
  getWorkflowState,
  ensureWorkflowStateExists,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGateResult,
  setWorkflowStageMilestone,
  executeWorkflowHandover,
  forceWorkflowNextStep,
  areRequiredMilestonesCompletedForStage,
} from "./operations";
