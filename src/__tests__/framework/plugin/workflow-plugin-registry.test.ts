import { beforeEach, describe, expect, it } from 'vitest'

import type { WorkflowDefinition } from '../../../workflows/core'
import {
  getAvailableWorkflows,
  getWorkflowDefinition,
} from '../../../workflows/core'
import {
  resetWorkflowPluginBootstrapForTest,
  clearWorkflowPluginsForTest,
  registerWorkflowPlugin,
} from '../../../plugins/workflow'

describe('workflow plugin registry', () => {
  beforeEach(() => {
    clearWorkflowPluginsForTest()
    resetWorkflowPluginBootstrapForTest()
  })

  it('registers plugin workflow into core workflow registry view', () => {
    const pluginWorkflow: WorkflowDefinition = {
      id: 'plugin-demo-workflow',
      name: 'Plugin Demo Workflow',
      description: 'A workflow provided by plugin registry',
      entryStageId: 'stageA',
      stages: {
        stageA: {
          stageId: 'stageA',
          name: 'Stage A',
          description: 'first stage',
          agent: 'HArchitect',
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    registerWorkflowPlugin(pluginWorkflow.id, () => pluginWorkflow)

    expect(getAvailableWorkflows()).toContain('plugin-demo-workflow')
    expect(getWorkflowDefinition('plugin-demo-workflow')).toBe(pluginWorkflow)
  })
})
