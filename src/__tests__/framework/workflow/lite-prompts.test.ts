import { describe, it, expect } from 'vitest'
import { getStageOrder, loadPromptForStage } from '../../../workflows/core'
import { liteWorkflow } from '../../../builtin/workflows/lite'

const WORKFLOW_STEP_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'

describe('lite workflow prompts', () => {
  it('loads all stage prompt bindings', () => {
    const stageOrder = getStageOrder(liteWorkflow)
    for (const stageKey of stageOrder) {
      const stageDef = liteWorkflow.stages[stageKey]
      const binding = stageDef.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]
      expect(binding).toBeDefined()
      expect(binding!.length).toBeGreaterThan(0)
    }
  })

  it('each stage prompt contains markdown headers', () => {
    const stageOrder = getStageOrder(liteWorkflow)
    for (const stageKey of stageOrder) {
      const prompt = loadPromptForStage(stageKey, liteWorkflow)
      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt).toContain('#')
    }
  })

  it('stage prompts are non-empty and contain guidance content', () => {
    const analysis = loadPromptForStage('requirementAnalysis', liteWorkflow)
    const design = loadPromptForStage('requirementDesign', liteWorkflow)
    const sdd = loadPromptForStage('developmentPlan', liteWorkflow)

    expect(analysis.length).toBeGreaterThan(100)
    expect(design.length).toBeGreaterThan(100)
    expect(sdd.length).toBeGreaterThan(100)
  })
})
