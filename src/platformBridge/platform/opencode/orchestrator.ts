import type { AgentConfig as OpencodeAgentConfig } from '@opencode-ai/sdk'

import type { AgentConfig as LocalAgentConfig } from '../../../agents/types'
import { createHdTools } from '../../../workflows/tools/hdTools'
import type {
  AgentMappingInput,
  BuildWorkflowToolsInput,
  CreateOpenCodeOrchestratorInput,
  PlatformOrchestrator,
  ToolContextFactory,
} from '../../orchestration/types'
import { createAgentTransformer } from './transform/agent-transform'
import { createUsingHyperDesignerTransformer } from './transform/using-hyperdesigner-transform'
import { createTransformHooks } from './transform/hooks'
import { createWorkflowHooks } from './workflows'
import { convertWorkflowToolsToOpenCode } from './workflows/workflow-tools'
import { createDocumentReviewTools } from './tools/documentReview'

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

  return {
    ...mappedBuiltinAgents,
    Hyper: toOpencodeAgentConfig(input.hyperAgent),
  }
}

export function buildOpenCodeWorkflowTools(
  input: BuildWorkflowToolsInput,
  getContext: ToolContextFactory,
): ReturnType<typeof convertWorkflowToolsToOpenCode> {
  const allWorkflowTools = input.workflowService.listAllTools()
  if (allWorkflowTools.length === 0) {
    return {}
  }
  return convertWorkflowToolsToOpenCode(allWorkflowTools, getContext)
}

export async function createOpenCodePlatformOrchestrator(
  input: CreateOpenCodeOrchestratorInput,
): Promise<PlatformOrchestrator> {
  const workflowHooks = await createWorkflowHooks(input.ctx, input.workflowService, input.capabilities)
  const transformHooks = await createTransformHooks(input.ctx)

  const workflowTools = buildOpenCodeWorkflowTools(
    { workflowService: input.workflowService },
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
        ...createHdTools(),
        ...createDocumentReviewTools(),
        ...workflowTools,
        ...input.pluginTools,
      },
      event: async (eventInput) => {
        await workflowHooks.event(eventInput)
      },
      'chat.message': async (chatInput, chatOutput) => {
        const agentTransformer = createAgentTransformer(input.ctx)
        const usingHyperDesignerTransformer = createUsingHyperDesignerTransformer(input.ctx)
        await agentTransformer(chatInput, chatOutput)
        await usingHyperDesignerTransformer(chatInput, chatOutput)
      },
      'experimental.chat.system.transform': async (transformInput: unknown, transformOutput: { system: string[] }) => {
        await transformHooks['experimental.chat.system.transform'](transformInput, transformOutput)
      },
    }),
  }
}
