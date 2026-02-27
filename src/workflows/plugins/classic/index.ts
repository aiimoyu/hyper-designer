import type { WorkflowDefinition } from '../../core/types'
import { irAnalysisCollectorHook, scenarioAnalysisCollectorHook, systemDesignCollectorHook, summarizeHook } from './hooks'

/**
 * Classic Requirements Engineering Workflow
 *
 * An 8-stage workflow for comprehensive requirements engineering and system design.
 * This workflow covers the full lifecycle from data collection through module functional design.
 */
export const classicWorkflow: WorkflowDefinition = {
  id: 'classic',
  name: 'Classic Requirements Engineering',
  description: '7-stage workflow: IR analysis → scenario analysis → use case analysis → functional refinement → requirement decomposition → system functional design → module functional design',

  promptFile: 'prompts/workflow.md',

  stageFallbackPromptFile: 'prompts/fallback.md',

  stageOrder: [
    'IRAnalysis',
    'scenarioAnalysis',
    'useCaseAnalysis',
    'functionalRefinement',
    'requirementDecomposition',
    'systemFunctionalDesign',
    'moduleFunctionalDesign',
  ],

  stages: {
    IRAnalysis: {
      name: 'Initial Requirement Analysis',
      description: 'Conduct initial requirement analysis using 5W2H framework and Socratic questioning',
      agent: 'HArchitect',
      promptFile: 'prompts/IRAnalysis.md',
      beforeStage: [irAnalysisCollectorHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Initial Requirement Analysis阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，进行初始需求分析，输出需求信息文档。下面请开始你的工作。`
      },
    },

    scenarioAnalysis: {
      name: 'Scenario Analysis',
      description: 'Analyze system usage scenarios, identify actors and business processes',
      agent: 'HArchitect',
      promptFile: 'prompts/scenarioAnalysis.md',
      beforeStage: [scenarioAnalysisCollectorHook],
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Scenario Analysis阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，分析系统的各种使用场景，识别主要参与者和业务流程。下面请开始你的工作。`
      },
    },

    useCaseAnalysis: {
      name: 'Use Case Analysis',
      description: 'Refine scenarios into detailed use case specifications with inputs, outputs, and acceptance criteria',
      agent: 'HArchitect',
      promptFile: 'prompts/useCaseAnalysis.md',
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Use Case Analysis阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，将场景细化为详细的用例规格，明确输入输出和验收标准。下面请开始你的工作。`
      },
    },

    functionalRefinement: {
      name: 'Functional Refinement',
      description: 'Extract complete functional list, prioritize using MoSCoW method, and perform FMEA analysis',
      agent: 'HArchitect',
      promptFile: 'prompts/functionalRefinement.md',
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Functional Refinement阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，整理完整功能列表，进行优先级排序和FMEA分析。下面请开始你的工作。`
      },
    },

    requirementDecomposition: {
      name: 'Requirement Decomposition',
      description: 'Map and decompose functional list into module-level requirements, subsystems, and interface definitions',
      agent: 'HEngineer',
      promptFile: 'prompts/requirementDecomposition.md',
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Requirement Decomposition阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，将功能列表映射并分解为模块级需求、子系统和接口定义。下面请开始你的工作。`
      },
    },

    systemFunctionalDesign: {
      name: 'System Functional Design',
      description: 'Design system architecture, select technology stack, define data models and interaction protocols',
      agent: 'HEngineer',
      promptFile: 'prompts/systemFunctionalDesign.md',
      beforeStage: [systemDesignCollectorHook],
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入System Functional Design阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，基于需求分解结果，设计系统架构、选择技术栈、定义数据模型与交互协议。下面请开始你的工作。`
      },
    },

    moduleFunctionalDesign: {
      name: 'Module Functional Design',
      description: 'Output detailed technical specifications for each module: responsibilities, interfaces, internal structure, algorithms, data structures, test strategies',
      agent: 'HEngineer',
      promptFile: 'prompts/moduleFunctionalDesign.md',
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Module Functional Design阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，为每个模块输出详细的技术规格。下面请开始你的工作。`
      },
    },
  },
}
