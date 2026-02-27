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
          instruction: "You have successfully scheduled the handover. NOW STOP ALL WORK and return to the user immediately. Do NOT continue with any tasks, do NOT call any other tools. The system will automatically process the handover when this session enters idle state.",
          state,
        }, null, 2);
      },
    }),
    hd_submit: tool({
      description: "Submit current stage work for HCritic quality review. Call this when you have completed the stage document and are ready for review. Returns PASS (proceed to user confirmation) or FAIL (fix issues and resubmit).",
      args: {},
      async execute(_args: Record<string, never>, context) {
        // 1. Get current stage
        const state = getWorkflowState()
        if (!state?.currentStep) {
          return JSON.stringify({ status: "ERROR", message: "No active workflow stage. Set a current stage before submitting for review." })
        }

        try {
          // 2. Call HCritic via session.prompt (Task 0: REENTRANCE_OK)
          const reviewPrompt = `Review the ${state.currentStep} stage output. Evaluate completeness, consistency, and quality. If the stage passes review, include the word "PASS" in your response. If it fails, include "FAIL" and describe the issues.`
          const response = await ctx.client.session.prompt({
            path: { id: context.sessionID },
            body: {
              agent: "HCritic",
              noReply: false,
              parts: [{ type: "text", text: reviewPrompt }],
            },
            query: { directory: ctx.directory },
          })

          // 3. Parse HCritic response - filter for text parts
          const parts = response.data?.parts ?? []
          const textParts = parts.filter((p): p is typeof p & { type: "text"; text: string } => p.type === "text")
          const reviewText = textParts.map(p => p.text).join("\n")

          // 4. Determine verdict - search for pass/fail keywords
          const isPass = reviewText.includes("通过") || reviewText.includes("PASS") || reviewText.toLowerCase().includes("approved")

          // 5. Return structured result
          if (isPass) {
            setWorkflowStage(state.currentStep, true)
            return JSON.stringify({
              status: "PASS",
              message: reviewText,
              instruction: "Call ask_user to present the reviewed deliverable and get user confirmation. After user confirms, call set_hd_workflow_handover.",
            })
          } else {
            return JSON.stringify({
              status: "FAIL",
              message: reviewText,
              instruction: "Fix the issues identified in the review message and call hd_submit again to resubmit.",
            })
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error)
          return JSON.stringify({
            status: "ERROR",
            message: `HCritic review failed: ${errMsg}`,
          })
        }
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
