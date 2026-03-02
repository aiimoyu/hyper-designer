import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { createHEngineerAgent } from "../../../agents/HEngineer"
import { createHCriticAgent } from "../../../agents/HCritic"

describe("tool config compliance", () => {
  describe("HArchitect", () => {
    it("defaultTools has hd_workflow_state: true and hd_handover: true", () => {
      const agent = createHArchitectAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_workflow_state).toBe(true)
      expect(agent.tools!.hd_handover).toBe(true)
    })
  })

  describe("HEngineer", () => {
    it("defaultTools has hd_workflow_state: true and hd_handover: true", () => {
      const agent = createHEngineerAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_workflow_state).toBe(true)
      expect(agent.tools!.hd_handover).toBe(true)
    })
  })

  describe("HCritic", () => {
    it("defaultTools has hd_submit_evaluation: true", () => {
      const agent = createHCriticAgent()
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_submit_evaluation).toBe(true)
    })

    it("defaultTools has hd_submit_evaluation: false for HArchitect and HEngineer", () => {
      const architect = createHArchitectAgent()
      const engineer = createHEngineerAgent()
      expect(architect.tools).toBeDefined()
      expect(engineer.tools).toBeDefined()
      expect(architect.tools!.hd_submit_evaluation).toBe(false)
      expect(engineer.tools!.hd_submit_evaluation).toBe(false)
    })
  })
})
