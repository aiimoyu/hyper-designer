import { describe, it, expect } from "vitest"
import { loadPromptForStage } from "../../workflows/core/prompts"
import { traditionalWorkflow } from "../../workflows/plugins/traditional"
import type { WorkflowDefinition } from "../../workflows/core/types"

describe("workflow/prompts", () => {
  describe("loadPromptForStage", () => {
    it("should load prompt for dataCollection stage", () => {
      const prompt = loadPromptForStage("dataCollection", traditionalWorkflow)
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should load prompt for IRAnalysis stage", () => {
      const prompt = loadPromptForStage("IRAnalysis", traditionalWorkflow)
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should load prompt for all traditional workflow stages", () => {
      const stages = traditionalWorkflow.stageOrder
      
      stages.forEach(stage => {
        const prompt = loadPromptForStage(stage, traditionalWorkflow)
        expect(prompt).toBeTruthy()
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it("should throw error for unknown stage", () => {
      expect(() => loadPromptForStage("unknownStage", traditionalWorkflow)).toThrow(
        "Unknown stage: unknownStage"
      )
    })

    it("should throw error for non-existent prompt file", () => {
      const customWorkflow: WorkflowDefinition = {
        id: "test",
        name: "Test Workflow",
        description: "Test",
        stageOrder: ["stage1"],
        stages: {
          stage1: {
            name: "Stage 1",
            description: "Test stage",
            agent: "TestAgent",
            promptFile: "prompts/nonexistent.md",
            getHandoverPrompt: () => "Test",
          },
        },
      }

      expect(() => loadPromptForStage("stage1", customWorkflow)).toThrow(
        "Failed to load prompt for stage"
      )
    })

    it("should load prompts from workflow module directory", () => {
      const prompt = loadPromptForStage("dataCollection", traditionalWorkflow)
      
      expect(prompt).toContain("资料收集")
    })

    it("should preserve Chinese content in loaded prompts", () => {
      const prompt = loadPromptForStage("IRAnalysis", traditionalWorkflow)
      
      expect(prompt).toMatch(/[\u4e00-\u9fa5]/)
    })
  })
})
