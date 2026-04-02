import type { Part } from '@opencode-ai/sdk'
import { isHDAgent } from '../agents/utils'
import { resolveNodeConfig } from './agentRouting'
import { appendUsingHyperDesignerSystemPrompt } from './systemTransformer'
import { HyperDesignerLogger } from '../utils/logger'
import { workflowService } from '../workflows/service'

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
  parts: Part[]
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

/**
 * 当工作流未初始化时，修改用户提示词，添加工作流选择引导
 */
export function createNoWorkflowPromptTransformer(): ChatMessageTransformHook {
  return async (_input, output) => {
    if (workflowService.isInitialized()) {
      return
    }

    const parts = output.parts
    if (!parts || parts.length === 0) {
      return
    }

    const textParts = parts.filter((part): part is Part & { type: 'text' } => part.type === 'text')
    if (textParts.length === 0) {
      return
    }

    const originalText = textParts.map(p => p.text).join('\n')
    const modifiedText = `<user_instruction>
${originalText}
</user_intent>

[System Status] No workflow is currently active.
[Directive] Please analyze the user's intent, assist them in selecting the appropriate workflow, and facilitate the handover to that workflow to fulfill the request.`

    textParts[0]!.text = modifiedText

    HyperDesignerLogger.debug('NoWorkflowPromptTransformer', '修改用户提示词以引导工作流选择', {
      originalLength: originalText.length,
      modifiedLength: modifiedText.length,
    })
  }
}
