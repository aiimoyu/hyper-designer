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

  it('enforces output length limits in most stage prompts', () => {
    const analysis = loadPromptForStage('analysisAndScenario', liteWorkflow)
    const design = loadPromptForStage('functionalAndModuleDesign', liteWorkflow)
    const sdd = loadPromptForStage('sddPlanGenerationLite', liteWorkflow)

    expect(analysis).toContain('1-2 句话')
    expect(design).toContain('1-2 句话')
    expect(sdd).toContain('3-5')
  })
})
