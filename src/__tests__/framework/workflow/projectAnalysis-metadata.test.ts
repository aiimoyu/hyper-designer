/**
 * Tests for projectAnalysis workflow stage metadata fields.
 * Verifies that all 3 stages have required, inputs, outputs, promptBindings defined.
 * Updated for prompt-driven (pure Markdown) workflow.
 */
import { describe, it, expect } from 'vitest'
import type { WorkflowDefinition } from '../../../workflows/core'
import { getStageOrder } from '../../../workflows/core'
import { projectAnalysisWorkflow } from '../../../builtin/workflows/projectAnalysis'

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
      const stageOrder = getStageOrder(workflow)
      expect(stageOrder).toHaveLength(3)
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
        expect(workflow.stages[key].requiredMilestones ?? []).not.toContain('gate')
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
      expect(workflow.stages['systemAnalysis'].inputs).toEqual([])
    })

    it('outputs Markdown-only artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      const outputs = workflow.stages['systemAnalysis'].outputs!
      const findOutput = (id: string) => outputs.find(o => o.id === id)
      expect(findOutput('系统架构分析报告')?.path).toBe('./.hyper-designer/projectAnalysis/architecture.md')
      expect(findOutput('组件清单')?.path).toBe('./.hyper-designer/projectAnalysis/components-manifest.md')
      expect(findOutput('API目录')?.path).toBe('./.hyper-designer/projectAnalysis/api-catalog.md')
      expect(findOutput('源码概览')?.path).toBe('./.hyper-designer/projectAnalysis/source-overview.md')
    })
  })

  describe('componentAnalysis metadata values', () => {
    it('is required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['componentAnalysis'].required).toBe(true)
    })

    it('inputs 组件清单', () => {
      const workflow = getProjectAnalysisWorkflow()
      const inputs = workflow.stages['componentAnalysis'].inputs!
      const item = inputs.find(i => i.id === '组件清单')
      expect(item).toBeDefined()
    })

    it('outputs Markdown-only artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      const outputs = workflow.stages['componentAnalysis'].outputs!
      const findOutput = (id: string) => outputs.find(o => o.id === id)
      expect(findOutput('组件分析文档目录')?.type).toBe('folder')
      expect(findOutput('组件分析汇总')?.path).toBe('./.hyper-designer/projectAnalysis/component-analysis-summary.md')
    })
  })

  describe('missingCoverageCheck metadata values', () => {
    it('is required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['missingCoverageCheck'].required).toBe(true)
    })

    it('inputs 系统架构分析报告 and 组件清单', () => {
      const workflow = getProjectAnalysisWorkflow()
      const inputs = workflow.stages['missingCoverageCheck'].inputs!
      expect(inputs.find(i => i.id === '系统架构分析报告')).toBeDefined()
      expect(inputs.find(i => i.id === '组件清单')).toBeDefined()
    })

    it('outputs Markdown-only coverage report', () => {
      const workflow = getProjectAnalysisWorkflow()
      const outputs = workflow.stages['missingCoverageCheck'].outputs!
      expect(outputs).toHaveLength(1)
      expect(outputs.find(o => o.id === '覆盖率检查报告')?.path).toBe('./.hyper-designer/projectAnalysis/coverage-report.md')
    })
  })
})
