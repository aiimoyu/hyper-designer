// src/index.ts

// Types
export type { AgentConfig, AgentMode, AgentFactory, AgentPromptMetadata, BuiltinAgentName } from "./agents/types"
export type { AgentOverrideConfig, HDConfig } from "./config/loader"
export type { WorkflowStage, Workflow, WorkflowState } from "./workflow/state"
export type { SessionPromptSender, SkillLoader } from "./adapters/types"
export type { AgentDefinition } from "./agents/factory"
export type { HandoverConfig } from "./adapters/types"

// Agent creation
export { createBuiltinAgents } from "./agents/utils"
export { createAgent } from "./agents/factory"
export { createHCollectorAgent } from "./agents/HCollector"
export { createHArchitectAgent } from "./agents/HArchitect"
export { createHCriticAgent } from "./agents/HCritic"
export { createHEngineerAgent } from "./agents/HEngineer"

// Workflow state management
export { getWorkflowState, setWorkflowStage, setWorkflowCurrent, setWorkflowHandover } from "./workflow/state"

// Workflow data
export { HANDOVER_CONFIG } from "./workflow/handover"
export { loadPromptForStage } from "./workflow/prompts"

// Config
export { loadHDConfig } from "./config/loader"

// Utils
export { debug } from "./utils/debug"