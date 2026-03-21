import { describe, it, expect } from "vitest"
import { bootstrapSDK, resetSDKBootstrapForTest, sdk } from '../../../sdk'
import {
  BUILTIN_AGENT_FACTORIES,
  HD_BUILTIN_AGENT_NAMES,
  isHDAgent,
  isHDPluginAgent,
  isHDBuiltinAgent,
  createBuiltinAgents,
  createAllAgents,
} from "../../../agents/utils"

describe("agents utils", () => {
  it('setup plugin registries for this suite', async () => {
    sdk.agent.plugins.clear()
    resetSDKBootstrapForTest()
    await bootstrapSDK()
    expect(sdk.agent.plugins.list().length).toBeGreaterThan(0)
  })

  it("keeps builtin names aligned with factories", () => {
    const factoryNames = Object.keys(BUILTIN_AGENT_FACTORIES)
    expect(HD_BUILTIN_AGENT_NAMES).toEqual(factoryNames)
  })

  it("isHDBuiltinAgent matches builtin names", () => {
    for (const name of HD_BUILTIN_AGENT_NAMES) {
      expect(isHDBuiltinAgent(name)).toBe(true)
    }

    expect(isHDBuiltinAgent("NotAnAgent")).toBe(false)
    expect(isHDBuiltinAgent(undefined)).toBe(false)
  })

  it("createBuiltinAgents returns keys matching builtin names", async () => {
    const agents = await createBuiltinAgents("opencode")
    expect(Object.keys(agents)).toEqual(HD_BUILTIN_AGENT_NAMES)
  })

  it('user plugin agent is available and recognized as plugin agent', async () => {
    const allAgents = await createAllAgents()
    expect(allAgents.UserExampleAgent).toBeDefined()
    expect(isHDPluginAgent('UserExampleAgent')).toBe(true)
    expect(isHDAgent('UserExampleAgent')).toBe(true)
  })
})
