import type { Part, SessionMessagesResponse } from '@opencode-ai/sdk'
import { isHDAgent } from '../agents/utils'
import { resolveNodeConfig } from './agentRouting'
import { appendUsingHyperDesignerSystemPrompt } from './systemTransformer'
import { HyperDesignerLogger } from '../utils/logger'
import { workflowService } from '../workflows/service'

export interface ChatMessageInput {
  agent?: string
  sessionID?: string
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

export type FetchSessionMessages = (sessionID: string) => Promise<SessionMessagesResponse | null>

export function createHyperSessionHistoryTransformer(fetchMessages: FetchSessionMessages): ChatMessageTransformHook {
  return async (input, output) => {
    HyperDesignerLogger.debug('HyperSessionHistoryTransformer', "111")
    if (input.agent !== 'Hyper') {
      HyperDesignerLogger.debug('HyperSessionHistoryTransformer', `Agent ${input.agent} is not Hyper, skipping session history injection`)
      return
    }
    HyperDesignerLogger.debug('HyperSessionHistoryTransformer', "222")
    const sessionID = input.sessionID
    if (!sessionID) {
      return
    }
    HyperDesignerLogger.debug('HyperSessionHistoryTransformer', "333")
    try {
      const messages = await fetchMessages(sessionID)
      if (!messages || !Array.isArray(messages)) {
        return
      }
      HyperDesignerLogger.debug('HyperSessionHistoryTransformer', "444")
      const userPrompts = messages
        .filter((msg) => msg.info?.role === 'user')
        .map((msg) => {
          const textParts = msg.parts?.filter((p): p is Part & { type: 'text' } => p.type === 'text') ?? []
          return textParts.map((p) => p.text).join('\n')
        })
        .filter(Boolean)

      HyperDesignerLogger.info('HyperSessionHistory', `Session history: ${userPrompts.length} user prompt(s) found`, {
        sessionID,
        userPrompts,
        totalMessages: messages.length,
      })
      HyperDesignerLogger.debug('HyperSessionHistoryTransformer', "555")
      if (userPrompts.length === 0 && workflowService.isInitialized()) {
        injectActiveWorkflowStatus(output)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.error('HyperSessionHistory', 'Failed to fetch session messages', err, {
        sessionID,
        action: 'fetchSessionHistory',
      })
    }
  }
}

function injectActiveWorkflowStatus(output: ChatMessageOutput): void {
  const parts = output.parts
  if (!parts || parts.length === 0) {
    return
  }

  const textParts = parts.filter((part): part is Part & { type: 'text' } => part.type === 'text')
  if (textParts.length === 0) {
    return
  }

  const originalText = textParts.map(p => p.text).join('\n')

  const hasWrapperTag = originalText.includes('<user_instruction>') && originalText.includes('</user_instruction>')
  const hasSystemStatus = originalText.includes('[System Status]')

  if (hasWrapperTag && hasSystemStatus) {
    HyperDesignerLogger.debug('ActiveWorkflowPromptTransformer', '提示词已包含包装标签和系统状态，跳过注入', {
      textLength: originalText.length,
    })
    return
  }

  const state = workflowService.getState()
  const currentStage = state?.current?.name ?? 'unknown'

  const systemStatusBlock = `[System Status] There is currently a running workflow. Current stage: ${currentStage}
[Directive] You must first confirm the user's intent: whether to continue the previous work or start a new workflow. If starting a new workflow, remind the user to use the command \`/hyper-end\` and send the instruction again.`

  let modifiedText: string
  if (hasWrapperTag && !hasSystemStatus) {
    modifiedText = originalText.replace(
      '</user_instruction>',
      `\n${systemStatusBlock}\n</user_instruction>`
    )
  } else if (!hasWrapperTag) {
    modifiedText = `<user_instruction>
${originalText}
</user_instruction>

${systemStatusBlock}`
  } else {
    modifiedText = originalText
  }

  textParts[0]!.text = modifiedText

  HyperDesignerLogger.info('ActiveWorkflowPromptTransformer', '注入活跃工作流状态提示', {
    currentStage,
    originalLength: originalText.length,
    modifiedLength: modifiedText.length,
  })
}

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
  return async (input, output) => {
    // 仅当消息发送给 Hyper 模型时才进行变更
    if (input.agent !== 'Hyper') {
      return
    }

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
    
    const hasWrapperTag = (originalText.includes('<user_instruction>') && originalText.includes('</user_instruction>')) ||
                          (originalText.includes('<user_instruction>') && originalText.includes('</user_intent>'))
    const hasSystemStatus = originalText.includes('[System Status]')
    
    if (hasWrapperTag && hasSystemStatus) {
      HyperDesignerLogger.debug('NoWorkflowPromptTransformer', '提示词已包含包装标签和系统状态，跳过注入', {
        textLength: originalText.length,
      })
      return
    }
    
    const systemStatusBlock = `[System Status] No workflow is currently active.
[Directive] Please analyze the user's intent, assist them in selecting the appropriate workflow, and facilitate the handover to that workflow to fulfill the request.`
    
    let modifiedText: string
    if (hasWrapperTag && !hasSystemStatus) {
      modifiedText = originalText.replace(
        '</user_instruction>',
        `\n${systemStatusBlock}\n</user_instruction>`
      )
    } else if (!hasWrapperTag) {
      modifiedText = `<user_instruction>
${originalText}
</user_instruction>

${systemStatusBlock}`
    } else {
      modifiedText = originalText
    }

    textParts[0]!.text = modifiedText

    HyperDesignerLogger.debug('NoWorkflowPromptTransformer', '修改用户提示词以引导工作流选择', {
      originalLength: originalText.length,
      modifiedLength: modifiedText.length,
    })
  }
}
