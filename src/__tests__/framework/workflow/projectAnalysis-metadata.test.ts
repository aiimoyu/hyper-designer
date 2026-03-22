import { describe, it, expect } from 'vitest'
import type { WorkflowDefinition } from '../../../workflows/core'
import { getStageOrder } from '../../../workflows/core'
import { projectAnalysisWorkflow } from '../../../builtin/workflows/projectAnalysis'

function getProjectAnalysisWorkflow(): WorkflowDefinition {
  return projectAnalysisWorkflow
}

describe('projectAnalysis workflow stage metadata', () => {
  const stageKeys = [
    'projectOverview',
    'functionTreeAndModule',
    'interfaceAndDataFlow',
    'defectCheckAndPatch',
  ] as const

  describe('workflow structure', () => {
    it('has exactly 4 stages', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(Object.keys(workflow.stages)).toHaveLength(4)
    })

    it('has correct stage keys', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(Object.keys(workflow.stages).sort()).toEqual([...stageKeys].sort())
    })

    it('has stageOrder matching stage keys', () => {
      const workflow = getProjectAnalysisWorkflow()
      const stageOrder = getStageOrder(workflow)
      expect(stageOrder).toHaveLength(4)
      expect(stageOrder).toEqual(stageKeys)
    })

    it('has no tools defined (prompt-driven workflow)', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.tools).toBeUndefined()
    })
  })

  for (const key of stageKeys) {
    describe(`stage: ${key}`, () => {
      it('has a required field (boolean)', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(typeof workflow.stages[key].required).toBe('boolean')
      })

      it('has an inputs field (array)', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(Array.isArray(workflow.stages[key].inputs)).toBe(true)
      })

      it('has an outputs field (array)', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(Array.isArray(workflow.stages[key].outputs)).toBe(true)
      })

      it('has promptBindings defined', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(workflow.stages[key].promptBindings).toBeDefined()
        expect(typeof workflow.stages[key].promptBindings).toBe('object')
      })

      it('uses HAnalysis agent', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(workflow.stages[key].agent).toBe('HAnalysis')
      })

      it('has pure Markdown output paths', () => {
        const workflow = getProjectAnalysisWorkflow()
        const outputs = workflow.stages[key].outputs
        if (outputs && outputs.length > 0) {
          for (const output of outputs) {
            expect(output.path).not.toContain('_meta/')
            expect(output.path).not.toContain('.json')
          }
        }
      })
    })
  }

  describe('stage dependencies', () => {
    it('first stage has no inputs', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['projectOverview'].inputs).toEqual([])
    })

    it('each subsequent stage has at least one input', () => {
      const workflow = getProjectAnalysisWorkflow()
      const subsequentStages = stageKeys.slice(1)
      for (const key of subsequentStages) {
        expect(workflow.stages[key].inputs!.length).toBeGreaterThan(0)
      }
    })

    it('each stage has at least one output', () => {
      const workflow = getProjectAnalysisWorkflow()
      for (const key of stageKeys) {
        expect(workflow.stages[key].outputs!.length).toBeGreaterThan(0)
      }
    })
  })

  describe('stage configuration', () => {
    it('all stages are required', () => {
      const workflow = getProjectAnalysisWorkflow()
      for (const key of stageKeys) {
        expect(workflow.stages[key].required).toBe(true)
      }
    })

    it('all stages have agent defined', () => {
      const workflow = getProjectAnalysisWorkflow()
      for (const key of stageKeys) {
        expect(workflow.stages[key].agent).toBeDefined()
        expect(typeof workflow.stages[key].agent).toBe('string')
      }
    })
  })

  describe('output artifacts', () => {
    it('all outputs have valid types', () => {
      const workflow = getProjectAnalysisWorkflow()
      const validTypes = ['file', 'pattern', 'folder']
      for (const key of stageKeys) {
        for (const output of workflow.stages[key].outputs!) {
          expect(validTypes).toContain(output.type)
        }
      }
    })

    it('all outputs have id and path', () => {
      const workflow = getProjectAnalysisWorkflow()
      for (const key of stageKeys) {
        for (const output of workflow.stages[key].outputs!) {
          expect(output.id).toBeDefined()
          expect(output.path).toBeDefined()
        }
      }
    })
  })
})
