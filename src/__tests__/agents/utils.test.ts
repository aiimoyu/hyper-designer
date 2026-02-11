import { describe, it, expect } from "vitest"
import {
  BUILTIN_AGENT_FACTORIES,
  HD_BUILTIN_AGENT_NAMES,
  isHDBuiltinAgent,
  createBuiltinAgents,
} from "../../agents/utils"

describe("agents utils", () => {
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
})
