import { describe, it, expect } from 'vitest'
import { liteWorkflow } from '../../../plugins/workflow/builtin/lite'

describe('lite workflow stage metadata', () => {
  const stages = liteWorkflow.stages

  const stageKeys = [
    'analysisAndScenario',
    'functionalAndModuleDesign',
    'sddPlanGenerationLite',
  ] as const

  for (const key of stageKeys) {
    describe(`stage: ${key}`, () => {
      it('has a required field (boolean)', () => {
        expect(typeof stages[key].required).toBe('boolean')
      })

      it('has an inputs field (object)', () => {
        expect(stages[key].inputs).toBeDefined()
        expect(typeof stages[key].inputs).toBe('object')
      })

      it('has an outputs field (object)', () => {
        expect(stages[key].outputs).toBeDefined()
        expect(typeof stages[key].outputs).toBe('object')
      })
    })
  }

  describe('analysisAndScenario metadata values', () => {
    it('is required', () => {
      expect(stages['analysisAndScenario'].required).toBe(true)
    })

    it('has no inputs (first stage)', () => {
      expect(stages['analysisAndScenario'].inputs).toEqual({})
    })

    it('outputs 需求场景分析 artifact', () => {
      expect(stages['analysisAndScenario'].outputs).toHaveProperty('需求场景分析')
      expect(stages['analysisAndScenario'].outputs!['需求场景分析'].path).toBe('需求场景分析.md')
    })
  })

  describe('functionalAndModuleDesign metadata values', () => {
    it('is required', () => {
      expect(stages['functionalAndModuleDesign'].required).toBe(true)
    })

    it('inputs 需求场景分析 as required', () => {
      expect(stages['functionalAndModuleDesign'].inputs!['需求场景分析']).toEqual({ required: true })
    })

    it('outputs 功能与模块设计 artifact', () => {
      expect(stages['functionalAndModuleDesign'].outputs!['功能与模块设计'].path).toBe('功能与模块设计.md')
    })
  })

  describe('sddPlanGenerationLite metadata values', () => {
    it('is required', () => {
      expect(stages['sddPlanGenerationLite'].required).toBe(true)
    })

    it('inputs 功能与模块设计 as required', () => {
      expect(stages['sddPlanGenerationLite'].inputs!['功能与模块设计']).toEqual({ required: true })
    })

    it('outputs SDD 计划 artifact', () => {
      expect(stages['sddPlanGenerationLite'].outputs!['SDD 计划'].path).toBe('SDD 计划.md')
    })
  })
})
