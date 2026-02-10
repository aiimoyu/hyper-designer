import type { Workflow } from "./state"

interface HandoverConfig {
  agent: string;
  getPrompt: (currentStep: string | null, nextStep: string) => string;
}

export const HANDOVER_CONFIG: Record<keyof Workflow, HandoverConfig> = {
  dataCollection: {
    agent: "HCollector",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请收集系统设计所需的参考资料，包括代码库分析、领域资料、场景库、FMEA库等。完成后交还控制权。`;
    },
  },
  IRAnalysis: {
    agent: "HArchitect",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请基于已收集的资料，进行初始需求分析，输出需求信息文档。`;
    },
  },
  scenarioAnalysis: {
    agent: "HArchitect",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请分析系统的各种使用场景，识别主要参与者和业务流程。`;
    },
  },
  useCaseAnalysis: {
    agent: "HArchitect",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请将场景细化为详细的用例规格，明确输入输出和验收标准。`;
    },
  },
  functionalRefinement: {
    agent: "HArchitect",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请整理完整功能列表，进行优先级排序和FMEA分析。`;
    },
  },
  requirementDecomposition: {
    agent: "HEngineer",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请将功能列表映射并分解为模块级需求、子系统和接口定义。`;
    },
  },
  systemFunctionalDesign: {
    agent: "HEngineer",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。请基于需求分解结果，设计系统架构、选择技术栈、定义数据模型与交互协议。`;
    },
  },
  moduleFunctionalDesign: {
    agent: "HEngineer",
    getPrompt: (current, next) => {
      const prefix = current ? `步骤${current}结束，` : "";
      return `${prefix}进入${next}阶段。为每个模块输出详细的技术规格：职责、接口、内部结构、算法/流程、数据结构、测试策略。`;
    },
  },
};