import type { PluginInput } from '@opencode-ai/plugin'

import { createOpenCodeAdapter } from '../../../adapters/opencode/adapter'
import type { PlatformCapabilities } from '../types'

export function createOpenCodePlatformCapabilities(ctx: PluginInput): PlatformCapabilities {
  const adapter = createOpenCodeAdapter(ctx)

  return {
    native: {
      createSession: adapter.createSession,
      sendPrompt: adapter.sendPrompt,
      deleteSession: adapter.deleteSession,
      summarizeSession: adapter.summarizeSession,
    },
    composite: {
      clearSession: adapter.clearSession,
    },
    toAdapter: () => adapter,
  }
}
