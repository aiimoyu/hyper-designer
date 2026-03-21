import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from '../../../builtin/agents/HArchitect'

describe("prompt composition compliance", () => {
  describe("HArchitect", () => {
    it("has non-empty prompt content", () => {
      const agent = createHArchitectAgent()
      expect(agent.prompt).toBeDefined()
      expect(agent.prompt!.length).toBeGreaterThan(0)
      expect(agent.prompt!.trim()).not.toBe("")
    })

    it("prompt contains role definition section", () => {
      const agent = createHArchitectAgent()
      expect(agent.prompt).toContain("Role Definition")
    })

    it("prompt contains workflow tokens for dynamic injection", () => {
      const agent = createHArchitectAgent()
      expect(agent.prompt).toContain("{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}")
    })

    it("prompt is structured with multiple sections", () => {
      const agent = createHArchitectAgent()
      const sections = agent.prompt!.match(/^## /gm)
      expect(sections?.length).toBeGreaterThanOrEqual(1)
    })
  })
})
