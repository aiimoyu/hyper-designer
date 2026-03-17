import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { filePrompt } from '../../../../workflows/core/utils'
import type { WorkflowDefinition } from '../../../../workflows/core/types'

const __dirname = dirname(fileURLToPath(import.meta.url))

function buildHandoverPrompt(thisName: string, stageTask: string, currentName?: string | null): string {
  const thisDisplay = thisName.toUpperCase()
  const fromDisplay = currentName ? currentName.toUpperCase() : null
  const phaseHeader = fromDisplay
    ? `[ PHASE: ${fromDisplay} → ${thisDisplay} ]`
    : `[ PHASE: ${thisDisplay} ]`
  const switchMsg = fromDisplay
    ? `工作流已从 \`${fromDisplay}\` 切换至 \`${thisDisplay}\`。`
    : `工作流已切换至 \`${thisDisplay}\`。`

  return (
    `${phaseHeader}\n\n` +
    `${switchMsg} 请基于当前上下文与前序产物，${stageTask}，并生成本阶段要求的输出。\n\n` +
    '请遵循 Single-Stage Processing Pipeline，立即开始工作。'
  )
}

export const projectAnalysisWorkflow: WorkflowDefinition = {
  id: 'projectAnalysis',
  name: 'Project Analysis',
  description: '3-stage prompt-driven workflow: system analysis → component analysis → missing coverage check. All outputs are pure Markdown.',
  entryStageId: 'systemAnalysis',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': filePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  stages: {
    systemAnalysis: {
      stageId: 'systemAnalysis',
      name: 'System Analysis',
      description: 'Analyze the target project at system level and produce the system architecture report',
      agent: 'HAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'systemAnalysis.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: {},
      outputs: {
        '系统架构分析报告': {
          path: '.hyper-designer/projectAnalysis/architecture.md',
          description: 'System architecture analysis report (5 dimensions + Mermaid)',
        },
        '组件清单': {
          path: '.hyper-designer/projectAnalysis/components-manifest.md',
          description: 'Component manifest (markdown table, source of truth for Stage 2)',
        },
        'API目录': {
          path: '.hyper-designer/projectAnalysis/api-catalog.md',
          description: 'API catalog and component mapping',
        },
        '源码概览': {
          path: '.hyper-designer/projectAnalysis/source-overview.md',
          description: 'Source file inventory and statistics',
        },
      },
      transitions: [{ id: 'to-component', toStageId: 'componentAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行系统级分析', currentName),
    },

    componentAnalysis: {
      stageId: 'componentAnalysis',
      name: 'Component Analysis',
      description: 'Analyze each component from the manifest across 4 dimensions',
      agent: 'HAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'componentAnalysis.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: {
        '系统架构分析报告': { required: true },
        '组件清单': { required: true },
      },
      outputs: {
        '组件分析文档目录': {
          path: '.hyper-designer/projectAnalysis/components/',
          description: 'Per-component analysis markdown files',
        },
        '组件分析汇总': {
          path: '.hyper-designer/projectAnalysis/component-analysis-summary.md',
          description: 'Component analysis summary report',
        },
      },
      transitions: [{ id: 'to-coverage', toStageId: 'missingCoverageCheck', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '基于组件清单执行组件分析', currentName),
    },

    missingCoverageCheck: {
      stageId: 'missingCoverageCheck',
      name: 'Missing Coverage Check',
      description: 'Check missing analysis coverage across 7 categories (diagnostic, non-gating)',
      agent: 'HAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'missingCoverageCheck.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: {
        '系统架构分析报告': { required: true },
        '组件清单': { required: true },
      },
      outputs: {
        '覆盖率检查报告': {
          path: '.hyper-designer/projectAnalysis/coverage-report.md',
          description: 'Coverage report with verdict, severity, and remediation guidance',
        },
      },
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行缺失覆盖率检查', currentName),
    },
  },
}
