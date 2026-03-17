import type { Hooks, PluginInput } from '@opencode-ai/plugin'

import { workflowService } from '../../workflows/core/service'
import { resolveAgentForMessage } from '../agentRouting'
import { HyperDesignerLogger } from '../../utils/logger'

type ChatMessageHook = NonNullable<Hooks['chat.message']>

export function createAgentTransformer(_ctx: PluginInput): ChatMessageHook {
  return async (input, output) => {
    const targetAgent = resolveAgentForMessage(input.agent, workflowService.getState())
    if (!targetAgent) {
      return
    }
    HyperDesignerLogger.debug('AgentTransformer', 'chat hook input', input)
    HyperDesignerLogger.debug('AgentTransformer', 'chat hook output', output)
    input.agent = targetAgent
    output.message.agent = targetAgent
  }
}
