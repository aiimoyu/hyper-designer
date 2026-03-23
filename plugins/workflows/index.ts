import type { WorkflowPluginRegistration } from '../../src/types'
import { buildRegistrations } from '../../src/plugin'
import { EXAMPLE_USER_PLUGIN } from '../example'

const registrations = await buildRegistrations([EXAMPLE_USER_PLUGIN])

export const USER_WORKFLOW_PLUGINS: WorkflowPluginRegistration[] = Object.values(registrations.workflow).map(def => ({
  factory: () => def,
}))
