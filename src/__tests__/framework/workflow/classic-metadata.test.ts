/**
 * Tests for classic workflow stage metadata fields.
 * Verifies that all 8 stages have required, inputs, and outputs defined.
 */

import { describe, it, expect } from 'vitest'
import { classicWorkflow } from '../../../plugins/workflow/builtin/classic'

describe('classic workflow stage metadata', () => {
  const stages = classicWorkflow.stages

  const stageKeys = [
    'IRAnalysis',
    'scenarioAnalysis',
    'useCaseAnalysis',
    'functionalRefinement',
    'requirementDecomposition',
    'systemFunctionalDesign',
    'moduleFunctionalDesign',
    'sddPlanGeneration',
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

      it('enables stage-milestones injection', () => {
        expect(stages[key].inject).toContain('stage-milestones')
      })
    })
  }

  describe('IRAnalysis metadata values', () => {
    it('is required', () => {
      expect(stages['IRAnalysis'].required).toBe(true)
    })

    it('has no inputs (first stage)', () => {
      expect(stages['IRAnalysis'].inputs).toEqual([])
    })

    it('outputs 需求信息 artifact', () => {
      const outputs = stages['IRAnalysis'].outputs!
      const item = outputs.find(o => o.id === '需求信息')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/IRAnalysis/需求信息.md')
      expect(item?.type).toBe('file')
    })
  })

  describe('scenarioAnalysis metadata values', () => {
    it('is required', () => {
      expect(stages['scenarioAnalysis'].required).toBe(true)
    })

    it('inputs 需求信息', () => {
      const inputs = stages['scenarioAnalysis'].inputs!
      const item = inputs.find(i => i.id === '需求信息')
      expect(item).toBeDefined()
      expect(item?.path).toBe('./.hyper-designer/IRAnalysis/需求信息.md')
    })

    it('outputs 功能场景 artifact', () => {
      const outputs = stages['scenarioAnalysis'].outputs!
      const item = outputs.find(o => o.id === '功能场景')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })
  })

  describe('useCaseAnalysis metadata values', () => {
    it('is required', () => {
      expect(stages['useCaseAnalysis'].required).toBe(true)
    })

    it('inputs 功能场景', () => {
      const inputs = stages['useCaseAnalysis'].inputs!
      const item = inputs.find(i => i.id === '功能场景')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })

    it('outputs 用例 artifact', () => {
      const outputs = stages['useCaseAnalysis'].outputs!
      const item = outputs.find(o => o.id === '用例')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })
  })

  describe('functionalRefinement metadata values', () => {
    it('is required', () => {
      expect(stages['functionalRefinement'].required).toBe(true)
    })

    it('inputs 用例', () => {
      const inputs = stages['functionalRefinement'].inputs!
      const item = inputs.find(i => i.id === '用例')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })

    it('outputs 功能列表 artifact', () => {
      const outputs = stages['functionalRefinement'].outputs!
      const item = outputs.find(o => o.id === '功能列表')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })

    it('outputs FMEA artifact', () => {
      const outputs = stages['functionalRefinement'].outputs!
      const item = outputs.find(o => o.id === 'FMEA')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })
  })

  describe('requirementDecomposition metadata values', () => {
    it('is required', () => {
      expect(stages['requirementDecomposition'].required).toBe(true)
    })

    it('inputs 功能列表', () => {
      const inputs = stages['requirementDecomposition'].inputs!
      const item = inputs.find(i => i.id === '功能列表')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })

    it('outputs SR-AR分解 artifact', () => {
      const outputs = stages['requirementDecomposition'].outputs!
      const item = outputs.find(o => o.id === 'SR-AR分解')
      expect(item).toBeDefined()
      expect(item?.type).toBe('file')
    })

    it('outputs 追溯报告 artifact', () => {
      const outputs = stages['requirementDecomposition'].outputs!
      const item = outputs.find(o => o.id === '追溯报告')
      expect(item).toBeDefined()
      expect(item?.type).toBe('file')
    })
  })

  describe('systemFunctionalDesign metadata values', () => {
    it('is required', () => {
      expect(stages['systemFunctionalDesign'].required).toBe(true)
    })

    it('inputs SR-AR分解', () => {
      const inputs = stages['systemFunctionalDesign'].inputs!
      const item = inputs.find(i => i.id === 'SR-AR分解')
      expect(item).toBeDefined()
      expect(item?.type).toBe('file')
    })

    it('outputs 系统设计 artifact', () => {
      const outputs = stages['systemFunctionalDesign'].outputs!
      const item = outputs.find(o => o.id === '系统设计')
      expect(item).toBeDefined()
      expect(item?.type).toBe('file')
    })
  })

  describe('moduleFunctionalDesign metadata values', () => {
    it('is required', () => {
      expect(stages['moduleFunctionalDesign'].required).toBe(true)
    })

    it('inputs 系统设计', () => {
      const inputs = stages['moduleFunctionalDesign'].inputs!
      const item = inputs.find(i => i.id === '系统设计')
      expect(item).toBeDefined()
      expect(item?.type).toBe('file')
    })

    it('outputs 模块设计 artifact', () => {
      const outputs = stages['moduleFunctionalDesign'].outputs!
      const item = outputs.find(o => o.id === '模块设计')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })
  })

  describe('sddPlanGeneration metadata values', () => {
    it('is NOT required (optional stage)', () => {
      expect(stages['sddPlanGeneration'].required).toBe(false)
    })

    it('inputs 模块设计', () => {
      const inputs = stages['sddPlanGeneration'].inputs!
      const item = inputs.find(i => i.id === '模块设计')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })

    it('outputs SDD计划 artifact', () => {
      const outputs = stages['sddPlanGeneration'].outputs!
      const item = outputs.find(o => o.id === 'SDD计划')
      expect(item).toBeDefined()
      expect(item?.type).toBe('pattern')
    })
  })
})
