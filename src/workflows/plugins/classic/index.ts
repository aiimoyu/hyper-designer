import { filePrompt } from '../../core/utils'
import type { WorkflowDefinition } from '../../core/types'
import { createHCollectorHook, summarizeHook } from '../../core/stageHooks'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLASSIC_HANDOVER_MILESTONES = ['gate']

/** 阶段钩子定义 */
const irAnalysisCollectorHook = createHCollectorHook({ domains: ['domainAnalysis'] })
const scenarioAnalysisCollectorHook = createHCollectorHook({ domains: ['systemRequirementAnalysis'] })
const systemDesignCollectorHook = createHCollectorHook({ domains: ['systemDesign', 'codebase'] })

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
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': filePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  stages: {
    IRAnalysis: {
      stageId: 'IRAnalysis',
      name: 'Initial Requirement Analysis',
      description: 'Conduct initial requirement analysis using 5W2H framework and Socratic questioning',
      agent: 'HArchitect',
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'IRAnalysis.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {},
      outputs: {
        '需求信息': { path: '需求信息.md', description: 'Initial requirement analysis document' },
      },
      before: [{ id: 'collect-ir', description: 'Collect IR references', fn: irAnalysisCollectorHook }],
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'scenarioAnalysis.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {
        '需求信息': { required: true },
      },
      outputs: {
        '功能场景': { path: '功能场景.md', description: 'Functional scenario specifications' },
      },
      before: [{ id: 'collect-scenario', description: 'Collect scenario references', fn: scenarioAnalysisCollectorHook }],
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'useCaseAnalysis.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {
        '功能场景': { required: true },
      },
      outputs: {
        '用例': { path: '用例.md', description: 'Use case specifications' },
      },
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'functionalRefinement.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {
        '用例': { required: true },
      },
      outputs: {
        '功能列表': { path: '功能列表.md', description: 'Refined functional requirements' },
      },
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'requirementDecomposition.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {
        '功能列表': { required: true },
      },
      outputs: {
        'SR-AR 分解': { path: 'SR-AR 分解.md', description: 'System-Allocation requirement decomposition' },
      },
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'systemFunctionalDesign.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {
        'SR-AR 分解': { required: true },
      },
      outputs: {
        '系统功能设计': { path: '系统功能设计.md', description: 'System-level functional design' },
      },
      before: [{ id: 'collect-system-design', description: 'Collect system-design references', fn: systemDesignCollectorHook }],
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'moduleFunctionalDesign.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: true,
      inputs: {
        '系统功能设计': { required: true },
      },
      outputs: {
        '模块功能设计': { path: '模块功能设计.md', description: 'Module-level functional design' },
      },
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
      inject: ['stage-milestones'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'sddPlanGeneration.md')),
      },
      requiredMilestones: CLASSIC_HANDOVER_MILESTONES,
      required: false,
      inputs: {
        '模块功能设计': { required: true },
      },
      outputs: {
        'SDD 计划': { path: 'SDD 计划.md', description: 'SDD development plan' },
      },
      after: [{ id: 'summarize-sdd-plan', description: 'Summarize SDD planning context', fn: summarizeHook }],
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '基于模块功能设计说明书，生成可直接分发给 subagent 执行的 SDD 开发计划', currentName),
    },
  },
}
