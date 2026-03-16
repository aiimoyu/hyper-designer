import type { PluginInput } from '@opencode-ai/plugin'

import { createSystemTransformer } from './system-transform'

export async function createTransformHooks(_ctx: PluginInput) {
  return {
    'experimental.chat.system.transform': createSystemTransformer(),
  }
}
