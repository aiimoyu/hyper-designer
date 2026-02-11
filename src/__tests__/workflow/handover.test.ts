import { describe, it, expect } from "vitest"
import { getHandoverAgent, getHandoverPrompt } from "../../workflows/handover"
import { traditionalWorkflow } from "../../workflows/traditional"
import type { WorkflowDefinition } from "../../workflows/types"

describe("workflow/handover", () => {
  describe("getHandoverAgent", () => {
    it("should return the correct agent for dataCollection stage", () => {
      const agent = getHandoverAgent(traditionalWorkflow, "dataCollection")
      expect(agent).toBe("HCollector")
    })

    it("should return the correct agent for IRAnalysis stage", () => {
      const agent = getHandoverAgent(traditionalWorkflow, "IRAnalysis")
      expect(agent).toBe("HArchitect")
    })

    it("should return the correct agent for requirementDecomposition stage", () => {
      const agent = getHandoverAgent(traditionalWorkflow, "requirementDecomposition")


    })

    it("should throw error for unknown stage", () => {
      expect(() => getHandoverAgent(traditionalWorkflow, "unknownStage")).toThrow(
        "Unknown stage: unknownStage"
      )
    })

    it("should work with custom workflow definition", () => {
      const customWorkflow: WorkflowDefinition = {
        id: "custom",
        name: "Custom Workflow",
        description: "Test workflow",
        stageOrder: ["stage1", "stage2"],
        stages: {
          stage1: {
            name: "Stage 1",
            description: "First stage",
            agent: "Agent1",
            promptFile: "prompts/stage1.md",
            getHandoverPrompt: () => "Handover to stage 1",
          },
          stage2: {
            name: "Stage 2",
            description: "Second stage",
            agent: "Agent2",
            promptFile: "prompts/stage2.md",
            getHandoverPrompt: () => "Handover to stage 2",
          },
        },
      }

      const agent = getHandoverAgent(customWorkflow, "stage1")
      expect(agent).toBe("Agent1")
    })
  })

  describe("getHandoverPrompt", () => {
    it("should return non-empty prompt for dataCollection stage", () => {
      const prompt = getHandoverPrompt(traditionalWorkflow, null, "dataCollection")
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should return non-empty prompt for IRAnalysis stage", () => {
      const prompt = getHandoverPrompt(traditionalWorkflow, "dataCollection", "IRAnalysis")
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should include current step in prompt when provided", () => {
      const prompt = getHandoverPrompt(traditionalWorkflow, "dataCollection", "IRAnalysis")
      expect(prompt).toContain("dataCollection")
    })

    it("should generate different prompts for different stages", () => {
      const prompt1 = getHandoverPrompt(traditionalWorkflow, null, "dataCollection")
      const prompt2 = getHandoverPrompt(traditionalWorkflow, null, "IRAnalysis")
      expect(prompt1).not.toBe(prompt2)
    })

    it("should throw error for unknown stage", () => {
      expect(() => getHandoverPrompt(traditionalWorkflow, null, "unknownStage")).toThrow(
        "Unknown stage: unknownStage"
      )
    })

    it("should work with custom workflow definition", () => {
      const customWorkflow: WorkflowDefinition = {
        id: "custom",
        name: "Custom Workflow",
        description: "Test workflow",
        stageOrder: ["stage1", "stage2"],
        stages: {
          stage1: {
            name: "Stage 1",
            description: "First stage",
            agent: "Agent1",
            promptFile: "prompts/stage1.md",
            getHandoverPrompt: (current, next) => `Moving from ${current} to ${next}`,
          },
          stage2: {
            name: "Stage 2",
            description: "Second stage",
            agent: "Agent2",
            promptFile: "prompts/stage2.md",
            getHandoverPrompt: (current, next) => `Transitioning from ${current} to ${next}`,
          },
        },
      }

      const prompt = getHandoverPrompt(customWorkflow, "stage1", "stage2")
      expect(prompt).toBe("Transitioning from stage1 to stage2")
    })
  })
})
