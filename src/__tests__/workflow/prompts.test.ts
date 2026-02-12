import { describe, it, expect } from "vitest"
import { loadPromptForStage } from "../../workflows/core/prompts"
import { classicWorkflow } from "../../workflows/plugins/classic"
import type { WorkflowDefinition } from "../../workflows/core/types"

describe("workflow/prompts", () => {
  describe("loadPromptForStage", () => {
    it("should load prompt for dataCollection stage", () => {
      const prompt = loadPromptForStage("dataCollection", classicWorkflow)
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should load prompt for IRAnalysis stage", () => {
      const prompt = loadPromptForStage("IRAnalysis", classicWorkflow)
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should load prompt for all classic workflow stages", () => {
      const stages = classicWorkflow.stageOrder

      stages.forEach(stage => {
        const prompt = loadPromptForStage(stage, classicWorkflow)
        expect(prompt).toBeTruthy()
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it("returns workflow prompt only for unknown stage", () => {
      const prompt = loadPromptForStage("unknownStage", classicWorkflow)
      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt).toContain("工作流")
    })

    it("should return empty string for non-existent prompt file", () => {
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

      const prompt = loadPromptForStage("stage1", customWorkflow)
      expect(prompt).toBe("")
    })

    it("should load prompts from workflow module directory", () => {
      const prompt = loadPromptForStage("dataCollection", classicWorkflow)

      expect(prompt).toContain("资料收集")
    })

    it("should preserve Chinese content in loaded prompts", () => {
      const prompt = loadPromptForStage("IRAnalysis", classicWorkflow)

      expect(prompt).toMatch(/[\u4e00-\u9fa5]/)
    })
  })
})
