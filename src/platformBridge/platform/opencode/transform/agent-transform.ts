import type { Hooks, PluginInput } from '@opencode-ai/plugin'

import { workflowService } from '../../../../workflows/core/service'
import { resolveNodeConfig } from '../../../../transform/agentRouting'
import { HyperDesignerLogger } from '../../../../utils/logger'

type ChatMessageHook = NonNullable<Hooks['chat.message']>

export function createAgentTransformer(_ctx: PluginInput): ChatMessageHook {
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
