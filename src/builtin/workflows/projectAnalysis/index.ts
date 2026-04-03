import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { StageFileItem, WorkflowDefinition } from '../../../types'
import { summarizeHook } from '../../../workflows/stageHooks'
import { filePrompt as workflowFilePrompt } from '../../../workflows/utils'

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

const PROJECT_OVERVIEW_OUTPUTS: StageFileItem[] = [
  { id: '项目概览', path: './.hyper-designer/projectAnalysis/overview.md', type: 'file', description: 'Project overview with basic info, tech stack, directory structure, and entry points' },
  { id: '系统架构', path: './.hyper-designer/projectAnalysis/architecture.md', type: 'file', description: 'System architecture with layers, design patterns, and component relationships' },
  { id: '模块分析', path: './.hyper-designer/projectAnalysis/modules.md', type: 'file', description: 'Module hierarchy, dependencies, interfaces, and data flow' },
  { id: 'SKILL文档', path: './.hyper-designer/projectAnalysis/SKILL.md', type: 'file', description: 'Documentation for the project-analysis skill, including methodology and output instructions' },
]

const COMPONENT_ANALYSIS_INPUTS: StageFileItem[] = [
  { id: '项目概览', path: './.hyper-designer/projectAnalysis/overview.md', type: 'file', description: 'Project overview from stage 1' },
  { id: '系统架构', path: './.hyper-designer/projectAnalysis/architecture.md', type: 'file', description: 'System architecture from stage 1' },
  { id: '模块分析', path: './.hyper-designer/projectAnalysis/modules.md', type: 'file', description: 'Module analysis from stage 1' },
]

const COMPONENT_ANALYSIS_OUTPUTS: StageFileItem[] = [
  { id: '组件分析', path: './.hyper-designer/projectAnalysis/components/', type: 'folder', description: 'Individual component analysis files (C001-xxx.md, C002-xxx.md, etc.)' },
  { id: '项目原则', path: './.hyper-designer/projectAnalysis/principles', type: 'folder', description: 'Project principles and guidelines' }
]

export const projectAnalysisWorkflow: WorkflowDefinition = {
  id: 'projectAnalysis',
  name: 'Project Analysis',
  description: '2-stage workflow: system analysis → component analysis. Generates architecture docs, module analysis, and detailed component documentation.',
  entryStageId: 'systemAnalysis',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'systemAnalysis.md')),
  },

  stages: {
    systemAnalysis: {
      stageId: 'systemAnalysis',
      name: 'System Analysis',
      description: 'Analyze the target project: basic info, tech stack, architecture, modules, and dependencies.',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'systemAnalysis.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: [],
      outputs: PROJECT_OVERVIEW_OUTPUTS,
      transitions: [{ id: 'to-component-analysis', toStageId: 'componentAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行系统分析，生成overview.md、architecture.md、modules.md、SKILL.md 到 **当前目录的**（不是分析项目目录） `.hyper-designer/projectAnalysis` 目录下，你应该首先载入 `project-analysis` skill，根据路由模式阅读系统分析相关内容，并按照其文档进行操作', currentName),
    },

    componentAnalysis: {
      stageId: 'componentAnalysis',
      name: 'Component Analysis',
      description: 'Deep dive into each component: file structure, classes, functions, design patterns, data flow.',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'componentAnalysis.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: COMPONENT_ANALYSIS_INPUTS,
      outputs: COMPONENT_ANALYSIS_OUTPUTS,
      after: [{ id: 'summarize-components', description: 'Summarize component analysis context', fn: summarizeHook }],
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '深入分析每个组件，生成详细的组件分析文件到 **当前目录的**（不是分析项目目录） `.hyper-designer/projectAnalysis` 目录下，你应该首先载入 `project-analysis` skill，根据路由模式阅读组件分析相关内容，并按照其文档进行操作', currentName),
    },
  },
}
