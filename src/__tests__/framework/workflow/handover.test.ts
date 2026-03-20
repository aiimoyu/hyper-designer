import { describe, it, expect } from "vitest"
import { getHandoverAgent, getHandoverPrompt } from '../../../workflows/core'
import { classicWorkflow } from '../../../plugins/workflows/classic'
import type { WorkflowDefinition } from '../../../workflows/core'

describe("workflow/handover", () => {
  describe("getHandoverAgent", () => {
    it("should return the correct agent for IRAnalysis stage", () => {
      const agent = getHandoverAgent(classicWorkflow, "IRAnalysis")
      expect(agent).toBe("HArchitect")
    })

    it("should return the correct agent for requirementDecomposition stage", () => {
      const agent = getHandoverAgent(classicWorkflow, "requirementDecomposition")
      expect(agent).toBe("HEngineer")
    })

    it("should return null for unknown stage", () => {
      const agent = getHandoverAgent(classicWorkflow, "unknownStage")
      expect(agent).toBeNull()
    })

    it("should work with custom workflow definition", () => {
      const customWorkflow: WorkflowDefinition = {
        id: "custom",
        name: "Custom Workflow",
        description: "Test workflow",
        entryStageId: "stage1",
        stages: {
          stage1: {
            stageId: "stage1",
            name: "Stage 1",
            description: "First stage",
            agent: "Agent1",
            promptFile: "prompts/stage1.md",
            transitions: [{ id: "to-stage2", toStageId: "stage2", mode: "auto", priority: 0 }],
            getHandoverPrompt: () => "Handover to stage 1",
          },
          stage2: {
            stageId: "stage2",
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
    it("should return non-empty prompt for IRAnalysis stage", () => {
      const prompt = getHandoverPrompt(classicWorkflow, null, "IRAnalysis")
      expect(prompt).toBeTruthy()
      expect(prompt!.length).toBeGreaterThan(0)
    })

    it("should include current step display name in prompt when provided", () => {
      const prompt = getHandoverPrompt(classicWorkflow, "IRAnalysis", "scenarioAnalysis")
      const irStageName = classicWorkflow.stages.IRAnalysis.name
      // handover.ts resolves key "IRAnalysis" → name "Initial Requirement Analysis" → uppercased in prompt
      expect(prompt!.toUpperCase()).toContain(irStageName.toUpperCase())
    })

    it("should generate different prompts for different stages", () => {
      const prompt1 = getHandoverPrompt(classicWorkflow, null, "IRAnalysis")
      const prompt2 = getHandoverPrompt(classicWorkflow, null, "scenarioAnalysis")
      expect(prompt1).not.toBe(prompt2)
    })

    it("should return null for unknown stage", () => {
      const prompt = getHandoverPrompt(classicWorkflow, null, "unknownStage")
      expect(prompt).toBeNull()
    })

    it("should work with custom workflow definition", () => {
      const customWorkflow: WorkflowDefinition = {
        id: "custom",
        name: "Custom Workflow",
        description: "Test workflow",
        entryStageId: "stage1",
        stages: {
          stage1: {
            stageId: "stage1",
            name: "Stage 1",
            description: "First stage",
            agent: "Agent1",
            promptFile: "prompts/stage1.md",
            transitions: [{ id: "to-stage2", toStageId: "stage2", mode: "auto", priority: 0 }],
            getHandoverPrompt: () => "Moving from start to stage1",
          },
          stage2: {
            stageId: "stage2",
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
