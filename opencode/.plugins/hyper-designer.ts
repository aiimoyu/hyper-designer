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
} from "../../src/workflows";
import { createWorkflowHooks } from "../../src/workflows/hooks/opencode";
import { loadHDConfig } from "../../src/config/loader";
import { getWorkflowDefinition } from "../../src/workflows";

const toOpencodeAgentConfig = (agent: LocalAgentConfig): OpencodeAgentConfig => {
  return {
    ...(agent.model !== undefined ? { model: agent.model } : {}),
    ...(agent.temperature !== undefined ? { temperature: agent.temperature } : {}),
    ...(agent.maxTokens !== undefined ? { maxTokens: agent.maxTokens } : {}),
    ...(agent.variant !== undefined ? { variant: agent.variant } : {}),
    ...(agent.prompt !== undefined ? { prompt: agent.prompt } : {}),
    ...(agent.tools !== undefined ? { tools: agent.tools } : {}),
    ...(agent.description !== undefined ? { description: agent.description } : {}),
    ...(agent.mode !== undefined ? { mode: agent.mode } : {}),
    ...(agent.color !== undefined ? { color: agent.color } : {}),
    ...(agent.permission !== undefined ? { permission: agent.permission } : {}),
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
  const agents = await createBuiltinAgents("opencode");
  const mappedAgents = toOpencodeAgents(agents);
  const agentHandler = async (config: Record<string, unknown>) => {
    config.agent = {
      ...(config.agent ?? {}),
      ...mappedAgents,
    };
  }

  const hdConfig = loadHDConfig();
  const workflow = getWorkflowDefinition(hdConfig.workflow || "classic");
  if (!workflow) {
    throw new Error("Workflow definition not found");
  }

  const hdWorkflowStateTool = {
    get_hd_workflow_state: tool({
      description: "Get the current workflow state of the Hyper Designer project. Returns null if workflow has not been initialized.",
      args: {},
      async execute() {
        const state = getWorkflowState();
        if (state === null) {
          return JSON.stringify({ initialized: false, message: "Workflow not initialized. Use set_hd_workflow_current or set_hd_workflow_handover to start." }, null, 2);
        }
        return JSON.stringify({ initialized: true, ...state }, null, 2);
      },
    }),
    set_hd_workflow_stage: tool({
      description: "Update the completion status of a specific workflow stage of the Hyper Designer project",
      args: {
        stage_name: tool.schema.enum(workflow.stageOrder).describe("The name of the workflow stage to update"),
        is_completed: tool.schema.boolean().describe("Whether the stage is completed"),
      },
      async execute(params: { stage_name: string; is_completed: boolean }) {
        const state = setWorkflowStage(params.stage_name, params.is_completed);
        return JSON.stringify(state, null, 2);
      },
    }),
    set_hd_workflow_current: tool({
      description: "Set the current workflow step of the Hyper Designer project",
      args: {
        step_name: tool.schema.enum(workflow.stageOrder).describe("The name of the workflow step to set as current"),
      },
      async execute(params: { step_name: string }) {
        const state = setWorkflowCurrent(params.step_name);
        return JSON.stringify(state, null, 2);
      },
    }),
    set_hd_workflow_handover: tool({
      description: "Set the handover workflow step of the Hyper Designer project. IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.",
      args: {
        step_name: tool.schema.enum(workflow.stageOrder).describe("The name of the workflow step to set as handover"),
      },
      async execute(params: { step_name: string }) {
        const state = setWorkflowHandover(params.step_name, workflow);
        return JSON.stringify({
          success: true,
          handover_to: params.step_name,
          message: "Handover scheduled. STOP now - do not continue working. The system will process the handover automatically when this session ends.",
          state,
        }, null, 2);
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
