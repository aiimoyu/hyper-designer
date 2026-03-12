import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk"
import type { AgentConfig as LocalAgentConfig } from "../../src/agents/types"
import { createBuiltinAgents } from "../../src/agents/utils"
import { workflowService } from "../../src/workflows/core/service"
import { createWorkflowHooks } from "../../src/workflows/integrations/opencode"
import { createDocumentReviewTools } from "../../src/tools/integrations/opencode"
import { initLogger } from "../../src/utils/logger"

const toOpencodeAgentConfig = (agent: LocalAgentConfig): OpencodeAgentConfig => {
  const result: OpencodeAgentConfig = {
    ...(agent.model !== undefined ? { model: agent.model } : {}),
    ...(agent.temperature !== undefined ? { temperature: agent.temperature } : {}),
    ...(agent.maxTokens !== undefined ? { maxTokens: agent.maxTokens } : {}),
    ...(agent.variant !== undefined ? { variant: agent.variant } : {}),
    ...(agent.prompt !== undefined ? { prompt: agent.prompt } : {}),
    ...(agent.description !== undefined ? { description: agent.description } : {}),
    ...(agent.mode !== undefined ? { mode: agent.mode } : {}),
    ...(agent.color !== undefined ? { color: agent.color } : {}),
    ...(agent.permission !== undefined ? { permission: agent.permission } : {}),
  }
  // 将权限转换为工具配置：Permission是deny就是false、其他就是true，默认false
  if (agent.permission !== undefined) {
    const tools: Record<string, boolean> = {}
    for (const [tool, perm] of Object.entries(agent.permission)) {
      tools[tool] = perm === "deny" ? false : true
    }
    result.tools = tools
  }
  return result
}

const toOpencodeAgents = (
  agents: Record<string, LocalAgentConfig>,
): Record<string, OpencodeAgentConfig> => {
  return Object.fromEntries(
    Object.entries(agents).map(([key, agent]) => [key, toOpencodeAgentConfig(agent)]),
  )
}

export const HyperDesignerPlugin: Plugin = async (ctx) => {
  // Initialize logger - respects HYPER_DESIGNER_LOG_PERSIST env var
  initLogger()

  const agents = await createBuiltinAgents()
  const mappedAgents = toOpencodeAgents(agents)
  const agentHandler = async (config: Record<string, unknown>) => {
    config.agent = {
      ...(config.agent ?? {}),
      ...mappedAgents,
    }
  }


  const workflowHooks = await createWorkflowHooks(ctx)
  const documentReviewTools = createDocumentReviewTools()

  const hdTools = {
    hd_workflow_state: tool({
      description: "Get the current workflow state of the Hyper Designer project. Returns uninitialized status if no workflow has been selected.",
      args: {},
      async execute() {
        const result = workflowService.hdGetWorkflowState()
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_workflow_list: tool({
      description: "List all available workflows that can be selected for the Hyper Designer project. Use this to see what workflows are available before calling hd_workflow_select.",
      args: {},
      async execute() {
        const workflows = workflowService.listWorkflows()
        return JSON.stringify({ workflows }, null, 2)
      },
    }),
    hd_workflow_detail: tool({
      description: "Get detailed information about a specific workflow, including its stages, their descriptions, and which stages are required. Use this to understand a workflow before selecting it.",
      args: {
        type_id: tool.schema.string().describe("The ID of the workflow to get details for (e.g., 'classic')"),
      },
      async execute(params: { type_id: string }) {
        const detail = workflowService.getWorkflowDetail(params.type_id)
        if (!detail) {
          return JSON.stringify({ error: `Workflow '${params.type_id}' not found`, availableWorkflows: workflowService.listWorkflows().map(w => w.id) }, null, 2)
        }
        return JSON.stringify(detail, null, 2)
      },
    }),
    hd_workflow_select: tool({
      description: "Select and initialize a workflow for the Hyper Designer project. This MUST be called before any workflow operations (hd_handover, etc.). The stages parameter allows selecting which stages to include - use [{ key, selected }] format. Required stages cannot be deselected.",
      args: {
        type_id: tool.schema.string().describe("The ID of the workflow to select (e.g., 'classic')"),
        stages: tool.schema.array(tool.schema.object({ key: tool.schema.string(), selected: tool.schema.boolean() })).optional().describe("Stage selection array. If omitted, all stages are selected. Example: [{ key: 'IRAnalysis', selected: true }, { key: 'moduleFunctionalDesign', selected: false }]"),
      },
      async execute(params: { type_id: string; stages?: Array<{ key: string; selected: boolean }> }) {
        // If stages not provided, select all stages
        const detail = workflowService.getWorkflowDetail(params.type_id)
        if (!detail) {
          return JSON.stringify({ success: false, error: `Workflow '${params.type_id}' not found` }, null, 2)
        }
        
        const stages = params.stages ?? detail.stageOrder.map(key => ({ key, selected: true }))
        const result = workflowService.selectWorkflow({ typeId: params.type_id, stages })
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_handover: tool({
      description: "Set the handover workflow step of the Hyper Designer project. IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.",
      args: {
        step_name: tool.schema.string().describe("The name of the workflow step to set as handover"),
      },
      async execute(params: { step_name: string }) {
        const result = workflowService.hdScheduleHandover(params.step_name)
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_record_milestone: tool({
      description: "Record or overwrite a milestone for a workflow stage. For gate milestones, detail may include score/comment and isCompleted should reflect pass/fail.",
      args: {
        stage: tool.schema.string().describe("The stage key to record the milestone for (e.g., 'IRAnalysis')"),
        milestone: tool.schema.object({
          type: tool.schema.string().describe("The milestone type/key to record"),
          isCompleted: tool.schema.boolean().describe("Whether this milestone item is completed"),
          detail: tool.schema.object({}).describe("Milestone detail payload, e.g. gate: { score, comment }"),
        }).describe("The milestone to record"),
      },
      async execute(params: { stage: string; milestone: { type: string; isCompleted: boolean; detail: unknown } }) {
        const { stage, milestone } = params;
        const timestamp = new Date().toISOString();
        workflowService.setStageMilestone({
          stage,
          milestone,
        })
        
        return JSON.stringify({
          success: true,
          stage,
          milestone: {
            type: milestone.type,
            timestamp,
            isCompleted: milestone.isCompleted,
            detail: milestone.detail,
          },
        }, null, 2);
      },
    }),
    hd_force_next_step: tool({
      description: "Force advance to the next step in the workflow, bypassing gate checks. Use this when gate approval cannot be achieved after multiple attempts.",
      args: {},
      async execute() {
        const result = workflowService.hdForceNextStep();
        return JSON.stringify(result, null, 2);
      },
    }),
  }

  return {
    config: agentHandler,
    tool: {
      ...hdTools,
      ...documentReviewTools,
    },
    event: async (input) => {
      await workflowHooks.event(input)
    },
    "experimental.chat.system.transform": async (input: unknown, output: { system: string[] }) => {
      await workflowHooks["experimental.chat.system.transform"](input, output)
    },
  }
}
