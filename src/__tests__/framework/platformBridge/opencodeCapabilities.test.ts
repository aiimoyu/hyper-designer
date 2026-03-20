import { describe, it, expect, vi } from 'vitest'
import type { PluginInput } from '@opencode-ai/plugin'

import { createOpenCodePlatformCapabilities } from '../../../platformBridge/capabilities/opencode'

function createMockCtx(): PluginInput {
  return {
    client: {
      session: {
        create: vi.fn().mockResolvedValue({ data: { id: 'session-new' } }),
        prompt: vi.fn().mockResolvedValue({ data: { info: {}, parts: [{ type: 'text', text: 'ok' }] } }),
        delete: vi.fn().mockResolvedValue({}),
        summarize: vi.fn().mockResolvedValue({}),
      },
      tui: {
        publish: vi.fn().mockResolvedValue(true),
      },
      config: {
        get: vi.fn().mockResolvedValue({ data: { model: 'openai/gpt-4o' } }),
      },
    },
    directory: '/tmp/project',
  } as unknown as PluginInput
}

describe('createOpenCodePlatformCapabilities', () => {
  it('exposes native and composite capabilities', () => {
    const capabilities = createOpenCodePlatformCapabilities(createMockCtx())

    expect(typeof capabilities.native.createSession).toBe('function')
    expect(typeof capabilities.native.sendPrompt).toBe('function')
    expect(typeof capabilities.native.deleteSession).toBe('function')
    expect(typeof capabilities.native.summarizeSession).toBe('function')
    expect(typeof capabilities.composite.clearSession).toBe('function')
  })

  it('supports clearSession then prompt redirection through adapter view', async () => {
    const ctx = createMockCtx()
    const capabilities = createOpenCodePlatformCapabilities(ctx)
    const adapter = capabilities.toAdapter()

    await capabilities.composite.clearSession('session-old')
    await adapter.sendPrompt({
      sessionId: 'session-old',
      agent: 'HArchitect',
      text: 'continue',
    })

    expect(ctx.client.session.prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: 'session-new' },
      }),
    )
  })
})
