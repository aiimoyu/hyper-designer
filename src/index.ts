// src/index.ts

// Types
export type { AgentConfig, AgentMode, AgentFactory, AgentPromptMetadata, BuiltinAgentName } from "./agents/types"
export type { AgentOverrideConfig, HDConfig } from "./config/loader"
export type { WorkflowStage, WorkflowState } from "./workflows/state"
export type { SessionPromptSender, SkillLoader } from "./adapters/types"
export type { AgentDefinition, PromptGenerator } from "./agents/factory"
export { filePrompt, toolsPrompt } from "./agents/factory"
export type { HandoverConfig } from "./adapters/types"
export type { WorkflowDefinition, WorkflowStageDefinition } from "./workflows/types"


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
  getStageOrder
} from "./workflows/state"

// Workflow registry
export { getWorkflowDefinition, getAvailableWorkflows } from "./workflows/registry"

// Workflow data
export { getHandoverAgent, getHandoverPrompt } from "./workflows/handover"
export { loadPromptForStage } from "./workflows/prompts"

// Config
export { loadHDConfig } from "./config/loader"

// Utils
export { debug } from "./utils/debug"