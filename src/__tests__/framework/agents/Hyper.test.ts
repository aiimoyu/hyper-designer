import { describe, it, expect } from "vitest"
import { createHyperAgent } from "../../../agents/Hyper"
import {
  BUILTIN_AGENT_FACTORIES,
  HD_BUILTIN_AGENT_NAMES,
  isHDBuiltinAgent,
} from "../../../agents/utils"

describe("Hyper agent", () => {
  it("creates Hyper agent config", () => {
    const agent = createHyperAgent()

    expect(agent).toMatchObject({
      name: "Hyper",
      description: expect.any(String),
      mode: "primary",
      temperature: expect.any(Number),
      prompt: expect.any(String),
    })
  })

  it("exposes mode on factory", () => {
    expect(createHyperAgent.mode).toBe("primary")
  })

  it("is not included in builtin factory registry", () => {
    expect(BUILTIN_AGENT_FACTORIES).not.toHaveProperty("Hyper")
    expect(HD_BUILTIN_AGENT_NAMES).not.toContain("Hyper")
    expect(isHDBuiltinAgent("Hyper")).toBe(false)
  })
})
