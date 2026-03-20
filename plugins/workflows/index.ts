import type { WorkflowPluginRegistration } from '../../src/sdk/contracts'
import {
  buildPluginRegistrations,
  toWorkflowPluginRegistrations,
} from '../../src/plugin'
import { EXAMPLE_USER_PLUGIN } from '../example'

const registrations = await buildPluginRegistrations([EXAMPLE_USER_PLUGIN])

export const USER_WORKFLOW_PLUGINS: WorkflowPluginRegistration[] =
  toWorkflowPluginRegistrations(registrations.workflow)
