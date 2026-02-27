import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { createHEngineerAgent } from "../../../agents/HEngineer"
import { createHCriticAgent } from "../../../agents/HCritic"

describe("tool config compliance", () => {
  describe("HArchitect", () => {
    it("defaultTools has hd_submit: true", () => {
      const agent = createHArchitectAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_submit).toBe(true)
    })
  })

  describe("HEngineer", () => {
    it("defaultTools has hd_submit: true", () => {
      const agent = createHEngineerAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_submit).toBe(true)
    })
  })

  describe("HCritic", () => {
    it("defaultTools has task: false", () => {
      const agent = createHCriticAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.task).toBe(false)
    })

    it("defaultTools has hd_submit: false", () => {
      const agent = createHCriticAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_submit).toBe(false)
    })
  })
})
