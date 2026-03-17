import { BUILTIN_WORKFLOW_PLUGINS } from './builtin'
import { registerWorkflowPlugins } from './registry'
import { USER_WORKFLOW_PLUGINS } from './user'

let initialized = false

export function ensureWorkflowPluginsBootstrapped(): void {
  if (initialized) {
    return
  }

  registerWorkflowPlugins(BUILTIN_WORKFLOW_PLUGINS)
  registerWorkflowPlugins(USER_WORKFLOW_PLUGINS)
  initialized = true
}

export function resetWorkflowPluginBootstrapForTest(): void {
  initialized = false
}
