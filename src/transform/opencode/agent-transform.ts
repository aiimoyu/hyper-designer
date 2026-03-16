import type { Hooks, PluginInput } from '@opencode-ai/plugin'

import { workflowService } from '../../workflows/core/service'
import { resolveAgentForMessage } from '../agentRouting'

type ChatMessageHook = NonNullable<Hooks['chat.message']>

export function createAgentTransformer(_ctx: PluginInput): ChatMessageHook {
  return async (input, output) => {
    const targetAgent = resolveAgentForMessage(input.agent, workflowService.getState())
    if (!targetAgent) {
      return
    }

    input.agent = targetAgent
    output.message.agent = targetAgent
  }
}
