import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { filePrompt } from '../../core/utils'
import type { WorkflowDefinition } from '../../core/types'

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
  description: '3-stage workflow shell: system analysis → component analysis → missing coverage check',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': filePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  fallbackPromptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'fallback.md')),
  },

  stageOrder: [
    'systemAnalysis',
    'componentAnalysis',
    'missingCoverageCheck',
  ],

  stages: {
    systemAnalysis: {
      name: 'System Analysis',
      description: 'Analyze the target project at system level and produce the system analysis report',
      agent: 'HAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'systemAnalysis.md')),
      },
      stageMilestones: [],
      required: true,
      inputs: {},
      outputs: {
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
      },
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行系统级分析', currentName),
    },

    componentAnalysis: {
      name: 'Component Analysis',
      description: 'Analyze project components based on the system analysis report',
      agent: 'HAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'componentAnalysis.md')),
      },
      stageMilestones: [],
      required: true,
      inputs: {
        '组件清单': { required: true },
      },
      outputs: {
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
      },
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '基于系统分析报告执行组件分析', currentName),
    },

    missingCoverageCheck: {
      name: 'Missing Coverage Check',
      description: 'Check missing analysis coverage based on the component analysis report',
      agent: 'HAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'missingCoverageCheck.md')),
      },
      stageMilestones: [],
      required: true,
      inputs: {
        '系统架构分析报告': { required: true },
        '组件分析汇总': { required: true },
      },
      outputs: {
        '覆盖率检查报告': {
          path: '.hyper-designer/projectAnalysis/coverage-report.md',
          description: 'Coverage report',
        },
        '覆盖率检查数据': {
          path: '.hyper-designer/projectAnalysis/_meta/coverage-report.json',
          description: 'Coverage report metadata',
        },
      },
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行缺失覆盖率检查', currentName),
    },
  },
}
