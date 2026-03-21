import { isHDAgent } from '../agents/utils'
import { resolveNodeConfig } from './agentRouting'
import { appendUsingHyperDesignerSystemPrompt } from './systemTransformer'
import { HyperDesignerLogger } from '../utils/logger'
import { workflowService } from '../workflows/core/service'

export interface ChatMessageInput {
  agent?: string
  model?: {
    providerID: string
    modelID: string
  }
  variant?: string
}

export interface ChatMessageOutput {
  message: {
    agent?: string
    model?: {
      providerID: string
      modelID: string
    }
    system?: string
  }
}

export type ChatMessageTransformHook = (
  input: ChatMessageInput,
  output: ChatMessageOutput,
) => Promise<void>

export function createAgentTransformer(): ChatMessageTransformHook {
  return async (input, output) => {
    const nodeConfig = resolveNodeConfig(input.agent, workflowService.getState())
    if (!nodeConfig) {
      return
    }

    HyperDesignerLogger.debug('AgentTransformer', 'chat hook input', input)
    HyperDesignerLogger.debug('AgentTransformer', 'chat hook output', output)

    input.agent = nodeConfig.agent
    output.message.agent = nodeConfig.agent

    if (nodeConfig.model) {
      input.model = nodeConfig.model
      output.message.model = nodeConfig.model
    }
    if (nodeConfig.variant) {
      input.variant = nodeConfig.variant
    }

    if (nodeConfig.model || nodeConfig.variant) {
      HyperDesignerLogger.debug('AgentTransformer', '应用 node 配置', nodeConfig)
    }
  }
}

export function createUsingHyperDesignerTransformer(): ChatMessageTransformHook {
  return async (input, output) => {
    const agentName = input.agent
    if (!agentName) {
      return
    }

    if (!isHDAgent(agentName)) {
      HyperDesignerLogger.debug('UsingHyperDesignerTransformer', `Agent ${agentName} is not a hyper-designer agent, skipping system prompt injection`)
      return
    }

    HyperDesignerLogger.debug('UsingHyperDesignerTransformer', `Injecting hyper-designer system prompt for agent: ${agentName}`)
    output.message.system = appendUsingHyperDesignerSystemPrompt(output.message.system)
  }
}
