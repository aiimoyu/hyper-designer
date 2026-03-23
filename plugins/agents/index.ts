import type { AgentPluginRegistration } from '../../src/types'
import { buildRegistrations } from '../../src/plugin'
import { EXAMPLE_USER_PLUGIN } from '../example'

const registrations = await buildRegistrations([EXAMPLE_USER_PLUGIN])

export const USER_AGENT_PLUGINS: AgentPluginRegistration[] = Object.entries(registrations.agent).map(([name, config]) => ({
  name,
  factory: () => config,
}))
