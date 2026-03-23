import type { ToolPluginRegistration } from '../../src/types'
import { buildRegistrations } from '../../src/plugin'
import { EXAMPLE_USER_PLUGIN } from '../example'

const registrations = await buildRegistrations([EXAMPLE_USER_PLUGIN])

export const USER_TOOL_PLUGINS: ToolPluginRegistration[] = Object.entries(registrations.tool).map(([name, tool]) => ({
  name,
  factory: () => tool,
}))
