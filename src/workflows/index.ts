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
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
} from "./core/state"


export { getHandoverAgent, getHandoverPrompt } from "./core/runtime"
export { loadPromptForStage } from "./core/runtime"

export { classicWorkflow } from '../plugins/workflows/classic'
export { liteWorkflow } from '../plugins/workflows/lite'
export { projectAnalysisWorkflow } from '../plugins/workflows/projectAnalysis'

export { WorkflowService, workflowService } from "./core/service"


// 工具注册系统
export type {
  ToolDefinition,
  ToolContext,
  ToolParamSchema,
  ToolParamsSchema,
  ToolRegistration,
} from './core/toolTypes'
export { ToolRegistry, toolRegistry } from './core/toolRegistry'
