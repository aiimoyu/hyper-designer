/**
 * Hyper Designer 主入口模块
 * 
 * 提供 Hyper Designer 插件的完整 API 导出，包括：
 * 1. 类型定义：代理配置、工作流状态、配置结构等
 * 2. 代理创建：所有内置代理的创建函数
 * 3. 工作流管理：状态管理、阶段管理、交接处理
 * 4. 配置管理：配置文件加载和解析
 * 5. 工具函数：：提示词生成、工作流注册等
 */

// Types
export type { AgentConfig, AgentMode, AgentFactory, AgentPromptMetadata, BuiltinAgentName } from "./agents/types"
export type { AgentOverrideConfig, HDConfig } from "./config/loader"
export type { WorkflowStage, WorkflowState } from "./workflows"
export type { AgentDefinition, PromptGenerator } from "./agents/factory"
export { filePrompt, stringPrompt } from "./agents/factory"
export type { WorkflowDefinition, WorkflowStageDefinition } from "./workflows"


// Agent creation
export { createBuiltinAgents } from "./agents/utils"
export { createAllAgents, isHDAgent, isHDPluginAgent } from './agents/utils'
export { createAgent } from "./agents/factory"
export { createHCollectorAgent } from "./agents/HCollector"
export { createHArchitectAgent } from "./agents/HArchitect"
export { createHCriticAgent } from "./agents/HCritic"
export { createHEngineerAgent } from "./agents/HEngineer"
export { createHAnalysisAgent } from "./agents/HAnalysis"

// Workflow state management
export {
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
} from "./workflows"

// Workflow service (primary interface)
export { workflowService } from "./workflows"

// Workflow registry
export { getWorkflowDefinition, getAvailableWorkflows } from "./workflows"

// Workflow data
export { getHandoverAgent, getHandoverPrompt } from "./workflows"
export { loadPromptForStage } from "./workflows"

// Config
export { loadHDConfig } from "./config/loader"

// Plugin SDK
export { sdk } from './sdk'
