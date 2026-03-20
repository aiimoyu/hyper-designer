import { describe, expect, it } from 'vitest'

import type { AgentPluginRegistration, WorkflowPluginRegistration } from '../../../sdk'
import { USER_AGENT_PLUGINS } from '../../../../plugins/agents'
import { USER_WORKFLOW_PLUGINS } from '../../../../plugins/workflows'

describe('user plugin directories contract', () => {
  it('loads user agent plugins from top-level plugins/agents', () => {
    const plugins = USER_AGENT_PLUGINS as AgentPluginRegistration[]
    expect(plugins.length).toBeGreaterThan(0)
    expect(plugins.map(item => item.name)).toContain('UserExampleAgent')
  })

  it('loads user workflow plugins from top-level plugins/workflows', () => {
    const plugins = USER_WORKFLOW_PLUGINS as WorkflowPluginRegistration[]
    const workflowIds = plugins.map(item => item.factory().id)

    expect(workflowIds).toContain('userExampleWorkflow')
  })
})
