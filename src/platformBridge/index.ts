export type {
  NativePlatformCapabilities,
  CompositePlatformCapabilities,
  PlatformCapabilities,
  PlatformAdapter,
  SendPromptParams,
  SendPromptResult,
  PlatformToolRegistration,
} from './capabilities/types'
export {
  createOpenCodeAdapter,
  createOpenCodePlatformCapabilities,
  resolveDefaultModel,
  type ModelInfo,
} from './platform/opencode/capabilities'

export type {
  PlatformOrchestrator,
  PlatformOrchestratorPluginHooks,
  CreateOpenCodeOrchestratorInput,
} from './orchestration/types'
export {
  createOpenCodePlatformOrchestrator,
  mapLocalAgentsToOpenCode,
  buildOpenCodeMappedAgents,
  buildOpenCodeWorkflowTools,
} from './platform/opencode/orchestrator'
export { createDocumentReviewTools } from './platform/opencode/tools/documentReview'
export { createWorkflowHooks } from './platform/opencode/workflows'
export { convertWorkflowToolsToOpenCode } from './platform/opencode/workflows/workflow-tools'
export { createTransformHooks } from './platform/opencode/transform/hooks'
export { createAgentTransformer } from './platform/opencode/transform/agent-transform'
export { createUsingHyperDesignerTransformer } from './platform/opencode/transform/using-hyperdesigner-transform'
export { createSystemTransformer } from './platform/opencode/transform/system-transform'
