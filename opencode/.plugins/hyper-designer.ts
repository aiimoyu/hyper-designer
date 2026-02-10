import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk";
import type { AgentConfig as LocalAgentConfig } from "../../src/agents/types";
import { createBuiltinAgents } from "../../src/agents/utils";
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  Workflow,
} from "../../src/workflow/state";
import { createWorkflowHooks } from "../hooks/workflow";

const toOpencodeAgentConfig = (agent: LocalAgentConfig): OpencodeAgentConfig => {
  return {
    model: agent.model,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    variant: agent.variant,
    prompt: agent.prompt,
    tools: agent.tools,
    description: agent.description,
    mode: agent.mode,
    color: agent.color,
    permission: agent.permission,
  };
};

const toOpencodeAgents = (
  agents: Record<string, LocalAgentConfig>
): Record<string, OpencodeAgentConfig> => {
  return Object.fromEntries(
    Object.entries(agents).map(([key, agent]) => [key, toOpencodeAgentConfig(agent)])
  );
};

export const HyperDesignerPlugin: Plugin = async (ctx) => {
  const agents = await createBuiltinAgents();
  const mappedAgents = toOpencodeAgents(agents);
  const agentHandler = async (config: Record<string, unknown>) => {
    config.agent = {
      ...(config.agent ?? {}),
      ...mappedAgents,
    };
  }

  const hdWorkflowStateTool = {
    get_hd_workflow_state: tool({
      description: "Get the current workflow state of the Hyper Designer project",
      args: {},
      async execute() {
        const state = getWorkflowState();
        return JSON.stringify(state, null, 2);
      },
    }),
    set_hd_workflow_stage: tool({
      description: "Update the completion status of a specific workflow stage of the Hyper Designer project",
      args: {
        stage_name: tool.schema.enum([
          "dataCollection",
          "IRAnalysis",
          "scenarioAnalysis",
          "useCaseAnalysis",
          "functionalRefinement",
          "requirementDecomposition",
          "systemFunctionalDesign",
          "moduleFunctionalDesign",
        ]).describe("The name of the workflow stage to update"),
        is_completed: tool.schema.boolean().describe("Whether the stage is completed"),
      },
      async execute(params: { stage_name: string; is_completed: boolean }) {
        const state = setWorkflowStage(params.stage_name as keyof Workflow, params.is_completed);
        return JSON.stringify(state, null, 2);
      },
    }),
    set_hd_workflow_current: tool({
      description: "Set the current workflow step of the Hyper Designer project",
      args: {
        step_name: tool.schema.enum([
          "dataCollection",
          "IRAnalysis",
          "scenarioAnalysis",
          "useCaseAnalysis",
          "functionalRefinement",
          "requirementDecomposition",
          "systemFunctionalDesign",
          "moduleFunctionalDesign",
        ]).describe("The name of the workflow step to set as current"),
      },
      async execute(params: { step_name: string }) {
        const state = setWorkflowCurrent(params.step_name as keyof Workflow | null);
        return JSON.stringify(state, null, 2);
      },
    }),
    set_hd_workflow_handover: tool({
      description: "Set the handover workflow step of the Hyper Designer project",
      args: {
        step_name: tool.schema.enum([
          "dataCollection",
          "IRAnalysis",
          "scenarioAnalysis",
          "useCaseAnalysis",
          "functionalRefinement",
          "requirementDecomposition",
          "systemFunctionalDesign",
          "moduleFunctionalDesign",
        ]).describe("The name of the workflow step to set as handover"),
      },
      async execute(params: { step_name: string }) {
        const state = setWorkflowHandover(params.step_name as keyof Workflow | null);
        return JSON.stringify(state, null, 2);
      },
    }),
  }

  const workflowHooks = await createWorkflowHooks(ctx);

  return {
    config: agentHandler,
    tool: {
      ...hdWorkflowStateTool,
    },
    event: async (input) => {
      await workflowHooks.event(input);
    },
    "experimental.chat.system.transform": async (input: unknown, output: { system: string[] }) => {
      await workflowHooks["experimental.chat.system.transform"](input, output);
    },
  };
};
