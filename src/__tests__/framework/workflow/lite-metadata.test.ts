import { describe, it, expect } from 'vitest'
import { liteWorkflow } from '../../../builtin/workflows/lite'

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

  describe('workflow structure', () => {
    it('has exactly 3 stages', () => {
      expect(Object.keys(stages)).toHaveLength(3)
    })

    it('has correct stage keys', () => {
      expect(Object.keys(stages).sort()).toEqual([...stageKeys].sort())
    })
  })

  describe('stage dependencies', () => {
    it('first stage has no inputs', () => {
      expect(stages['requirementAnalysis'].inputs).toEqual([])
    })

    it('each subsequent stage has at least one input', () => {
      const subsequentStages = stageKeys.slice(1)
      for (const key of subsequentStages) {
        expect(stages[key].inputs!.length).toBeGreaterThan(0)
      }
    })

    it('each stage has at least one output', () => {
      for (const key of stageKeys) {
        expect(stages[key].outputs!.length).toBeGreaterThan(0)
      }
    })
  })

  describe('stage configuration', () => {
    it('all stages are required', () => {
      for (const key of stageKeys) {
        expect(stages[key].required).toBe(true)
      }
    })

    it('all stages have agent defined', () => {
      for (const key of stageKeys) {
        expect(stages[key].agent).toBeDefined()
        expect(typeof stages[key].agent).toBe('string')
      }
    })

    it('all stages have promptBindings defined', () => {
      for (const key of stageKeys) {
        expect(stages[key].promptBindings).toBeDefined()
        expect(typeof stages[key].promptBindings).toBe('object')
      }
    })
  })

  describe('output artifacts', () => {
    it('all outputs have valid types', () => {
      const validTypes = ['file', 'pattern', 'folder']
      for (const key of stageKeys) {
        for (const output of stages[key].outputs!) {
          expect(validTypes).toContain(output.type)
        }
      }
    })

    it('all outputs have id and path', () => {
      for (const key of stageKeys) {
        for (const output of stages[key].outputs!) {
          expect(output.id).toBeDefined()
          expect(output.path).toBeDefined()
        }
      }
    })
  })
})
