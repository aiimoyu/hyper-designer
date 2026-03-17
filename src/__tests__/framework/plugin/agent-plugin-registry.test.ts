import { beforeEach, describe, expect, it } from 'vitest'

import type { AgentConfig } from '../../../agents/types'
import {
  clearAgentPluginsForTest,
  createPluginAgents,
  registerAgentPlugin,
} from '../../../plugins/agent'

describe('agent plugin registry', () => {
  beforeEach(() => {
    clearAgentPluginsForTest()
  })

  it('registers plugin agent factory and can create plugin agents', async () => {
    registerAgentPlugin('DemoAgent', () => {
      const config: AgentConfig = {
        name: 'DemoAgent',
        description: 'Plugin demo agent',
        mode: 'subagent',
        prompt: 'plugin prompt',
      }
      return config
    })

    const agents = await createPluginAgents('test-model')

    expect(Object.keys(agents)).toContain('DemoAgent')
    expect(agents.DemoAgent.name).toBe('DemoAgent')
    expect(agents.DemoAgent.prompt).toContain('plugin prompt')
  })
})
