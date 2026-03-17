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

      it('has an inputs field (array)', () => {
        expect(Array.isArray(stages[key].inputs)).toBe(true)
      })

      it('has an outputs field (array)', () => {
        expect(Array.isArray(stages[key].outputs)).toBe(true)
      })
    })
  }

  describe('analysisAndScenario metadata values', () => {
    it('is required', () => {
      expect(stages['analysisAndScenario'].required).toBe(true)
    })

    it('has no inputs (first stage)', () => {
      expect(stages['analysisAndScenario'].inputs).toEqual([])
    })

    it('outputs 需求场景分析 artifact', () => {
      const outputs = stages['analysisAndScenario'].outputs!
      const item = outputs.find(o => o.id === '需求场景分析')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/lite/需求场景分析.md')
      expect(item?.type).toBe('file')
    })
  })

  describe('functionalAndModuleDesign metadata values', () => {
    it('is required', () => {
      expect(stages['functionalAndModuleDesign'].required).toBe(true)
    })

    it('inputs 需求场景分析', () => {
      const inputs = stages['functionalAndModuleDesign'].inputs!
      const item = inputs.find(i => i.id === '需求场景分析')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/lite/需求场景分析.md')
    })

    it('outputs 功能与模块设计 artifact', () => {
      const outputs = stages['functionalAndModuleDesign'].outputs!
      const item = outputs.find(o => o.id === '功能与模块设计')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/lite/功能与模块设计.md')
      expect(item?.type).toBe('file')
    })
  })

  describe('sddPlanGenerationLite metadata values', () => {
    it('is required', () => {
      expect(stages['sddPlanGenerationLite'].required).toBe(true)
    })

    it('inputs 功能与模块设计', () => {
      const inputs = stages['sddPlanGenerationLite'].inputs!
      const item = inputs.find(i => i.id === '功能与模块设计')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/lite/功能与模块设计.md')
    })

    it('outputs SDD计划 artifact', () => {
      const outputs = stages['sddPlanGenerationLite'].outputs!
      const item = outputs.find(o => o.id === 'SDD计划')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/lite/SDD计划.md')
      expect(item?.type).toBe('file')
    })
  })
})
