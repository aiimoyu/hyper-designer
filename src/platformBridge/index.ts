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
