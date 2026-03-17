import { BUILTIN_AGENT_PLUGINS } from './builtin'
import { registerAgentPlugins } from './registry'
import { USER_AGENT_PLUGINS } from './user'

let initialized = false

export function ensureAgentPluginsBootstrapped(): void {
  if (initialized) {
    return
  }

  registerAgentPlugins(BUILTIN_AGENT_PLUGINS)
  registerAgentPlugins(USER_AGENT_PLUGINS)
  initialized = true
}

export function resetAgentPluginBootstrapForTest(): void {
  initialized = false
}
