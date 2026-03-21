import type { Hooks, PluginInput } from '@opencode-ai/plugin'

import { isHDAgent } from '../../../../agents/utils'
import { HyperDesignerLogger } from '../../../../utils/logger'

type ChatMessageHook = NonNullable<Hooks['chat.message']>

const HYPER_DESIGNER_SYSTEM_PROMPT = `<using-hyper-designer>
You are currently running within the Hyper Designer plugin environment. Please prioritize calling the specialized tools provided by Hyper Designer to complete tasks. Your behavioral guidelines should primarily adhere to the architectural specifications defined in the Agent system prompt.
</using-hyper-designer>`

export function createUsingHyperDesignerTransformer(_ctx: PluginInput): ChatMessageHook {
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

    const existingSystem = output.message.system
    if (existingSystem) {
      output.message.system = `${existingSystem}\n\n${HYPER_DESIGNER_SYSTEM_PROMPT}`
    } else {
      output.message.system = HYPER_DESIGNER_SYSTEM_PROMPT
    }
  }
}
