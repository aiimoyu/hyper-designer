import { describe, expect, it } from 'vitest'

import { bootstrapPluginRegistries, sdk } from '../../../sdk'
import { getWorkflowDefinition } from '../../../workflows/core'

describe('sdk facade', () => {
  it('loads user plugins only after explicit bootstrap', async () => {
    sdk.workflow.plugins.clear()
    sdk.agent.plugins.clear()

    await bootstrapPluginRegistries()

    expect(sdk.workflow.plugins.list()).toContain('classic')
    expect(sdk.workflow.plugins.list()).toContain('projectAnalysis')
    expect(sdk.workflow.plugins.list()).toContain('lite-designer')
    expect(sdk.workflow.plugins.list()).toContain('userExampleWorkflow')
  })

  it('exposes unified workflow and agent plugin capabilities from single sdk object', async () => {
    sdk.workflow.plugins.clear()
    sdk.agent.plugins.clear()

    sdk.workflow.plugins.register(() => ({
      id: 'sdk-facade-workflow',
      name: 'SDK Facade Workflow',
      description: 'workflow via sdk facade',
      entryStageId: 's1',
      stages: {
        s1: {
          stageId: 's1',
          name: 'S1',
          description: 'S1',
          agent: 'HArchitect',
          getHandoverPrompt: () => 'handover',
        },
      },
    }))

    sdk.agent.plugins.register('SDKFacadeAgent', () => ({
      name: 'SDKFacadeAgent',
      description: 'agent via sdk facade',
      mode: 'subagent',
      prompt: 'sdk facade prompt',
    }))

    const pluginAgents = await sdk.agent.plugins.create()

    expect(sdk.workflow.plugins.list()).toContain('sdk-facade-workflow')
    expect(getWorkflowDefinition('sdk-facade-workflow')?.id).toBe('sdk-facade-workflow')
    expect(pluginAgents.SDKFacadeAgent.name).toBe('SDKFacadeAgent')
  })
})
