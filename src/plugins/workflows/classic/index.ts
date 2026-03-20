import {
  type MilestoneDefinition,
  type StageFileItem,
  type WorkflowDefinition,
  summarizeHook,
  workflowFilePrompt,
} from '../../../sdk/contracts'
import { referenceSetupHook } from './hooks/referenceSetupHook'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HANDOVER_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'gate',
    name: 'Quality Gate',
    description: 'A phase quality gate to ensure deliverables meet quality standards. Please invoke HCritic for a quality review after materials are prepared. This milestone will be activated by HCritic upon approval.',
    failureMessage: 'Phase output failed the quality gate review. Please ensure deliverables are submitted to HCritic and meet quality standards before proceeding with the handover.',
  },
  {
    id: "hd-int-mod",
    name: "Interactive Modification",
    description: "This milestone will be automatically activated after the document has been interactively modified with the user. To ensure document quality and alignment with user intent, interactive modification is required. Use the `hd_prepare_review` and `hd_finalize_review` tools to retrieve the modifications and complete this milestone.",
    failureMessage: "The 'Interactive Modification' milestone is not completed. You must use `hd_prepare_review` and `hd_finalize_review` tools to retrieve changes and activate this milestone. Only then can you proceed to the next stage.",
  }
]

const IR_ANALYSIS_OUTPUTS: StageFileItem[] = [
  {
    id: '需求信息',
    path: './.hyper-designer/IRAnalysis/需求信息.md',
    type: 'file',
    description: 'Initial requirement analysis document covering all 5W2H dimensions',
  },
]

const SCENARIO_ANALYSIS_INPUTS: StageFileItem[] = [
  {
    id: '需求信息',
    path: './.hyper-designer/IRAnalysis/需求信息.md',
    type: 'file',
    description: 'Initial requirement analysis document',
  },
]

const SCENARIO_ANALYSIS_OUTPUTS: StageFileItem[] = [
  {
    id: '功能场景',
    path: './.hyper-designer/scenarioAnalysis/*场景.md',
    type: 'pattern',
    description: 'Functional scenario specifications by type (business/operation/maintenance/manufacturing/other)',
  },
]

const USE_CASE_ANALYSIS_INPUTS: StageFileItem[] = [
  {
    id: '功能场景',
    path: './.hyper-designer/scenarioAnalysis/*场景.md',
    type: 'pattern',
    description: 'Functional scenario documents to be refined into use cases',
  },
]

const USE_CASE_ANALYSIS_OUTPUTS: StageFileItem[] = [
  {
    id: '用例',
    path: './.hyper-designer/useCaseAnalysis/*用例.md',
    type: 'pattern',
    description: 'Use case specifications with tables, PlantUML diagrams, and data dictionaries',
  },
]

const FUNCTIONAL_REFINEMENT_INPUTS: StageFileItem[] = [
  {
    id: '需求信息',
    path: './.hyper-designer/IRAnalysis/需求信息.md',
    type: 'file',
    description: 'Initial requirement analysis document for context and constraints',
  },
  {
    id: '用例',
    path: './.hyper-designer/useCaseAnalysis/*用例.md',
    type: 'pattern',
    description: 'Use case documents to extract function lists from',
  },
]

const FUNCTIONAL_REFINEMENT_OUTPUTS: StageFileItem[] = [
  {
    id: '功能列表',
    path: './.hyper-designer/functionalRefinement/*功能列表.md',
    type: 'pattern',
    description: 'Refined functional requirements with MoSCoW prioritization and SR mapping',
  },
  {
    id: 'FMEA',
    path: './.hyper-designer/functionalRefinement/*FMEA.md',
    type: 'pattern',
    description: 'FMEA risk analysis matrices with failure modes and countermeasures',
  },
]

const REQUIREMENT_DECOMPOSITION_INPUTS: StageFileItem[] = [
  {
    id: '需求信息',
    path: './.hyper-designer/IRAnalysis/需求信息.md',
    type: 'file',
    description: 'Initial requirement analysis document for context',
  },
  {
    id: '功能列表',
    path: './.hyper-designer/functionalRefinement/*功能列表.md',
    type: 'pattern',
    description: 'Function lists to decompose into SR-AR mapping',
  },
]

const REQUIREMENT_DECOMPOSITION_OUTPUTS: StageFileItem[] = [
  {
    id: 'SR-AR分解',
    path: './.hyper-designer/requirementDecomposition/sr-ar-decomposition.md',
    type: 'file',
    description: 'System-Allocation requirement decomposition with module interfaces',
  },
  {
    id: '追溯报告',
    path: './.hyper-designer/requirementDecomposition/traceability-report.md',
    type: 'file',
    description: 'IR→SR→AR traceability verification report',
  },
]

const SYSTEM_FUNCTIONAL_DESIGN_INPUTS: StageFileItem[] = [
  {
    id: '需求信息',
    path: './.hyper-designer/IRAnalysis/需求信息.md',
    type: 'file',
    description: 'Initial requirement analysis document',
  },
  {
    id: 'SR-AR分解',
    path: './.hyper-designer/requirementDecomposition/sr-ar-decomposition.md',
    type: 'file',
    description: 'SR-AR decomposition for module-level requirements',
  },
  {
    id: '功能列表',
    path: './.hyper-designer/functionalRefinement/*功能列表.md',
    type: 'pattern',
    description: 'Function lists for NFR/DFX summary reference',
  },
]

const SYSTEM_FUNCTIONAL_DESIGN_OUTPUTS: StageFileItem[] = [
  {
    id: '系统设计',
    path: './.hyper-designer/systemFunctionalDesign/system-design.md',
    type: 'file',
    description: 'System-level architecture design with 12 sections (§0-§11)',
  },
]

const MODULE_FUNCTIONAL_DESIGN_INPUTS: StageFileItem[] = [
  {
    id: '系统设计',
    path: './.hyper-designer/systemFunctionalDesign/system-design.md',
    type: 'file',
    description: 'System architecture design for module boundaries',
  },
  {
    id: 'SR-AR分解',
    path: './.hyper-designer/requirementDecomposition/sr-ar-decomposition.md',
    type: 'file',
    description: 'SR-AR decomposition for AR assignment',
  },
  {
    id: '功能列表',
    path: './.hyper-designer/functionalRefinement/*功能列表.md',
    type: 'pattern',
    description: 'Function lists for NFR/DFX reference',
  },
]

const MODULE_FUNCTIONAL_DESIGN_OUTPUTS: StageFileItem[] = [
  {
    id: '模块设计',
    path: './.hyper-designer/moduleFunctionalDesign/*设计.md',
    type: 'pattern',
    description: 'Module-level technical specifications with 10 sections (§0-§9)',
  },
]

const SDD_PLAN_GENERATION_INPUTS: StageFileItem[] = [
  {
    id: '系统设计',
    path: './.hyper-designer/systemFunctionalDesign/system-design.md',
    type: 'file',
    description: 'System design for technology stack and module dependencies',
  },
  {
    id: 'SR-AR分解',
    path: './.hyper-designer/requirementDecomposition/sr-ar-decomposition.md',
    type: 'file',
    description: 'SR-AR decomposition for acceptance criteria tracing',
  },
  {
    id: '模块设计',
    path: './.hyper-designer/moduleFunctionalDesign/*设计.md',
    type: 'pattern',
    description: 'Module design documents for task decomposition',
  },
]

const SDD_PLAN_GENERATION_OUTPUTS: StageFileItem[] = [
  {
    id: 'SDD计划',
    path: './dev-plan/*-dev-plan.md',
    type: 'pattern',
    description: 'SDD development plans with task waves, complexity ratings, and QA scenarios',
  },
]

/**
 * 生成阶段移交提示词
 *
 * 使用 stage.name（显示名称）直接构造英文模板，无需维护独立的映射表。
 * 由 handover.ts 负责将 currentStage key 解析为 stage name 后传入。
 *
 * @param thisName    目标阶段显示名称（来自 stageConfig.name）
 * @param stageTask   阶段任务描述（动词短语）
 * @param currentName 来源阶段显示名称（来自 handover.ts 解析，可选）
 */
function buildHandoverPrompt(thisName: string, stageTask: string, currentName?: string | null): string {
  const thisDisplay = thisName.toUpperCase()
  const fromDisplay = currentName ? currentName.toUpperCase() : null
  const phaseHeader = fromDisplay
    ? `[ PHASE: ${fromDisplay} \u2192 ${thisDisplay} ]`
    : `[ PHASE: ${thisDisplay} ]`
  const switchMsg = fromDisplay
    ? `工作流已从 \`${fromDisplay}\` 切换至 \`${thisDisplay}\`。`
    : `工作流已切换至 \`${thisDisplay}\`。`
  return (
    `${phaseHeader}\n\n` +
    `${switchMsg} 请基于上下文、已收集数据及前期输出，` +
    `${stageTask}，以生成本阶段所需输出。\n\n` +
    `请遵循 Single-Stage Processing Pipeline，立即开始工作。`
  )
}

/**
 * Classic Requirements Engineering Workflow
 *
 * An 8-stage workflow for comprehensive requirements engineering and system design.
 * This workflow covers the full lifecycle from data collection through module functional design.
 */
export const classicWorkflow: WorkflowDefinition = {
  id: 'classic',
  name: 'Classic Requirements Engineering',
  description: '8-stage workflow: IR analysis → scenario analysis → use case analysis → functional refinement → requirement decomposition → system functional design → module functional design → SDD plan generation',
  entryStageId: 'IRAnalysis',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  stages: {
    IRAnalysis: {
      stageId: 'IRAnalysis',
      name: 'Initial Requirement Analysis',
      description: 'Conduct initial requirement analysis using 5W2H framework and Socratic questioning',
      agent: 'HArchitect',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],  
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'IRAnalysis.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: [],
      outputs: IR_ANALYSIS_OUTPUTS,
      before: [{ id: 'reference-setup', description: 'Setup REFERENCE.md and wait for user confirmation', agent: "Hyper", fn: referenceSetupHook }],
      after: [{ id: 'summarize-ir', description: 'Summarize IR context', fn: summarizeHook }],
      transitions: [{ id: 'to-scenario', toStageId: 'scenarioAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行严格的需求分析', currentName),
    },

    scenarioAnalysis: {
      stageId: 'scenarioAnalysis',
      name: 'Scenario Analysis',
      description: 'Analyze system usage scenarios, identify actors and business processes',
      agent: 'HArchitect',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'scenarioAnalysis.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: SCENARIO_ANALYSIS_INPUTS,
      outputs: SCENARIO_ANALYSIS_OUTPUTS,
      before: [],
      after: [{ id: 'summarize-scenario', description: 'Summarize scenario context', fn: summarizeHook }],
      transitions: [{ id: 'to-usecase', toStageId: 'useCaseAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '分析系统使用场景，识别参与者与业务流程', currentName),
    },

    useCaseAnalysis: {
      stageId: 'useCaseAnalysis',
      name: 'Use Case Analysis',
      description: 'Refine scenarios into detailed use case specifications with inputs, outputs, and acceptance criteria',
      agent: 'HArchitect',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'useCaseAnalysis.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: USE_CASE_ANALYSIS_INPUTS,
      outputs: USE_CASE_ANALYSIS_OUTPUTS,
      after: [{ id: 'summarize-usecase', description: 'Summarize use-case context', fn: summarizeHook }],
      transitions: [{ id: 'to-functional', toStageId: 'functionalRefinement', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '将场景细化为详细的用例规格说明，明确输入、输出与验收标准', currentName),
    },

    functionalRefinement: {
      stageId: 'functionalRefinement',
      name: 'Functional Refinement',
      description: 'Extract complete functional list, prioritize using MoSCoW method, and perform FMEA analysis',
      agent: 'HArchitect',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'functionalRefinement.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: FUNCTIONAL_REFINEMENT_INPUTS,
      outputs: FUNCTIONAL_REFINEMENT_OUTPUTS,
      after: [{ id: 'summarize-functional', description: 'Summarize functional context', fn: summarizeHook }],
      transitions: [{ id: 'to-decompose', toStageId: 'requirementDecomposition', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '提取完整功能列表，使用 MoSCoW 方法进行优先级排序，并执行 FMEA 分析', currentName),
    },

    requirementDecomposition: {
      stageId: 'requirementDecomposition',
      name: 'Requirement Decomposition',
      description: 'Map and decompose functional list into module-level requirements, subsystems, and interface definitions',
      agent: 'HEngineer',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'requirementDecomposition.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: REQUIREMENT_DECOMPOSITION_INPUTS,
      outputs: REQUIREMENT_DECOMPOSITION_OUTPUTS,
      after: [{ id: 'summarize-decompose', description: 'Summarize decomposition context', fn: summarizeHook }],
      transitions: [{ id: 'to-system-design', toStageId: 'systemFunctionalDesign', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '将功能列表映射并分解为模块级需求、子系统及接口定义', currentName),
    },

    systemFunctionalDesign: {
      stageId: 'systemFunctionalDesign',
      name: 'System Functional Design',
      description: 'Design system architecture, select technology stack, define data models and interaction protocols',
      agent: 'HEngineer',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'systemFunctionalDesign.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: SYSTEM_FUNCTIONAL_DESIGN_INPUTS,
      outputs: SYSTEM_FUNCTIONAL_DESIGN_OUTPUTS,
      before: [],
      after: [{ id: 'summarize-system-design', description: 'Summarize system-design context', fn: summarizeHook }],
      transitions: [{ id: 'to-module-design', toStageId: 'moduleFunctionalDesign', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '基于已分解的需求，设计系统架构、选择技术栈，并定义数据模型与交互协议', currentName),
    },

    moduleFunctionalDesign: {
      stageId: 'moduleFunctionalDesign',
      name: 'Module Functional Design',
      description: 'Output detailed technical specifications for each module: responsibilities, interfaces, internal structure, algorithms, data structures, test strategies',
      agent: 'HEngineer',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'moduleFunctionalDesign.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: true,
      inputs: MODULE_FUNCTIONAL_DESIGN_INPUTS,
      outputs: MODULE_FUNCTIONAL_DESIGN_OUTPUTS,
      after: [{ id: 'summarize-module-design', description: 'Summarize module-design context', fn: summarizeHook }],
      transitions: [{ id: 'to-sdd-plan', toStageId: 'sddPlanGeneration', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '为各模块输出详细技术规格说明，涵盖职责、接口、内部结构、算法、数据结构及测试策略', currentName),
    },

    sddPlanGeneration: {
      stageId: 'sddPlanGeneration',
      name: 'SDD Plan Generation',
      description: 'Generate specification-driven development (SDD) plans from module functional design docs: task waves, complexity ratings, subagent dispatch strategy, interface cards, acceptance criteria and TDD scenarios',
      agent: 'HEngineer',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'sddPlanGeneration.md')),
      },
      requiredMilestones: HANDOVER_MILESTONES,
      required: false,
      inputs: SDD_PLAN_GENERATION_INPUTS,
      outputs: SDD_PLAN_GENERATION_OUTPUTS,
      after: [{ id: 'summarize-sdd-plan', description: 'Summarize SDD planning context', fn: summarizeHook }],
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '基于模块功能设计说明书，生成可直接分发给 subagent 执行的 SDD 开发计划', currentName),
    },
  },
}
