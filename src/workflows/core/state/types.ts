/**
 * 工作流状态类型定义
 *
 * 定义工作流状态的数据结构，包括阶段状态和整体状态。
 */

/**
 * Represents the state of a single workflow stage
 */
export interface WorkflowStage {
  /** Whether the stage has been completed */
  isCompleted: boolean;
}

/**
 * Represents the overall state of a workflow
 */
export interface WorkflowState {
  /** Unique identifier for the workflow type */
  typeId: string;
  /** Map of stage names to their current state */
  workflow: Record<string, WorkflowStage>;
  /** Currently active step, or null if no step is active */
  currentStep: string | null;
  /** Step that the workflow is being handed over to, or null if no handover is pending */
  handoverTo: string | null;
  /** Whether the current stage passed quality gate */
  gatePassed: boolean;
}