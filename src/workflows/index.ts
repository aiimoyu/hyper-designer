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
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
} from "./core/state"

export { getHandoverAgent, getHandoverPrompt } from "./core/handover"
export { loadPromptForStage } from "./core/prompts"

export { traditionalWorkflow } from "./plugins/traditional"
export { openSourceWorkflow } from "./plugins/open-source"
