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

      it('has an inputs field (object)', () => {
        expect(stages[key].inputs).toBeDefined()
        expect(typeof stages[key].inputs).toBe('object')
      })

      it('has an outputs field (object)', () => {
        expect(stages[key].outputs).toBeDefined()
        expect(typeof stages[key].outputs).toBe('object')
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
      expect(stages['IRAnalysis'].inputs).toEqual({})
    })

    it('outputs 需求信息 artifact', () => {
      expect(stages['IRAnalysis'].outputs).toHaveProperty('需求信息')
      expect(stages['IRAnalysis'].outputs!['需求信息'].path).toBe('需求信息.md')
    })
  })

  describe('scenarioAnalysis metadata values', () => {
    it('is required', () => {
      expect(stages['scenarioAnalysis'].required).toBe(true)
    })

    it('inputs 需求信息 as required', () => {
      expect(stages['scenarioAnalysis'].inputs!['需求信息']).toEqual({ required: true })
    })

    it('outputs 功能场景 artifact', () => {
      expect(stages['scenarioAnalysis'].outputs!['功能场景'].path).toBe('功能场景.md')
    })
  })

  describe('useCaseAnalysis metadata values', () => {
    it('is required', () => {
      expect(stages['useCaseAnalysis'].required).toBe(true)
    })

    it('inputs 功能场景 as required', () => {
      expect(stages['useCaseAnalysis'].inputs!['功能场景']).toEqual({ required: true })
    })

    it('outputs 用例 artifact', () => {
      expect(stages['useCaseAnalysis'].outputs!['用例'].path).toBe('用例.md')
    })
  })

  describe('functionalRefinement metadata values', () => {
    it('is required', () => {
      expect(stages['functionalRefinement'].required).toBe(true)
    })

    it('inputs 用例 as required', () => {
      expect(stages['functionalRefinement'].inputs!['用例']).toEqual({ required: true })
    })

    it('outputs 功能列表 artifact', () => {
      expect(stages['functionalRefinement'].outputs!['功能列表'].path).toBe('功能列表.md')
    })
  })

  describe('requirementDecomposition metadata values', () => {
    it('is required', () => {
      expect(stages['requirementDecomposition'].required).toBe(true)
    })

    it('inputs 功能列表 as required', () => {
      expect(stages['requirementDecomposition'].inputs!['功能列表']).toEqual({ required: true })
    })

    it('outputs SR-AR 分解 artifact', () => {
      expect(stages['requirementDecomposition'].outputs!['SR-AR 分解'].path).toBe('SR-AR 分解.md')
    })
  })

  describe('systemFunctionalDesign metadata values', () => {
    it('is required', () => {
      expect(stages['systemFunctionalDesign'].required).toBe(true)
    })

    it('inputs SR-AR 分解 as required', () => {
      expect(stages['systemFunctionalDesign'].inputs!['SR-AR 分解']).toEqual({ required: true })
    })

    it('outputs 系统功能设计 artifact', () => {
      expect(stages['systemFunctionalDesign'].outputs!['系统功能设计'].path).toBe('系统功能设计.md')
    })
  })

  describe('moduleFunctionalDesign metadata values', () => {
    it('is required', () => {
      expect(stages['moduleFunctionalDesign'].required).toBe(true)
    })

    it('inputs 系统功能设计 as required', () => {
      expect(stages['moduleFunctionalDesign'].inputs!['系统功能设计']).toEqual({ required: true })
    })

    it('outputs 模块功能设计 artifact', () => {
      expect(stages['moduleFunctionalDesign'].outputs!['模块功能设计'].path).toBe('模块功能设计.md')
    })
  })

  describe('sddPlanGeneration metadata values', () => {
    it('is NOT required (optional stage)', () => {
      expect(stages['sddPlanGeneration'].required).toBe(false)
    })

    it('inputs 模块功能设计 as required', () => {
      expect(stages['sddPlanGeneration'].inputs!['模块功能设计']).toEqual({ required: true })
    })

    it('outputs SDD 计划 artifact', () => {
      expect(stages['sddPlanGeneration'].outputs!['SDD 计划'].path).toBe('SDD 计划.md')
    })
  })
})
