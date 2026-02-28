import type { WorkflowDefinition } from '../../core/types'

/**
 * Open Source Requirements Engineering Workflow
 *
 * An 8-stage workflow for comprehensive requirements engineering and system design
 * specifically tailored for open source projects. Based on the classic workflow
 * but adapted for open source development practices.
 */
export const openSourceWorkflow: WorkflowDefinition = {
  id: 'open-source',
  name: 'Open Source Requirements Engineering',
  description: '8-stage workflow for open source projects: data collection → IR analysis → scenario analysis → use case analysis → functional refinement → requirement decomposition → system functional design → module functional design',

  promptFile: 'prompts/workflow.md',

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
      description: 'Collect reference materials, code analysis, domain knowledge, and scenario libraries for open source context',
      agent: 'HCollector',
      promptFile: 'prompts/dataCollection.md',
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Initial Requirement Analysis阶段。请基于已收集的资料，进行初始需求分析，输出需求信息文档。`
      },
    },

    IRAnalysis: {
      name: 'Initial Requirement Analysis',
      description: 'Conduct initial requirement analysis using 5W2H framework and Socratic questioning for open source context',
      agent: 'HArchitect',
      promptFile: 'prompts/IRAnalysis.md',
      qualityGate: [
        '请审查 IRAnalysis 阶段交付物（开源场景）。',
        '重点检查：需求背景、开源约束（社区/许可证/兼容性）、5W2H 覆盖、术语一致性。',
        '优先检查文件：IR信息.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Scenario Analysis阶段。请分析系统的各种使用场景，识别主要参与者和业务流程。`
      },
    },

    scenarioAnalysis: {
      name: 'Scenario Analysis',
      description: 'Analyze system usage scenarios, identify actors and business processes for open source contributors',
      agent: 'HArchitect',
      promptFile: 'prompts/scenarioAnalysis.md',
      qualityGate: [
        '请审查 scenarioAnalysis 阶段交付物（开源场景）。',
        '重点检查：用户/维护者/贡献者场景覆盖、异常流程、边界条件、与 IR 一致性。',
        '优先检查文件：功能场景.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Use Case Analysis阶段。请将场景细化为详细的用例规格，明确输入输出和验收标准。`
      },
    },

    useCaseAnalysis: {
      name: 'Use Case Analysis',
      description: 'Refine scenarios into detailed use case specifications with inputs, outputs, and acceptance criteria',
      agent: 'HArchitect',
      promptFile: 'prompts/useCaseAnalysis.md',
      qualityGate: [
        '请审查 useCaseAnalysis 阶段交付物。',
        '重点检查：用例可执行性、前后置条件、输入输出、验收标准是否可验证。',
        '优先检查文件：用例.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Functional Refinement阶段。请整理完整功能列表，进行优先级排序和FMEA分析。`
      },
    },

    functionalRefinement: {
      name: 'Functional Refinement',
      description: 'Extract complete functional list, prioritize using MoSCoW method, and perform FMEA analysis',
      agent: 'HArchitect',
      promptFile: 'prompts/functionalRefinement.md',
      qualityGate: [
        '请审查 functionalRefinement 阶段交付物。',
        '重点检查：功能清单完整性、优先级合理性、风险分析与缓解措施可执行性。',
        '优先检查文件：功能细化.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Requirement Decomposition阶段。请将功能列表映射并分解为模块级需求、子系统和接口定义。`
      },
    },

    requirementDecomposition: {
      name: 'Requirement Decomposition',
      description: 'Map and decompose functional list into module-level requirements, subsystems, and interface definitions',
      agent: 'HEngineer',
      promptFile: 'prompts/requirementDecomposition.md',
      qualityGate: [
        '请审查 requirementDecomposition 阶段交付物。',
        '重点检查：模块划分、SR/AR 对齐、接口定义清晰度、追踪链完整性。',
        '优先检查文件：需求分解.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入System Functional Design阶段。请基于需求分解结果，设计系统架构、选择技术栈、定义数据模型与交互协议。`
      },
    },

    systemFunctionalDesign: {
      name: 'System Functional Design',
      description: 'Design system architecture, select technology stack, define data models and interaction protocols',
      agent: 'HEngineer',
      promptFile: 'prompts/systemFunctionalDesign.md',
      qualityGate: [
        '请审查 systemFunctionalDesign 阶段交付物。',
        '重点检查：架构合理性、技术栈依据、数据模型一致性、接口协议完整性。',
        '优先检查文件：系统功能设计.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}进入Module Functional Design阶段。为每个模块输出详细的技术规格：职责、接口、内部结构、算法/流程、数据结构、测试策略。`
      },
    },

    moduleFunctionalDesign: {
      name: 'Module Functional Design',
      description: 'Output detailed technical specifications for each module: responsibilities, interfaces, internal structure, algorithms, data structures, test strategies',
      agent: 'HEngineer',
      promptFile: 'prompts/moduleFunctionalDesign.md',
      qualityGate: [
        '请审查 moduleFunctionalDesign 阶段交付物。',
        '重点检查：模块职责边界、接口定义、核心算法流程、测试策略可执行性。',
        '优先检查文件：模块功能设计.md。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      getHandoverPrompt: (current) => {
        const prefix = current ? `步骤${current}结束，` : ''
        return `${prefix}工作流程已完成。请总结整个设计过程的成果，并确认所有阶段的工作已完成。`
      },
    },
  },
}
