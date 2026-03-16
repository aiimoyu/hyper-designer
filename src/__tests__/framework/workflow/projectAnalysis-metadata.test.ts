/**
 * Tests for projectAnalysis workflow stage metadata fields.
 * Verifies that all 3 stages have required, inputs, outputs, promptBindings defined.
 * Updated for prompt-driven (pure Markdown) workflow.
 */
import { describe, it, expect } from 'vitest'
import type { WorkflowDefinition } from '../../../workflows/core'
import { projectAnalysisWorkflow } from '../../../workflows/plugins/projectAnalysis'

function getProjectAnalysisWorkflow(): WorkflowDefinition {
  return projectAnalysisWorkflow
}

describe('projectAnalysis workflow stage metadata', () => {
  const stageKeys = [
    'systemAnalysis',
    'componentAnalysis',
    'missingCoverageCheck',
  ] as const

  describe('workflow structure', () => {
    it('has exactly 3 stages', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(Object.keys(workflow.stages)).toHaveLength(3)
    })

    it('has correct stage keys', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(Object.keys(workflow.stages).sort()).toEqual([...stageKeys].sort())
    })

    it('has stageOrder matching stage keys', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stageOrder).toHaveLength(3)
      expect(workflow.stageOrder).toEqual(stageKeys)
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

      it('has an inputs field (object)', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(workflow.stages[key].inputs).toBeDefined()
        expect(typeof workflow.stages[key].inputs).toBe('object')
      })

      it('has an outputs field (object)', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(workflow.stages[key].outputs).toBeDefined()
        expect(typeof workflow.stages[key].outputs).toBe('object')
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
        if (outputs) {
          for (const [, output] of Object.entries(outputs)) {
            expect(output.path).not.toContain('_meta/')
            expect(output.path).not.toContain('.json')
          }
        }
      })
    })
  }

  describe('systemAnalysis metadata values', () => {
    it('is required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['systemAnalysis'].required).toBe(true)
    })

    it('has no inputs (first stage)', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['systemAnalysis'].inputs).toEqual({})
    })

    it('outputs Markdown-only artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      const outputs = workflow.stages['systemAnalysis'].outputs!
      expect(outputs['系统架构分析报告'].path).toBe('.hyper-designer/projectAnalysis/architecture.md')
      expect(outputs['组件清单'].path).toBe('.hyper-designer/projectAnalysis/components-manifest.md')
      expect(outputs['API目录'].path).toBe('.hyper-designer/projectAnalysis/api-catalog.md')
      expect(outputs['源码概览'].path).toBe('.hyper-designer/projectAnalysis/source-overview.md')
    })
  })

  describe('componentAnalysis metadata values', () => {
    it('is required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['componentAnalysis'].required).toBe(true)
    })

    it('inputs 组件清单 as required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['componentAnalysis'].inputs!['组件清单']).toEqual({ required: true })
    })

    it('outputs Markdown-only artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      const outputs = workflow.stages['componentAnalysis'].outputs!
      expect(outputs['组件分析文档目录'].path).toBe('.hyper-designer/projectAnalysis/components/')
      expect(outputs['组件分析汇总'].path).toBe('.hyper-designer/projectAnalysis/component-analysis-summary.md')
    })
  })

  describe('missingCoverageCheck metadata values', () => {
    it('is required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['missingCoverageCheck'].required).toBe(true)
    })

    it('inputs 系统架构分析报告 and 组件清单 as required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['missingCoverageCheck'].inputs!['系统架构分析报告']).toEqual({ required: true })
      expect(workflow.stages['missingCoverageCheck'].inputs!['组件清单']).toEqual({ required: true })
    })

    it('outputs Markdown-only coverage report', () => {
      const workflow = getProjectAnalysisWorkflow()
      const outputs = workflow.stages['missingCoverageCheck'].outputs!
      expect(Object.keys(outputs)).toHaveLength(1)
      expect(outputs['覆盖率检查报告'].path).toBe('.hyper-designer/projectAnalysis/coverage-report.md')
    })
  })
})
