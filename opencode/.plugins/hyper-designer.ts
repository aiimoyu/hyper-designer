import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import {
  type AgentConfig as LocalAgentConfig,
  type ToolContext,
  bootstrapPluginRegistries,
  convertWorkflowToolsToOpenCode,
  createAgentTransformer,
  createDocumentReviewTools,
  createHyperAgent,
  createTransformHooks,
  createUsingHyperDesignerTransformer,
  createWorkflowHooks,
  initLogger,
  sdk,
  workflowService,
} from '../../src/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HD_PACKAGE_ROOT = resolve(__dirname, '../..')

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

  sdk.agent.plugins.clear()
  sdk.workflow.plugins.clear()
  sdk.tool.plugins.clear()
  const pluginDirectories = [
    `${ctx.directory}/plugins`,
  ]
  if (process.env.HD_PLUGINS_DIR) {
    pluginDirectories.push(...process.env.HD_PLUGINS_DIR.split(':').filter(Boolean))
  }
  await bootstrapPluginRegistries({
    pluginDirectories,
    rootDirectory: HD_PACKAGE_ROOT,
  })

  const agents = await sdk.agent.createAll()
  const mappedBuiltinAgents = Object.fromEntries(
    Object.entries(toOpencodeAgents(agents)).map(([name, config]) => [
      name,
      {
        ...config,
        hidden: true,
      },
    ]),
  ) as Record<string, OpencodeAgentConfig & { hidden?: boolean }>

  const mappedAgents: Record<string, OpencodeAgentConfig & { hidden?: boolean }> = {
    ...mappedBuiltinAgents,
    Hyper: toOpencodeAgentConfig(createHyperAgent()),
  }
  const agentHandler = async (config: Record<string, unknown>) => {
    config.agent = {
      ...(config.agent ?? {}),
      ...mappedAgents,
    }
  }


  const workflowHooks = await createWorkflowHooks(ctx)
  const transformHooks = await createTransformHooks(ctx)
  const documentReviewTools = createDocumentReviewTools()

  const hdTools = {
    // XXX 暂时解决GLM模型推理问题
    hd_workflow_state: tool({
      description: "Get the current workflow state of the Hyper Designer project. Returns uninitialized status if no workflow has been selected. Call this tool with parameter: {\"_\": \"\"}",
      args: {
        _: tool.schema.string().optional().describe("Optional placeholder parameter - pass empty string or omit"),
      },
      async execute(_params: { _?: string }, _context) {
        const result = workflowService.hdGetWorkflowState()
        return JSON.stringify(result, null, 2)
      },
    }),
    // XXX 暂时解决GLM模型推理问题
    hd_workflow_list: tool({
      description: "List all available workflows that can be selected for the Hyper Designer project. Use this to see what workflows are available before calling hd_workflow_select. Call this tool with parameter: {\"_\": \"\"}",
      args: { _: tool.schema.string().optional().describe("Optional placeholder parameter - pass empty string or omit") },
      async execute(_params: { _?: string }, _context) {
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

        const stages = params.stages ?? detail.stages.map(stage => ({ key: stage.key, selected: true }))
        const result = workflowService.selectWorkflow({ typeId: params.type_id, stages })
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_handover: tool({
      description: `Set the handover workflow stage of the Hyper Designer project.
- If stage_name is omitted: automatically selects the next stage (first stage if current is null, next stage otherwise)
- IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.`,
      args: {
        stage_name: tool.schema.string().optional().describe("The name of the workflow stage to set as handover. If omitted, automatically selects the next stage."),
      },
      async execute(params: { stage_name?: string }) {
        const result = await workflowService.hdScheduleHandover(params.stage_name)
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_record_milestone: tool({
      description: "Record or overwrite a milestone for the current workflow stage. For gate milestones, detail may include score/comment and isCompleted should reflect pass/fail.",
      args: {
        milestone: tool.schema.object({
          type: tool.schema.string().describe("The milestone type/key to record"),
          isCompleted: tool.schema.boolean().describe("Whether this milestone item is completed"),
          detail: tool.schema.object({}).describe("Milestone detail payload, e.g. gate: { score, comment }"),
        }).describe("The milestone to record"),
      },
      async execute(params: { milestone: { type: string; isCompleted: boolean; detail: unknown } }) {
        const { milestone } = params;
        const stage = workflowService.getCurrentStage();
        if (!stage) {
          return JSON.stringify({
            success: false,
            error: "No current stage. Cannot record milestone.",
          }, null, 2);
        }
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
    // XXX 暂时解决GLM模型推理问题
    hd_force_next_step: tool({
      description: "Force advance to the next step in the workflow, bypassing gate checks. Use this when gate approval cannot be achieved after multiple attempts. Call this tool with parameter: {\"_\": \"\"}",
      args: { _: tool.schema.string().optional().describe("无实际意义的占位参数，调用时传入随机字符串") },
      async execute(_: { _: string }) {
        const result = workflowService.hdForceNextStep();
        return JSON.stringify(result, null, 2);
      },
    }),
  }

  // ── 收集工作流工具 ─────────────────────────────────────────────────────────
  // 从所有已注册工作流中收集工具定义，转换为 OpenCode 工具格式
  const workflowTools = (() => {
    const allWorkflowTools = workflowService.listAllTools()
    if (allWorkflowTools.length === 0) {
      return {}
    }

    // 创建 ToolContext 工厂（每次工具执行时获取最新上下文）
    const getContext = (): ToolContext => ({
      workflowId: workflowService.getDefinition()?.id ?? '',
      currentStage: workflowService.getCurrentStage(),
      state: workflowService.getState() as unknown as Record<string, unknown> | null,
    })

    return convertWorkflowToolsToOpenCode(allWorkflowTools, getContext)
  })()
  // ── 工作流工具收集完成 ─────────────────────────────────────────────────────

  const pluginTools = await sdk.tool.plugins.getAll()

  return {
    config: agentHandler,
    tool: {
      ...hdTools,
      ...documentReviewTools,
      ...workflowTools,
      ...pluginTools,
    },
    event: async (input) => {
      await workflowHooks.event(input)
    },
    "chat.message": async (input, output) => {
      const agentTransformer = createAgentTransformer(ctx)
      const usingHyperDesignerTransformer = createUsingHyperDesignerTransformer(ctx)
      await agentTransformer(input, output)
      await usingHyperDesignerTransformer(input, output)
    },
    "experimental.chat.system.transform": async (input: unknown, output: { system: string[] }) => {
      await transformHooks['experimental.chat.system.transform'](input, output)
    },
  }
}
