import type { AgentPluginRegistration } from '../../src/sdk/contracts'
import {
  buildPluginRegistrations,
  toAgentPluginRegistrations,
} from '../../src/plugin'
import { EXAMPLE_USER_PLUGIN } from '../example'

const registrations = await buildPluginRegistrations([EXAMPLE_USER_PLUGIN])

export const USER_AGENT_PLUGINS: AgentPluginRegistration[] =
  toAgentPluginRegistrations(registrations.agent)
