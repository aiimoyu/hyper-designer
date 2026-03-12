/**
 * Tests for projectAnalysis workflow stage metadata fields.
 * Verifies that all 3 stages have required, inputs, outputs, promptBindings defined.
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

      it('does not have gate milestone enabled', () => {
        const workflow = getProjectAnalysisWorkflow()
        expect(workflow.stages[key].stageMilestones).not.toContain('gate')
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

    it('outputs the canonical system-analysis artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['systemAnalysis'].outputs).toEqual({
        '系统架构分析报告': {
          path: '.hyper-designer/projectAnalysis/architecture.md',
          description: 'System architecture analysis report',
        },
        '项目分析清单': {
          path: '.hyper-designer/projectAnalysis/_meta/manifest.json',
          description: 'Project analysis manifest',
        },
        '系统分析清单': {
          path: '.hyper-designer/projectAnalysis/_meta/system-analysis.json',
          description: 'System analysis manifest',
        },
        '组件清单': {
          path: '.hyper-designer/projectAnalysis/_meta/component-manifest.json',
          description: 'Component manifest',
        },
        'API清单': {
          path: '.hyper-designer/projectAnalysis/_meta/api-manifest.json',
          description: 'API manifest',
        },
        '源码清单': {
          path: '.hyper-designer/projectAnalysis/_meta/source-inventory.json',
          description: 'Source inventory',
        },
      })
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

    it('outputs the canonical component-analysis artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['componentAnalysis'].outputs).toEqual({
        '组件分析文档目录': {
          path: '.hyper-designer/projectAnalysis/component/',
          description: 'Component analysis markdown outputs',
        },
        '组件分析元数据目录': {
          path: '.hyper-designer/projectAnalysis/_meta/components/',
          description: 'Component analysis metadata outputs',
        },
        '组件分析汇总': {
          path: '.hyper-designer/projectAnalysis/_meta/component-analysis-summary.json',
          description: 'Component analysis summary',
        },
      })
    })
  })

  describe('missingCoverageCheck metadata values', () => {
    it('is required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['missingCoverageCheck'].required).toBe(true)
    })

    it('inputs 系统架构分析报告 and 组件分析汇总 as required', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['missingCoverageCheck'].inputs!['系统架构分析报告']).toEqual({ required: true })
      expect(workflow.stages['missingCoverageCheck'].inputs!['组件分析汇总']).toEqual({ required: true })
    })

    it('outputs the canonical coverage-check artifact set', () => {
      const workflow = getProjectAnalysisWorkflow()
      expect(workflow.stages['missingCoverageCheck'].outputs).toEqual({
        '覆盖率检查报告': {
          path: '.hyper-designer/projectAnalysis/coverage-report.md',
          description: 'Coverage report',
        },
        '覆盖率检查数据': {
          path: '.hyper-designer/projectAnalysis/_meta/coverage-report.json',
          description: 'Coverage report metadata',
        },
      })
    })
  })
})
