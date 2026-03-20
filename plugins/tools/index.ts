import type { ToolPluginRegistration } from '../../src/sdk/contracts'
import {
  buildPluginRegistrations,
  toToolPluginRegistrations,
} from '../../src/plugin'
import { EXAMPLE_USER_PLUGIN } from '../example'

const registrations = await buildPluginRegistrations([EXAMPLE_USER_PLUGIN])

export const USER_TOOL_PLUGINS: ToolPluginRegistration[] =
  toToolPluginRegistrations(registrations.tool)
