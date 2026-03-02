import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk"
import type { AgentConfig as LocalAgentConfig } from "../../src/agents/types"
import { createBuiltinAgents } from "../../src/agents/utils"
import { workflowService } from "../../src/workflows/core/service"
import { createWorkflowHooks } from "../../src/workflows/integrations/opencode"

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
  }
}

const toOpencodeAgents = (
  agents: Record<string, LocalAgentConfig>,
): Record<string, OpencodeAgentConfig> => {
  return Object.fromEntries(
    Object.entries(agents).map(([key, agent]) => [key, toOpencodeAgentConfig(agent)]),
  )
}

export const HyperDesignerPlugin: Plugin = async (ctx) => {
  const agents = await createBuiltinAgents("opencode")
  const mappedAgents = toOpencodeAgents(agents)
  const agentHandler = async (config: Record<string, unknown>) => {
    config.agent = {
      ...(config.agent ?? {}),
      ...mappedAgents,
    }
  }


  const workflowHooks = await createWorkflowHooks(ctx)

  const hdTools = {
    hd_workflow_state: tool({
      description: "Get the current workflow state of the Hyper Designer project. Returns null if workflow has not been initialized.",
      args: {},
      async execute() {
        const result = workflowService.hdGetWorkflowState()
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_handover: tool({
      description: "Set the handover workflow step of the Hyper Designer project. IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.",
      args: {
        step_name: tool.schema.enum(workflowService.getDefinition().stageOrder).describe("The name of the workflow step to set as handover"),
      },
      async execute(params: { step_name: string }) {
        const result = workflowService.hdScheduleHandover(params.step_name)
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_submit_evaluation: tool({
      description: "[HCritic only] Submit quality evaluation for the current workflow stage. Only HCritic has permission to call this tool. Stores score and comment in the workflow state.",
      args: {
        score: tool.schema.number().describe("Quality gate score from 0 to 100"),
        comment: tool.schema.string().optional().describe("Review summary or comment"),
      },
      async execute(params: { score: number; comment?: string }) {
        const state = workflowService.setGateResult({ score: params.score, comment: params.comment ?? null })
        return JSON.stringify({ success: true, score: params.score, comment: params.comment ?? null, state }, null, 2)
      },
    }),
  }

  return {
    config: agentHandler,
    tool: {
      ...hdTools,
    },
    event: async (input) => {
      await workflowHooks.event(input)
    },
    "experimental.chat.system.transform": async (input: unknown, output: { system: string[] }) => {
      await workflowHooks["experimental.chat.system.transform"](input, output)
    },
  }
}
