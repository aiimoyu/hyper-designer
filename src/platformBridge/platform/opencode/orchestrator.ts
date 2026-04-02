import { tool } from '@opencode-ai/plugin'
import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { AgentConfig as OpencodeAgentConfig } from '@opencode-ai/sdk'

import type { AgentConfig as LocalAgentConfig } from '../../../agents/types'
import {
  createAgentTransformer,
  createUsingHyperDesignerTransformer,
  createNoWorkflowPromptTransformer,
  createSystemTransformer as createCoreSystemTransformer,
  hasUsingHyperDesignerTag,
} from '../../../transform'
import { HyperDesignerLogger } from '../../../utils/logger'
import { workflowService } from '../../../workflows/service'
import type { ToolContext, ToolDefinition, ToolParamSchema, ToolParamsSchema } from '../../../tools/types'
import type { PlatformCapabilities } from '../../capabilities/types'
import type {
  AgentMappingInput,
  BuildWorkflowToolsInput,
  CreateOpenCodeOrchestratorInput,
  PlatformOrchestrator,
  ToolContextFactory,
  WorkflowServiceLike,
} from '../../orchestration/types'

const MODULE_NAME = 'Integrations:WorkflowTools'
const OPENCODE_TOOL_MAPPING = {
  HD_TOOL_ASK_USER: 'question',
  HD_TOOL_DELEGATE: 'task',
} as const

type EventHook = NonNullable<Hooks['event']>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenCodeArg = any
interface EventInput {
  event: {
    type: string
    properties?: Record<string, unknown>
  }
}

function convertParamsToOpenCodeArgs(
  params: ToolParamsSchema,
): Record<string, OpenCodeArg> {
  const args: Record<string, OpenCodeArg> = {}

  for (const [name, schema] of Object.entries(params)) {
    let arg: OpenCodeArg

    switch (schema.type) {
      case 'string':
        arg = tool.schema.string()
        break
      case 'number':
        arg = tool.schema.number()
        break
      case 'boolean':
        arg = tool.schema.boolean()
        break
      case 'array':
        if (schema.items) {
          const itemArg = convertSingleSchemaToOpenCodeArg(schema.items)
          arg = tool.schema.array(itemArg)
        } else {
          arg = tool.schema.array(tool.schema.string())
        }
        break
      case 'object':
        if (schema.properties) {
          const nestedArgs = convertParamsToOpenCodeArgs(schema.properties)
          arg = tool.schema.object(nestedArgs)
        } else {
          arg = tool.schema.object({})
        }
        break
      default:
        arg = tool.schema.string()
    }

    if (schema.description) {
      arg = (arg as { describe: (text: string) => OpenCodeArg }).describe(schema.description)
    }

    if (schema.optional) {
      arg = (arg as { optional: () => OpenCodeArg }).optional()
    }

    if (schema.enum) {
      const enumDesc = `可选值: ${schema.enum.join(', ')}`
      arg = (arg as { describe: (text: string) => OpenCodeArg }).describe(
        schema.description ? `${schema.description}。${enumDesc}` : enumDesc,
      )
    }

    args[name] = arg
  }

  return args
}

function convertSingleSchemaToOpenCodeArg(schema: ToolParamSchema): OpenCodeArg {
  let arg: OpenCodeArg

  switch (schema.type) {
    case 'string':
      arg = tool.schema.string()
      break
    case 'number':
      arg = tool.schema.number()
      break
    case 'boolean':
      arg = tool.schema.boolean()
      break
    case 'array':
      if (schema.items) {
        const itemArg = convertSingleSchemaToOpenCodeArg(schema.items)
        arg = tool.schema.array(itemArg)
      } else {
        arg = tool.schema.array(tool.schema.string())
      }
      break
    case 'object':
      if (schema.properties) {
        const nestedArgs = convertParamsToOpenCodeArgs(schema.properties)
        arg = tool.schema.object(nestedArgs)
      } else {
        arg = tool.schema.object({})
      }
      break
    default:
      arg = tool.schema.string()
  }

  if (schema.description) {
    arg = (arg as { describe: (text: string) => OpenCodeArg }).describe(schema.description)
  }

  if (schema.optional) {
    arg = (arg as { optional: () => OpenCodeArg }).optional()
  }

  return arg
}

export function convertWorkflowToolsToOpenCode(
  tools: ToolDefinition[],
  getContext: () => ToolContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}

  for (const t of tools) {
    const args = convertParamsToOpenCodeArgs(t.params)

    result[t.name] = tool({
      description: t.description,
      args,
      async execute(params: Record<string, unknown>) {
        HyperDesignerLogger.debug(MODULE_NAME, `执行工作流工具: ${t.name}`, {
          toolName: t.name,
          params,
        })
        const ctx = getContext()
        return t.execute(params, ctx)
      },
    })

    HyperDesignerLogger.debug(MODULE_NAME, `转换工作流工具: ${t.name}`, {
      toolName: t.name,
      scope: t.scope ?? 'global',
      stages: t.stages,
    })
  }

  HyperDesignerLogger.info(MODULE_NAME, `转换完成: ${tools.length} 个工作流工具`, {
    toolNames: tools.map(t => t.name),
  })

  return result
}

export function createSystemTransformer() {
  return createCoreSystemTransformer({
    getWorkflow: () => workflowService.getDefinition(),
    getState: () => workflowService.getState(),
    toolMapping: OPENCODE_TOOL_MAPPING,
    shouldTransform: hasUsingHyperDesignerTag,
  })
}

export async function createTransformHooks(_ctx: PluginInput) {
  return {
    'experimental.chat.system.transform': createSystemTransformer(),
  }
}

export function createEventHandler(
  workflowServiceLike: WorkflowServiceLike,
  capabilities: PlatformCapabilities,
): EventHook {
  return (async ({ event }: EventInput) => {
    const props = event.properties as Record<string, unknown> | undefined
    const sessionID = props?.sessionID as string | undefined

    if (!sessionID) {
      return
    }

    if (event.type !== 'session.idle') {
      return
    }

    const workflowState = workflowServiceLike.getState()
    const workflow = workflowServiceLike.getDefinition()

    // 检查是否需要结束工作流（ended=true 触发 session abort）
    if (workflowState?.current?.handoverTo === 'WORKFLOW_END') {
      HyperDesignerLogger.info('OpenCode', '工作流已结束，执行 session abort')
      const adapter = capabilities.toAdapter()
      try {
        await adapter.cancelSession({ sessionId: sessionID })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        HyperDesignerLogger.error('OpenCode', 'session abort 失败', err, {
          sessionID,
          action: 'cancelSession',
        })
      }
      return
    }

    if (!(workflowState && workflowState.current?.handoverTo && workflowState.current !== null && !workflowServiceLike.isHandoverInProgress() && workflow)) {
      return
    }

    const handoverPhase = workflowState.current.handoverTo
    const currentPhase = workflowState.current.name

    const nextAgent = workflowServiceLike.getHandoverAgent(handoverPhase)
    if (!nextAgent) {
      HyperDesignerLogger.error('OpenCode', '获取交接代理失败', new Error(`Failed to get handover agent for phase: ${handoverPhase}`), {
        phase: handoverPhase,
        workflowId: workflow.id,
        action: 'getHandoverAgent',
        recovery: 'skipHandover',
      })
      return
    }

    const handoverContent = workflowServiceLike.getHandoverPrompt(currentPhase, handoverPhase)
    if (!handoverContent) {
      HyperDesignerLogger.error('OpenCode', '获取交接提示词失败', new Error(`Failed to get handover prompt for phase: ${handoverPhase}`), {
        phase: handoverPhase,
        currentPhase,
        workflowId: workflow.id,
        action: 'getHandoverPrompt',
        recovery: 'skipHandover',
      })
      return
    }

    HyperDesignerLogger.info('OpenCode', `工作流交接：从阶段 ${currentPhase || '无'} 到阶段 ${handoverPhase}，由代理 ${nextAgent} 处理。`)

    const adapter = capabilities.toAdapter()
    try {
      await workflowServiceLike.executeHandover(sessionID, adapter)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.error('OpenCode', '工作流交接执行失败', err, {
        phase: handoverPhase,
        currentPhase,
        workflowId: workflow.id,
        action: 'executeWorkflowHandover',
        recovery: 'skipPrompt',
      })
      return
    }

    await capabilities.native.sendPrompt({
      sessionId: sessionID,
      agent: nextAgent,
      text: handoverContent,
    })
  }) as EventHook
}

export async function createWorkflowHooks(
  _ctx: PluginInput,
  workflowServiceLike: WorkflowServiceLike,
  capabilities: PlatformCapabilities,
): Promise<{ event: ReturnType<typeof createEventHandler> }> {
  workflowServiceLike.on('handoverExecuted', ({ fromStep, toStep }) => {
    HyperDesignerLogger.info('Integrations', `Handover completed: ${fromStep || '(none)'} → ${toStep}`)
  })

  workflowServiceLike.on('stageCompleted', ({ stageName, mark }) => {
    HyperDesignerLogger.info('Integrations', `Stage ${stageName} ${mark ? 'completed' : 'uncompleted'}`)
  })

  if (!workflowServiceLike.getDefinition()) {
    HyperDesignerLogger.warn('OpenCode', '工作流未初始化，进入 fallback 模式，等待 hd_workflow_select。', {
      action: 'createWorkflowHooks',
      mode: 'fallback',
    })
  }

  return {
    event: createEventHandler(workflowServiceLike, capabilities),
  }
}

export const createOpenCodeAgentTransformer = createAgentTransformer
export const createOpenCodeUsingHyperDesignerTransformer = createUsingHyperDesignerTransformer

function toOpencodeAgentConfig(agent: LocalAgentConfig): OpencodeAgentConfig {
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

  if (agent.permission !== undefined) {
    const tools: Record<string, boolean> = {}
    for (const [tool, perm] of Object.entries(agent.permission)) {
      tools[tool] = perm !== 'deny'
    }
    result.tools = tools
  }

  return result
}

export function mapLocalAgentsToOpenCode(input: AgentMappingInput): Record<string, OpencodeAgentConfig> {
  return Object.fromEntries(
    Object.entries(input.agents).map(([key, agent]) => [key, toOpencodeAgentConfig(agent)]),
  )
}

export function buildOpenCodeMappedAgents(input: {
  agents: Record<string, LocalAgentConfig>
  hyperAgent: LocalAgentConfig
}): Record<string, OpencodeAgentConfig & { hidden?: boolean }> {
  const mappedBuiltinAgents = Object.fromEntries(
    Object.entries(mapLocalAgentsToOpenCode({ agents: input.agents })).map(([name, config]) => [
      name,
      {
        ...config,
        hidden: true,
      },
    ]),
  ) as Record<string, OpencodeAgentConfig & { hidden?: boolean }>

  const hyperAgentName = input.hyperAgent.name ?? 'Hyper'
  return {
    ...mappedBuiltinAgents,
    [hyperAgentName]: toOpencodeAgentConfig(input.hyperAgent),
  }
}

export function buildOpenCodeTools(
  input: {
    workflowService: BuildWorkflowToolsInput['workflowService']
    pluginTools: Record<string, ToolDefinition>
  },
  getContext: ToolContextFactory,
): ReturnType<typeof convertWorkflowToolsToOpenCode> {
  const allTools = [
    ...input.workflowService.listAllTools(),
    ...Object.values(input.pluginTools),
  ]
  if (allTools.length === 0) {
    return {}
  }
  return convertWorkflowToolsToOpenCode(allTools, getContext)
}

export async function createOpenCodePlatformOrchestrator(
  input: CreateOpenCodeOrchestratorInput,
): Promise<PlatformOrchestrator> {
  const workflowHooks = await createWorkflowHooks(input.ctx, input.workflowService, input.capabilities)
  const transformHooks = await createTransformHooks(input.ctx)

  const openCodeTools = buildOpenCodeTools(
    {
      workflowService: input.workflowService,
      pluginTools: input.pluginTools,
    },
    () => ({
      workflowId: input.workflowService.getDefinition()?.id ?? '',
      currentStage: input.workflowService.getCurrentStage(),
      state: input.workflowService.getState() as unknown as Record<string, unknown> | null,
      adapter: input.capabilities.toAdapter(),
    }),
  )

  return {
    toPluginHooks: () => ({
      config: async (config: Record<string, unknown>) => {
        config.agent = {
          ...(config.agent as Record<string, unknown> | undefined ?? {}),
          ...input.mappedAgents,
        }
      },
      tool: {
        ...openCodeTools,
      },
      event: async (eventInput) => {
        await workflowHooks.event(eventInput)
      },
      'chat.message': async (chatInput, chatOutput) => {
        const agentTransformer = createAgentTransformer()
        const usingHyperDesignerTransformer = createUsingHyperDesignerTransformer()
        const noWorkflowPromptTransformer = createNoWorkflowPromptTransformer()
        await agentTransformer(chatInput as never, chatOutput as never)
        await usingHyperDesignerTransformer(chatInput as never, chatOutput as never)
        await noWorkflowPromptTransformer(chatInput as never, chatOutput as never)
      },
      'experimental.chat.system.transform': async (transformInput: unknown, transformOutput: { system: string[] }) => {
        await transformHooks['experimental.chat.system.transform'](transformInput, transformOutput)
      },
    }),
  }
}
