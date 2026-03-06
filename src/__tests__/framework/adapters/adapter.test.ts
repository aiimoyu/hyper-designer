import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOpenCodeAdapter } from '../../../adapters/opencode/adapter'
import { HyperDesignerLogger } from '../../../utils/logger'
import type { PluginInput } from '@opencode-ai/plugin'

// ── 测试辅助工厂 ────────────────────────────────────────────────────────
function makeCtx(options?: {
  summarizeImpl?: () => Promise<unknown>
  createImpl?: () => Promise<unknown>
  publishImpl?: () => Promise<unknown>
}): PluginInput {
  const summarizeImpl = options?.summarizeImpl ?? (() => Promise.resolve({ data: {} }))
  const createImpl = options?.createImpl ?? (() => Promise.resolve({ data: { id: 'mock-id' } }))
  const publishImpl = options?.publishImpl ?? (() => Promise.resolve(true))
  return {
    client: {
      session: {
        summarize: vi.fn().mockImplementation(summarizeImpl),
        create: vi.fn().mockImplementation(createImpl),
        delete: vi.fn().mockResolvedValue({}),
        prompt: vi.fn().mockResolvedValue({ data: { info: {}, parts: [] } }),
      },
      tui: {
        publish: vi.fn().mockImplementation(publishImpl),
      },
      config: {
        get: vi.fn().mockResolvedValue({ data: { model: 'openai/gpt-4o' } }),
      },
    },
    directory: '/tmp/test',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

// ── 测试套件 ──────────────────────────────────────────────────────────────

describe('createOpenCodeAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('summarizeSession', () => {
    it('calls ctx.client.session.summarize exactly once with correct args', async () => {
      const ctx = makeCtx()
      const adapter = createOpenCodeAdapter(ctx)

      await adapter.summarizeSession('ses-test-001')

      expect(ctx.client.session.summarize).toHaveBeenCalledOnce()
      expect(ctx.client.session.summarize).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: 'ses-test-001' },
          body: expect.objectContaining({
            providerID: expect.any(String),
            modelID: expect.any(String),
          }),
        })
      )
    })

    it('logs info at start with sessionId context', async () => {
      const infoSpy = vi.spyOn(HyperDesignerLogger, 'info')
      const ctx = makeCtx()
      const adapter = createOpenCodeAdapter(ctx)

      await adapter.summarizeSession('ses-ctx-check')

      const startCall = infoSpy.mock.calls.find(
        ([module, msg]) => module === 'OpenCode' && typeof msg === 'string' && msg.includes('压缩')
      )
      expect(startCall).toBeDefined()
      // 第三个参数包含 sessionId
      expect(startCall?.[2]).toMatchObject({ sessionId: 'ses-ctx-check' })
    })

    it('logs completion info with sessionId context', async () => {
      const infoSpy = vi.spyOn(HyperDesignerLogger, 'info')
      const ctx = makeCtx()
      const adapter = createOpenCodeAdapter(ctx)

      await adapter.summarizeSession('ses-done-log')

      const doneCall = infoSpy.mock.calls.find(
        ([module, msg]) => module === 'OpenCode' && typeof msg === 'string' && msg.includes('完成')
      )
      expect(doneCall).toBeDefined()
      expect(doneCall?.[2]).toMatchObject({ sessionId: 'ses-done-log' })
    })

    describe('failure handling', () => {
      /**
       * 注意：在测试环境中 HD_STRICT_ERRORS=1，所以 HyperDesignerLogger.error
       * 在记录错误后会抛出。因此测试中需要 mock 掉 logger.error 来防止重新抛出，
       * 专注于验证它是否被正确调用。
       *
       * 生产环境（不设置 HD_STRICT_ERRORS）中，logger.error 只记录不抛出，
       * catch 块会静默处理错误，工作流继续执行。
       */
      it('logs an error when session.summarize rejects', async () => {
        const errorSpy = vi.spyOn(HyperDesignerLogger, 'error').mockImplementation(() => {})
        const ctx = makeCtx({
          summarizeImpl: () => Promise.reject(new Error('network error')),
        })
        const adapter = createOpenCodeAdapter(ctx)

        await adapter.summarizeSession('ses-fail-log')

        expect(errorSpy).toHaveBeenCalledWith(
          'OpenCode',
          expect.stringContaining('压缩失败'),
          expect.any(Error),
          expect.objectContaining({ sessionId: 'ses-fail-log' })
        )
      })

      it('wraps non-Error rejections in an Error before logging', async () => {
        const errorSpy = vi.spyOn(HyperDesignerLogger, 'error').mockImplementation(() => {})
        const ctx = makeCtx({
          summarizeImpl: () => Promise.reject('string error'),
        })
        const adapter = createOpenCodeAdapter(ctx)

        await adapter.summarizeSession('ses-string-error')

        const loggedError = errorSpy.mock.calls[0]?.[2]
        expect(loggedError).toBeInstanceOf(Error)
        expect((loggedError as Error).message).toBe('string error')
      })

      it('calls logger.error with recovery context', async () => {
        const errorSpy = vi.spyOn(HyperDesignerLogger, 'error').mockImplementation(() => {})
        const ctx = makeCtx({
          summarizeImpl: () => Promise.reject(new Error('timeout')),
        })
        const adapter = createOpenCodeAdapter(ctx)

        await adapter.summarizeSession('ses-recovery')

        expect(errorSpy).toHaveBeenCalledWith(
          'OpenCode',
          expect.any(String),
          expect.any(Error),
          expect.objectContaining({
            action: 'summarizeSession',
            recovery: 'continueWithoutSummarize',
          })
        )
      })
    })
  })

  describe('clearSession', () => {
    it('creates a new session and selects it in TUI', async () => {
      const ctx = makeCtx({
        createImpl: () => Promise.resolve({ data: { id: 'fresh-session-id' } }),
      })
      const adapter = createOpenCodeAdapter(ctx)

      await adapter.clearSession('ses-old-001')

      expect(ctx.client.session.create).toHaveBeenCalledOnce()
      expect(ctx.client.session.create).toHaveBeenCalledWith({
        body: { title: 'Fresh Context' },
        query: { directory: '/tmp/test' },
      })
      expect(ctx.client.tui.publish).toHaveBeenCalledOnce()
      expect(ctx.client.tui.publish).toHaveBeenCalledWith({
        directory: '/tmp/test',
        body: {
          type: 'tui.session.select',
          properties: { sessionID: 'fresh-session-id' },
        },
      })
    })

    it('redirects subsequent prompt calls to the fresh session', async () => {
      const ctx = makeCtx({
        createImpl: () => Promise.resolve({ data: { id: 'fresh-session-id' } }),
      })
      const adapter = createOpenCodeAdapter(ctx)

      await adapter.clearSession('ses-old-002')
      await adapter.sendPrompt({
        sessionId: 'ses-old-002',
        agent: 'HArchitect',
        text: 'continue',
      })

      expect(ctx.client.session.prompt).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: 'fresh-session-id' },
        }),
      )
    })
  })
})
