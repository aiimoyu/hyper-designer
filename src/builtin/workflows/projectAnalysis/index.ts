import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { type StageFileItem, type WorkflowDefinition, summarizeHook, workflowFilePrompt } from '../../../sdk/contracts'

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
  {
    id: '项目概览',
    path: './.hyper-designer/projectAnalysis/project-overview.md',
    type: 'file',
    description: 'Project overview with basic info, tech stack, directory structure, and entry points',
  },
]

const FUNCTION_TREE_MODULE_INPUTS: StageFileItem[] = [
  {
    id: '项目概览',
    path: './.hyper-designer/projectAnalysis/project-overview.md',
    type: 'file',
    description: 'Project overview from stage 1',
  },
]

const FUNCTION_TREE_MODULE_OUTPUTS: StageFileItem[] = [
  {
    id: '功能树',
    path: './.hyper-designer/projectAnalysis/function-tree.md',
    type: 'file',
    description: 'Function tree with hierarchy, dependencies, and module mapping',
  },
  {
    id: '模块关系',
    path: './.hyper-designer/projectAnalysis/module-relationships.md',
    type: 'file',
    description: 'Module relationships with dependencies, interfaces, and data flow',
  },
]

const INTERFACE_DATAFLOW_INPUTS: StageFileItem[] = [
  {
    id: '功能树',
    path: './.hyper-designer/projectAnalysis/function-tree.md',
    type: 'file',
    description: 'Function tree from stage 2',
  },
  {
    id: '模块关系',
    path: './.hyper-designer/projectAnalysis/module-relationships.md',
    type: 'file',
    description: 'Module relationships from stage 2',
  },
]

const INTERFACE_DATAFLOW_OUTPUTS: StageFileItem[] = [
  {
    id: '接口契约',
    path: './.hyper-designer/projectAnalysis/interface-contracts.md',
    type: 'file',
    description: 'Interface contracts with API catalog, function signatures, and error contracts',
  },
  {
    id: '数据流',
    path: './.hyper-designer/projectAnalysis/data-flow.md',
    type: 'file',
    description: 'Data flow with models, flow diagrams, transformations, and storage',
  },
]

const DEFECT_CHECK_INPUTS: StageFileItem[] = [
  {
    id: '项目概览',
    path: './.hyper-designer/projectAnalysis/project-overview.md',
    type: 'file',
    description: 'Project overview from stage 1',
  },
  {
    id: '功能树',
    path: './.hyper-designer/projectAnalysis/function-tree.md',
    type: 'file',
    description: 'Function tree from stage 2',
  },
  {
    id: '模块关系',
    path: './.hyper-designer/projectAnalysis/module-relationships.md',
    type: 'file',
    description: 'Module relationships from stage 2',
  },
  {
    id: '接口契约',
    path: './.hyper-designer/projectAnalysis/interface-contracts.md',
    type: 'file',
    description: 'Interface contracts from stage 3',
  },
  {
    id: '数据流',
    path: './.hyper-designer/projectAnalysis/data-flow.md',
    type: 'file',
    description: 'Data flow from stage 3',
  },
]

const DEFECT_CHECK_OUTPUTS: StageFileItem[] = [
  {
    id: '最终分析报告',
    path: './.hyper-designer/projectAnalysis/analysis-report.md',
    type: 'file',
    description: 'Final analysis report with completeness check, consistency check, defects found, and patches applied',
  },
]

export const projectAnalysisWorkflow: WorkflowDefinition = {
  id: 'projectAnalysis',
  name: 'Project Analysis',
  description: '4-stage prompt-driven workflow: project overview → function tree and module → interface and data flow → defect check and patch. All outputs are pure Markdown with YAML Front Matter.',
  entryStageId: 'projectOverview',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  stages: {
    projectOverview: {
      stageId: 'projectOverview',
      name: 'Project Overview',
      description: 'Analyze the target project and generate project overview and directory structure',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'projectOverview.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: [],
      outputs: PROJECT_OVERVIEW_OUTPUTS,
      transitions: [{ id: 'to-function-tree', toStageId: 'functionTreeAndModule', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行项目概览分析', currentName),
    },

    functionTreeAndModule: {
      stageId: 'functionTreeAndModule',
      name: 'Function Tree and Module',
      description: 'Build function tree and analyze module relationships',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'functionTreeAndModule.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: FUNCTION_TREE_MODULE_INPUTS,
      outputs: FUNCTION_TREE_MODULE_OUTPUTS,
      transitions: [{ id: 'to-interface', toStageId: 'interfaceAndDataFlow', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '建立功能树并分析模块关系', currentName),
    },

    interfaceAndDataFlow: {
      stageId: 'interfaceAndDataFlow',
      name: 'Interface and Data Flow',
      description: 'Analyze interface contracts and data flow',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'interfaceAndDataFlow.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: INTERFACE_DATAFLOW_INPUTS,
      outputs: INTERFACE_DATAFLOW_OUTPUTS,
      after: [{ id: 'summarize-interface', description: 'Summarize interface and data flow context', fn: summarizeHook }],
      transitions: [{ id: 'to-defect-check', toStageId: 'defectCheckAndPatch', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '分析接口契约和数据流', currentName),
    },

    defectCheckAndPatch: {
      stageId: 'defectCheckAndPatch',
      name: 'Defect Check and Patch',
      description: 'Check analysis completeness, patch previous outputs, and generate final report',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'defectCheckAndPatch.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: DEFECT_CHECK_INPUTS,
      outputs: DEFECT_CHECK_OUTPUTS,
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '检查分析完整性，修补输出，生成最终报告', currentName),
    },
  },
}
