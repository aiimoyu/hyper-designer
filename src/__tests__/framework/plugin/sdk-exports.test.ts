import { describe, expect, it } from 'vitest'

import { bootstrapSDK, resetSDKForTest, sdk } from '../../../sdk'
import { getWorkflowDefinition } from '../../../workflows'

describe('plugins sdk exports', () => {
  it('exports workflow and agent plugin APIs from sdk entry', async () => {
    sdk.workflow.plugins.clear()
    sdk.agent.plugins.clear()
    resetSDKForTest()
    await bootstrapSDK({ plugins: [] })

    sdk.workflow.plugins.register(() => ({
      id: 'sdk-workflow',
      name: 'SDK Workflow',
      description: 'workflow via sdk export',
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

    sdk.agent.plugins.register('SDKAgent', () => ({
      name: 'SDKAgent',
      description: 'sdk agent',
      mode: 'subagent',
      prompt: 'sdk prompt',
    }))

    const pluginAgents = await sdk.agent.plugins.create()
    const pluginWorkflow = getWorkflowDefinition('sdk-workflow')

    expect(pluginWorkflow?.id).toBe('sdk-workflow')
    expect(pluginAgents.SDKAgent.name).toBe('SDKAgent')
  })

  it('exports unified sdk facade object', async () => {
    sdk.workflow.plugins.clear()
    sdk.agent.plugins.clear()
    resetSDKForTest()
    await bootstrapSDK({ plugins: [] })

    sdk.workflow.plugins.register(() => ({
      id: 'sdk-unified-export',
      name: 'SDK Unified Export',
      description: 'sdk object workflow',
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

    sdk.agent.plugins.register('SDKUnifiedAgent', () => ({
      name: 'SDKUnifiedAgent',
      description: 'sdk unified agent',
      mode: 'subagent',
      prompt: 'sdk unified prompt',
    }))

    const pluginAgents = await sdk.agent.plugins.create()
    expect(getWorkflowDefinition('sdk-unified-export')?.id).toBe('sdk-unified-export')
    expect(pluginAgents.SDKUnifiedAgent.name).toBe('SDKUnifiedAgent')
  })
})
