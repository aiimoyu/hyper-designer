import type { WorkflowDefinition } from '../../core/types'
import { irAnalysisCollectorHook, scenarioAnalysisCollectorHook, systemDesignCollectorHook, summarizeHook } from './stage-hooks'

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
      qualityGate: [
        '请审查 IRAnalysis 阶段交付物。',
        '重点检查：需求背景是否完整、5W2H 是否覆盖、关键约束是否明确、术语是否一致。',
        '优先检查文件：IR信息.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema，若未通过请给出阻塞问题列表。',
      ].join('\n'),
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
      qualityGate: [
        '请审查 scenarioAnalysis 阶段交付物。',
        '重点检查：参与者识别、主/备流程、异常分支、边界条件、与 IR 约束一致性。',
        '优先检查文件：功能场景.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
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
      qualityGate: [
        '请审查 useCaseAnalysis 阶段交付物。',
        '重点检查：用例粒度、前置条件、后置条件、输入输出、验收标准可验证性。',
        '优先检查文件：用例.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
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
      qualityGate: [
        '请审查 functionalRefinement 阶段交付物。',
        '重点检查：功能清单完整性、MoSCoW 优先级合理性、FMEA 风险项与缓解措施可执行性。',
        '优先检查文件：功能细化.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
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
      qualityGate: [
        '请审查 requirementDecomposition 阶段交付物。',
        '重点检查：SR/AR 拆分边界、模块映射一致性、接口职责清晰性、可追溯性。',
        '优先检查文件：需求分解.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
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
      qualityGate: [
        '请审查 systemFunctionalDesign 阶段交付物。',
        '重点检查：架构分层、技术栈选择依据、数据模型一致性、接口协议完整性、非功能性约束。',
        '优先检查文件：系统功能设计.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
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
      qualityGate: [
        '请审查 moduleFunctionalDesign 阶段交付物。',
        '重点检查：模块职责边界、接口定义、关键流程/算法说明、数据结构设计、测试策略可执行性。',
        '优先检查文件：模块功能设计.md（如不存在请在 issues 说明）。',
        '输出必须符合 JSON Schema。',
      ].join('\n'),
      afterStage: [summarizeHook],
      getHandoverPrompt: (current) => {
        const prefix = current ? `从${current}阶段移交` : ''
        return `${prefix}进入Module Functional Design阶段。请根据单阶段处理流程 (8-Step Pipeline)，采集必要资料，为每个模块输出详细的技术规格。下面请开始你的工作。`
      },
    },
  },
}
