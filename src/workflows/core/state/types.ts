/**
 * 工作流状态类型定义
 *
 * 定义工作流状态的数据结构，包括阶段状态和整体状态。
 */

/**
 * 质量门结果 - 记录某次质量门评审的得分和评语
 */
export interface GateResult {
  /** 质量评分（0-100），null 表示尚未评分 */
  score: number | null;
  /** 评审评语（摘要） */
  comment?: string | null;
  /** 产生此结果的阶段 key */
  stage?: string | null;
}

/**
 * Represents the state of a single workflow stage
 */
export interface WorkflowStage {
  /** Whether the stage has been completed */
  isCompleted: boolean;
  /** 该阶段最近一次质量门评审得分（0-100） */
  score?: number | null;
  /** 该阶段最近一次质量门评审评语 */
  comment?: string | null;
  /** 是否被选中执行（用于工作流选择时跳过某些阶段） */
  selected?: boolean;
}

/**
 * Current workflow stage state - contains all parameters for the active stage
 */
export interface CurrentStageState {
  /** The stage key (e.g., "IRAnalysis"), or null for initial handover */
  name: string | null;
  /** Current quality gate result for this stage */
  gateResult: GateResult | null;
  /** Target stage for the next handover, if scheduled */
  handoverTo: string | null;
  /** Failure count for this stage (resets on stage transition) */
  failureCount?: number;
}

/**
 * Represents the overall state of a workflow
 */
export interface WorkflowState {
  /** 是否已完成工作流选择初始化 */
  initialized: boolean;
  /** Unique identifier for the workflow type, null if not initialized */
  typeId: string | null;
  /** Map of stage names to their historical/completion state */
  workflow: Record<string, WorkflowStage>;
  /** 
   * Active stage details. Contains current stage name, gate results, and handover target.
   * Null if no stage is active.
   */
  current: CurrentStageState | null;
}