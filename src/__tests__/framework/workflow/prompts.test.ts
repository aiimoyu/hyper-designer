import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { loadPromptForStage } from "../../../workflows/core/prompts"
import { classicWorkflow } from "../../../workflows/plugins/classic"
import type { WorkflowDefinition } from "../../../workflows/core/types"

describe("workflow/prompts", () => {
  describe("loadPromptForStage", () => {
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
      const prompt = loadPromptForStage("IRAnalysis", classicWorkflow)

      expect(prompt).toContain("工作流")
    })

    it("should verify all classic workflow prompt files exist and are readable", () => {
      const workflow = classicWorkflow
      const __filename = fileURLToPath(import.meta.url)
      const promptsDir = join(
        dirname(__filename),
        "..",
        "..",
        "..",
        "workflows",
        "plugins",
        "classic",
        "prompts"
      )

      workflow.stageOrder.forEach(stage => {
        const stageDef = workflow.stages[stage]
        expect(stageDef.promptFile).toBeDefined()
        const promptPath = join(promptsDir, stageDef.promptFile!.replace("prompts/", ""))

        expect(existsSync(promptPath)).toBe(true)
        const content = readFileSync(promptPath, "utf-8")
        expect(content.length).toBeGreaterThan(0)
        expect(content).toContain("#")
      })
    })
  })
})
