/**
 * 工作流模块主入口
 * 
 * 提供工作流系统的完整 API 导出，包括：
 * 1. 类型定义：工作流定义、阶段定义、状态接口
 * 2. 工作流注册：定义获取、可用工作流列表
 * 3. 状态管理：工作流状态操作和阶段管理
 * 4. 交接处理：代理交接和提示词生成
 * 5. 内置工作流：经典和开源工作流
 */

export type { WorkflowDefinition, WorkflowStageDefinition } from "./core/types"
export type { WorkflowStage, WorkflowState } from "./core/state"

export {
  getWorkflowDefinition,
  getAvailableWorkflows,
} from "./core/registry"

export {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGatePassed,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
} from "./core/state"

export type { QualityGateResult } from "./core/gate"

export { createWorkflowQualityGate } from "./core/gate"

export { getHandoverAgent, getHandoverPrompt } from "./core/handover"
export { loadPromptForStage } from "./core/prompts"

export { classicWorkflow } from "./plugins/classic"
export { openSourceWorkflow } from "./plugins/open-source"
