// src/index.ts

// Types
export type { AgentConfig, AgentMode, AgentFactory, AgentPromptMetadata, BuiltinAgentName } from "./agents/types"
export type { AgentOverrideConfig, HDConfig } from "./config/loader"
export type { WorkflowStage, WorkflowState } from "./workflows"
export type { AgentDefinition, PromptGenerator } from "./agents/factory"
export { filePrompt, toolsPrompt } from "./agents/factory"
export type { WorkflowDefinition, WorkflowStageDefinition } from "./workflows"


// Agent creation
export { createBuiltinAgents } from "./agents/utils"
export { createAgent } from "./agents/factory"
export { createHCollectorAgent } from "./agents/HCollector"
export { createHArchitectAgent } from "./agents/HArchitect"
export { createHCriticAgent } from "./agents/HCritic"
export { createHEngineerAgent } from "./agents/HEngineer"

// Workflow state management
export {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
} from "./workflows"

// Workflow registry
export { getWorkflowDefinition, getAvailableWorkflows } from "./workflows"

// Workflow data
export { getHandoverAgent, getHandoverPrompt } from "./workflows"
export { loadPromptForStage } from "./workflows"

// Config
export { loadHDConfig } from "./config/loader"
