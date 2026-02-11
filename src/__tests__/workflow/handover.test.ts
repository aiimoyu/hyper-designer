import { describe, it, expect } from "vitest"
import { getHandoverAgent, getHandoverPrompt } from "../../workflows/core/handover"
import { classicWorkflow } from "../../workflows/plugins/classic"
import type { WorkflowDefinition } from "../../workflows/core/types"

describe("workflow/handover", () => {
  describe("getHandoverAgent", () => {
    it("should return the correct agent for dataCollection stage", () => {
      const agent = getHandoverAgent(classicWorkflow, "dataCollection")
      expect(agent).toBe("HCollector")
    })

    it("should return the correct agent for IRAnalysis stage", () => {
      const agent = getHandoverAgent(classicWorkflow, "IRAnalysis")
      expect(agent).toBe("HArchitect")
    })

    it("should return the correct agent for requirementDecomposition stage", () => {
      const agent = getHandoverAgent(classicWorkflow, "requirementDecomposition")
      expect(agent).toBe("HEngineer")
    })

    it("should throw error for unknown stage", () => {
      expect(() => getHandoverAgent(classicWorkflow, "unknownStage")).toThrow(
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
      const prompt = getHandoverPrompt(classicWorkflow, null, "dataCollection")
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should return non-empty prompt for IRAnalysis stage", () => {
      const prompt = getHandoverPrompt(classicWorkflow, "dataCollection", "IRAnalysis")
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should include current step in prompt when provided", () => {
      const prompt = getHandoverPrompt(classicWorkflow, "dataCollection", "IRAnalysis")
      expect(prompt).toContain("dataCollection")
    })

    it("should generate different prompts for different stages", () => {
      const prompt1 = getHandoverPrompt(classicWorkflow, null, "dataCollection")
      const prompt2 = getHandoverPrompt(classicWorkflow, null, "IRAnalysis")
      expect(prompt1).not.toBe(prompt2)
    })

    it("should throw error for unknown stage", () => {
      expect(() => getHandoverPrompt(classicWorkflow, null, "unknownStage")).toThrow(
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
            getHandoverPrompt: () => "Moving from start to stage1",
          },
          stage2: {
            name: "Stage 2",
            description: "Second stage",
            agent: "Agent2",
            promptFile: "prompts/stage2.md",
            getHandoverPrompt: () => "Transitioning from stage1 to stage2",
          },
        },
      }

      const prompt = getHandoverPrompt(customWorkflow, "stage1", "stage2")
      expect(prompt).toBe("Transitioning from stage1 to stage2")
    })
  })
})
