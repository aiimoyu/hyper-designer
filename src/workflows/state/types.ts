/**
 * 工作流状态类型定义
 *
 * 定义工作流状态的数据结构，包括阶段状态和整体状态。
 */

import type { StageMilestoneRecord, GateMilestoneDetail } from '../stageMilestone/types'

export type StageMilestone = StageMilestoneRecord
export type { GateMilestoneDetail }
/**
 * Represents the state of a single workflow stage
 */
export interface WorkflowStage {
  /** Whether the stage has been completed */
  isCompleted: boolean;
  /** 是否被选中执行（用于工作流选择时跳过某些阶段） */
  selected?: boolean;
  /** 前一个阶段的 key（null 表示无前驱） */
  previousStage?: string | null;
  /** 后一个阶段的 key（null 表示无后继） */
  nextStage?: string | null;
}

/**
 * Current workflow stage state - contains all parameters for the active stage
 */
export interface CurrentStageState {
  /** The stage key (e.g., "IRAnalysis"), or null for initial handover */
  name: string | null;
  /** Target stage for the next handover, if scheduled */
  handoverTo: string | null;
  agent?: string;
  previousStage?: string | null;
  nextStage?: string | null;
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
  /** 项目根目录路径，初始化时锁定，用于解析所有相对路径 */
  projectRoot: string | null;
  /** Map of stage names to their historical/completion state */
  workflow: Record<string, WorkflowStage>;
  /** 
   * Active stage details. Contains current stage name and handover target.
   * Null if no stage is active.
   */
  current: CurrentStageState | null;
  instance?: WorkflowInstanceState | null;
  runtime?: WorkflowRuntimeState | null;
  history?: WorkflowHistoryState;
}

export interface WorkflowCurrentMilestone {
  isCompleted: boolean;
  detail: unknown;
  updatedAt: string;
}

export interface WorkflowCurrentNodeContext {
  nodeId: string;
  visit: number;
  attempt: number;
  milestones: Record<string, WorkflowCurrentMilestone>;
  info: Record<string, unknown>;
}

export interface WorkflowFlowState {
  fromNodeId: string | null;
  currentNodeId: string | null;
  nextNodeId: string | null;
  lastEventSeq: number;
}

export interface WorkflowRuntimeState {
  status: 'running' | 'completed' | 'failed';
  flow: WorkflowFlowState;
  currentNodeContext: WorkflowCurrentNodeContext | null;
}

export interface WorkflowInstanceNodePlan {
  nodeId: string;
  stageId: string;
  kind: 'before' | 'main' | 'after';
  hookId?: string;
  agent?: string;
  model?: { providerID: string; modelID: string };
  variant?: string;
  fromNodeId: string | null;
  nextNodeId: string | null;
}

export interface WorkflowInstanceState {
  instanceId: string;
  workflowId: string;
  workflowVersion: string;
  selectedStageIds: string[];
  skippedStageIds: string[];
  entryNodeId: string;
  nodePlan: Record<string, WorkflowInstanceNodePlan>;
}

export interface WorkflowHistoryBaseEvent {
  seq: number;
  at: string;
  type: string;
  runId: string;
}

export interface WorkflowHistoryEvent extends WorkflowHistoryBaseEvent {
  nodeId?: string;
  fromNodeId?: string | null;
  toNodeId?: string | null;
  reason?: string;
  key?: string;
  value?: unknown;
  patch?: Record<string, unknown>;
}

export interface WorkflowHistoryState {
  events: WorkflowHistoryEvent[];
}
