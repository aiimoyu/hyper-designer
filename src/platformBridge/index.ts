export type {
  NativePlatformCapabilities,
  CompositePlatformCapabilities,
  PlatformCapabilities,
} from './capabilities/types'
export { createOpenCodePlatformCapabilities } from './capabilities/opencode'

export type {
  PlatformOrchestrator,
  PlatformOrchestratorPluginHooks,
  CreateOpenCodeOrchestratorInput,
} from './orchestration/types'
export {
  createOpenCodePlatformOrchestrator,
  mapLocalAgentsToOpenCode,
  buildOpenCodeWorkflowTools,
} from './orchestration/opencode'
