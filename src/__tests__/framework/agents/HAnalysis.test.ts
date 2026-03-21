import { describe, it, expect } from "vitest"
import {
  BUILTIN_AGENT_FACTORIES,
  HD_BUILTIN_AGENT_NAMES,
  isHDBuiltinAgent,
  createBuiltinAgents,
} from "../../../agents/utils"
import type { AgentConfig } from "../../../agents/types"

describe("HAnalysis agent", () => {
  describe("builtin registry", () => {
    it("includes HAnalysis in BUILTIN_AGENT_FACTORIES", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      expect(typeof BUILTIN_AGENT_FACTORIES.HAnalysis).toBe("function")
    })

    it("includes HAnalysis in HD_BUILTIN_AGENT_NAMES", () => {
      expect(HD_BUILTIN_AGENT_NAMES).toContain("HAnalysis")
    })

    it("isHDBuiltinAgent recognizes HAnalysis", () => {
      expect(isHDBuiltinAgent("HAnalysis")).toBe(true)
    })

    it("createBuiltinAgents returns HAnalysis agent", async () => {
      const agents = await createBuiltinAgents()
      expect(agents).toHaveProperty("HAnalysis")
      expect(agents.HAnalysis).toMatchObject({
        name: "HAnalysis",
        mode: expect.any(String),
      })
    })
  })

  describe("agent creation", () => {
    it("createHAnalysisAgent returns valid AgentConfig", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      expect(typeof factory).toBe("function")

      const agent = factory()

      expect(agent).toMatchObject<Partial<AgentConfig>>({
        name: "HAnalysis",
        description: expect.any(String),
        mode: expect.any(String),
        color: expect.any(String),
        temperature: expect.any(Number),
        maxTokens: expect.any(Number),
        prompt: expect.any(String),
        permission: expect.any(Object),
      })
    })

    it("createHAnalysisAgent has correct mode", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory()

      expect(agent.mode).toBe("primary")
    })

    it("createHAnalysisAgent accepts model override", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory("gpt-4")

      expect(agent.model).toBe("gpt-4")
    })
  })

  describe("prompt composition", () => {
    it("has non-empty prompt content", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory()

      expect(agent.prompt).toBeDefined()
      expect(agent.prompt!.length).toBeGreaterThan(0)
      expect(agent.prompt!.trim()).not.toBe("")
    })

    it("prompt contains workflow tokens for dynamic injection", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory()

      expect(agent.prompt).toContain("{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}")
      expect(agent.prompt).toContain("{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}")
    })

    it("prompt is structured with content sections", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory()

      expect(agent.prompt).toContain("HAnalysis")
      expect(agent.prompt!.length).toBeGreaterThan(100)
    })
  })

  describe("permissions", () => {
    it("has defined default permissions", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory()

      expect(agent.permission).toBeDefined()
      expect(typeof agent.permission).toBe("object")
    })

    it("includes workflow-related permissions", () => {
      expect(BUILTIN_AGENT_FACTORIES).toHaveProperty("HAnalysis")
      const factory = BUILTIN_AGENT_FACTORIES.HAnalysis
      const agent = factory()

      expect(agent.permission).toHaveProperty("hd_workflow_state")
      expect(agent.permission).toHaveProperty("hd_handover")
    })
  })
})
