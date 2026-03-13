import { describe, it, expect } from "vitest"
import { loadPromptForStage } from '../../../workflows/core'
import { classicWorkflow } from "../../../workflows/plugins/classic"
import type { WorkflowDefinition } from '../../../workflows/core'

const WORKFLOW_STEP_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'

describe("workflow/prompts", () => {
  describe("loadPromptForStage", () => {
    it("returns workflow prompt only for unknown stage", () => {
      const prompt = loadPromptForStage("unknownStage", classicWorkflow)
      expect(prompt.length).toBeGreaterThan(0)
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
      const prompt = loadPromptForStage("IRAnalysis", classicWorkflow)

      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt).toContain('#')
    })

    it("should verify all classic workflow prompt files exist and are readable", () => {
      const workflow = classicWorkflow

      workflow.stageOrder.forEach(stage => {
        const stageDef = workflow.stages[stage]
        const promptBinding = stageDef.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]
        expect(promptBinding).toBeDefined()
        expect(promptBinding!.length).toBeGreaterThan(0)
        expect(promptBinding).toContain("#")
      })
    })
  })
})
