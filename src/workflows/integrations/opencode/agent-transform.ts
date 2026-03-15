import type { Hooks, PluginInput } from '@opencode-ai/plugin'

import { workflowService } from '../../core/service'

type ChatMessageHook = NonNullable<Hooks['chat.message']>

export function createAgentTransformer(_ctx: PluginInput): ChatMessageHook {
  return async (input, output) => {
    if (input.agent !== 'Hyper') {
      return
    }

    const targetAgent = workflowService.getState()?.current?.agent
    if (!targetAgent) {
      return
    }

    input.agent = targetAgent
    output.message.agent = targetAgent
  }
}
