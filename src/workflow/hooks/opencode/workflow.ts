import { PluginInput } from "@opencode-ai/plugin";
import { readFileSync } from "fs";
import { join } from "path";
import {
  getWorkflowState,
  setWorkflowHandover,
  setWorkflowCurrent,
  type Workflow,
} from "../../state.js";

const SKILLS_DIR = join(process.cwd(), "src", "skills");
const PROMPTS_DIR = join(process.cwd(), "src", "workflow", "prompts");

function loadPromptForStage(stage: keyof Workflow): string {
  const promptMap: Record<keyof Workflow, string> = {
    dataCollection: "dataCollection.md",
    IRAnalysis: "IRAnalysis.md",
    scenarioAnalysis: "scenarioAnalysis.md",
    useCaseAnalysis: "useCaseAnalysis.md",
    functionalRefinement: "functionalRefinement.md",
    requirementDecomposition: "requirementDecomposition.md",
    systemFunctionalDesign: "systemFunctionalDesign.md",
    moduleFunctionalDesign: "moduleFunctionalDesign.md",
  };

  const promptFile = promptMap[stage];
  if (!promptFile) return "";

  try {
    const promptPath = join(PROMPTS_DIR, promptFile);
    const promptContent = readFileSync(promptPath, "utf-8");
    if (!promptContent.trim()) return "";
    return promptContent;
  } catch (error) {
    return "";
  }
}

interface HandoverConfig {
  agent: string;
  getPrompt: (currentStep: string | null, nextStep: string) => string;
}

const HANDOVER_CONFIG: Record<keyof Workflow, HandoverConfig> = {
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

export async function createWorkflowHooks(ctx: PluginInput) {
  const prompt = async (sessionID: string, agent: string, content: string) => {
    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        agent: agent,
        noReply: false,
        parts: [{ type: "text", text: content }],
      },
      query: { directory: ctx.directory },
    });
  };

  return {
    event: async ({ event }) => {
      const props = event.properties as Record<string, unknown> | undefined;
      const sessionID = props?.sessionID as string | undefined;
      if (!sessionID) return;

      if (event.type === "session.idle") {
        const workflowState = getWorkflowState();

        if (workflowState.handoverTo !== null) {
          const handoverPhase = workflowState.handoverTo;
          const currentPhase = workflowState.currentStep;
          const config = HANDOVER_CONFIG[handoverPhase];

          if (config) {
            setWorkflowCurrent(handoverPhase);

            let handoverContent = config.getPrompt(currentPhase, handoverPhase);

            await prompt(sessionID, config.agent, handoverContent);
            setWorkflowHandover(null);
            setWorkflowCurrent(handoverPhase);
          }
        }
      }
    },
    "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
      const workflowState = getWorkflowState();
      const currentStep = workflowState.currentStep;

      if (currentStep) {
        const promptContent = loadPromptForStage(currentStep);
        if (promptContent) {
          output.system.push(promptContent);
        }
      }
    },
  };
}
