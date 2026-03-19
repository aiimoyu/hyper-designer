import { describe, it, expect } from 'vitest'
import { liteWorkflow } from '../../../plugins/workflow/builtin/lite'

describe('lite workflow stage metadata', () => {
  const stages = liteWorkflow.stages

  const stageKeys = [
    'requirementAnalysis',
    'requirementDesign',
    'developmentPlan',
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

  describe('requirementAnalysis metadata values', () => {
    it('is required', () => {
      expect(stages['requirementAnalysis'].required).toBe(true)
    })

    it('has no inputs (first stage)', () => {
      expect(stages['requirementAnalysis'].inputs).toEqual([])
    })

    it('outputs requirementAnalysis artifact', () => {
      const outputs = stages['requirementAnalysis'].outputs!
      const item = outputs.find(o => o.id === 'requirementAnalysis')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/requirementAnalysis/需求分析说明书.md')
      expect(item?.type).toBe('file')
    })
  })

  describe('requirementDesign metadata values', () => {
    it('is required', () => {
      expect(stages['requirementDesign'].required).toBe(true)
    })

    it('inputs requirementAnalysis', () => {
      const inputs = stages['requirementDesign'].inputs!
      const item = inputs.find(i => i.id === 'requirementAnalysis')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/requirementAnalysis/需求分析说明书.md')
    })

    it('outputs functionalDesign artifact', () => {
      const outputs = stages['requirementDesign'].outputs!
      const item = outputs.find(o => o.id === 'functionalDesign')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/requirementDesign/需求设计说明书.md')
      expect(item?.type).toBe('file')
    })
  })

  describe('developmentPlan metadata values', () => {
    it('is required', () => {
      expect(stages['developmentPlan'].required).toBe(true)
    })

    it('inputs functionalDesign', () => {
      const inputs = stages['developmentPlan'].inputs!
      const item = inputs.find(i => i.id === 'functionalDesign')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/requirementDesign/需求设计说明书.md')
    })

    it('outputs developmentPlan artifact', () => {
      const outputs = stages['developmentPlan'].outputs!
      const item = outputs.find(o => o.id === 'developmentPlan')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/developmentPlan/开发计划.md')
      expect(item?.type).toBe('file')
    })
  })
})
