import { describe, expect, it } from 'vitest'

import { bootstrapSDK, resetSDKBootstrapForTest, sdk } from '../../../sdk'

describe('agent user example', () => {
  it('loads UserExampleAgent from user plugin bootstrap', async () => {
    sdk.agent.plugins.clear()
    resetSDKBootstrapForTest()
    await bootstrapSDK()

    const agents = await sdk.agent.plugins.create()

    expect(agents.UserExampleAgent).toBeDefined()
    expect(agents.UserExampleAgent.name).toBe('UserExampleAgent')
    expect(agents.UserExampleAgent.mode).toBe('subagent')
  })
})
