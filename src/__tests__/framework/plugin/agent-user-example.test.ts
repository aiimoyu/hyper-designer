import { describe, expect, it } from 'vitest'

import { bootstrapSDK, resetSDKForTest, sdk } from '../../../sdk'

describe('agent user example', () => {
  it('loads UserExampleAgent from user plugin bootstrap', async () => {
    sdk.agent.plugins.clear()
    resetSDKForTest()
    await bootstrapSDK({ plugins: [] })

    const agents = await sdk.agent.plugins.create()

    expect(agents.UserExampleAgent).toBeDefined()
    expect(agents.UserExampleAgent.name).toBe('UserExampleAgent')
    expect(agents.UserExampleAgent.mode).toBe('subagent')
  })
})
