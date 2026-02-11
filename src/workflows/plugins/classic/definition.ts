import type { WorkflowDefinition } from '../../core/types'

/**
 * Classic Requirements Engineering Workflow
 * 
 * An 8-stage workflow for comprehensive requirements engineering and system design.
 * This workflow covers the full lifecycle from data collection through module functional design.
 */
export const classicWorkflow: WorkflowDefinition = {
  id: 'classic',
  name: 'Classic Requirements Engineering',
  description: '8-stage workflow: data collection → IR analysis → scenario analysis → use case analysis → functional refinement → requirement decomposition → system functional design → module functional design',

  promptFile: 'prompts/workflow.md',

  stageFallbackPromptFile: 'prompts/fallback.md',

  stageOrder: [
    'dataCollection',
    'IRAnalysis',
    'scenarioAnalysis',
    'useCaseAnalysis',
    'functionalRefinement',
    'requirementDecomposition',
    'systemFunctionalDesign',
    'moduleFunctionalDesign',
  ],

  stages: {
    dataCollection: {
      name: 'Data Collection',
      description: 'Collect reference materials, code analysis, domain knowledge, and scenario libraries',
      agent: 'HCollector',
      promptFile: 'prompts/dataCollection.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Data Collection阶段。请收集相关的参考资料、代码分析、领域知识和场景库，为后续需求分析提供充分的背景信息。`
      },
    },

    IRAnalysis: {
      name: 'Initial Requirement Analysis',
      description: 'Conduct initial requirement analysis using 5W2H framework and Socratic questioning',
      agent: 'HArchitect',
      skill: 'ir-analysis',
      promptFile: 'prompts/IRAnalysis.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Initial Requirement Analysis阶段。请基于已收集的资料，进行初始需求分析，输出需求信息文档。`
      },
    },

    scenarioAnalysis: {
      name: 'Scenario Analysis',
      description: 'Analyze system usage scenarios, identify actors and business processes',
      agent: 'HArchitect',
      skill: 'scenario-analysis',
      promptFile: 'prompts/scenarioAnalysis.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Scenario Analysis阶段。请分析系统的各种使用场景，识别主要参与者和业务流程。`
      },
    },

    useCaseAnalysis: {
      name: 'Use Case Analysis',
      description: 'Refine scenarios into detailed use case specifications with inputs, outputs, and acceptance criteria',
      agent: 'HArchitect',
      skill: 'use-case-analysis',
      promptFile: 'prompts/useCaseAnalysis.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Use Case Analysis阶段。请将场景细化为详细的用例规格，明确输入输出和验收标准。`
      },
    },

    functionalRefinement: {
      name: 'Functional Refinement',
      description: 'Extract complete functional list, prioritize using MoSCoW method, and perform FMEA analysis',
      agent: 'HArchitect',
      skill: 'functional-refinement',
      promptFile: 'prompts/functionalRefinement.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Functional Refinement阶段。请整理完整功能列表，进行优先级排序和FMEA分析。`
      },
    },

    requirementDecomposition: {
      name: 'Requirement Decomposition',
      description: 'Map and decompose functional list into module-level requirements, subsystems, and interface definitions',
      agent: 'HEngineer',
      skill: 'sr-ar-decomposition',
      promptFile: 'prompts/requirementDecomposition.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Requirement Decomposition阶段。请将功能列表映射并分解为模块级需求、子系统和接口定义。`
      },
    },

    systemFunctionalDesign: {
      name: 'System Functional Design',
      description: 'Design system architecture, select technology stack, define data models and interaction protocols',
      agent: 'HEngineer',
      skill: 'functional-design',
      promptFile: 'prompts/systemFunctionalDesign.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入System Functional Design阶段。请基于需求分解结果，设计系统架构、选择技术栈、定义数据模型与交互协议。`
      },
    },

    moduleFunctionalDesign: {
      name: 'Module Functional Design',
      description: 'Output detailed technical specifications for each module: responsibilities, interfaces, internal structure, algorithms, data structures, test strategies',
      agent: 'HEngineer',
      skill: 'functional-design',
      promptFile: 'prompts/moduleFunctionalDesign.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Module Functional Design阶段。为每个模块输出详细的技术规格：职责、接口、内部结构、算法/流程、数据结构、测试策略。`
      },
    },
  },
}
