import { describe, it, expect } from 'vitest'
import { getStageOrder, loadPromptForStage } from '../../../workflows/core'
import { liteWorkflow } from '../../../plugins/workflow/builtin/lite'

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

  it('enforces quantity limits in stage prompts', () => {
    const analysis = loadPromptForStage('requirementAnalysis', liteWorkflow)
    const design = loadPromptForStage('ModuleDesign', liteWorkflow)
    const sdd = loadPromptForStage('developmentPlan', liteWorkflow)

    expect(analysis).toContain('最多3个关键场景')
    expect(design).toContain('最多8个')
    expect(sdd).toContain('最多4个波次')
  })
})
