import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveDefaultModel } from '../../../platformBridge/platform/opencode/capabilities'
import type { ModelInfo } from '../../../platformBridge/platform/opencode/capabilities'
import { HyperDesignerLogger } from '../../../utils/logger'

/**
 * Creates a minimal mock PluginInput context for testing resolveDefaultModel.
 *
 * @param modelValue - The model string returned by ctx.client.config.get(), or null/undefined
 * @param shouldReject - If true, ctx.client.config.get() rejects with an error
 */
function createMockCtx(
  modelValue?: string | null,
  shouldReject = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (shouldReject) {
    return {
      client: {
        config: {
          get: vi.fn().mockRejectedValue(new Error('config fetch failed')),
        },
      },
    }
  }

  return {
    client: {
      config: {
        get: vi.fn().mockResolvedValue({
          data: modelValue !== undefined ? { model: modelValue } : {},
        }),
      },
    },
  }
}

describe('resolveDefaultModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('user model from ctx.client.config', () => {
    it('returns user model when available', async () => {
      const ctx = createMockCtx('openai/gpt-4-turbo')

      const result = await resolveDefaultModel(ctx)

      expect(result).toEqual({
        providerID: 'openai',
        modelID: 'gpt-4-turbo',
      })
    })

    it('handles user model with nested path (multiple slashes)', async () => {
      const ctx = createMockCtx('azure/openai/gpt-4')

      const result = await resolveDefaultModel(ctx)

      expect(result).toEqual({
        providerID: 'azure',
        modelID: 'openai/gpt-4',
      })
    })
  })

  describe('fallback to default model', () => {
    it('returns default model when no user model', async () => {
      const ctx = createMockCtx(undefined)

      const result = await resolveDefaultModel(ctx)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })

    it('returns default model when user model is null', async () => {
      const ctx = createMockCtx(null)

      const result = await resolveDefaultModel(ctx)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })

    it('returns default model when user model is empty string', async () => {
      // empty string is falsy, so it should fall through
      const ctx = createMockCtx('')

      const result = await resolveDefaultModel(ctx)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })

    it('returns default model when cfg.data is undefined', async () => {
      const ctx = {
        client: {
          config: {
            get: vi.fn().mockResolvedValue({ data: undefined }),
          },
        },
      }

      const result = await resolveDefaultModel(ctx as never)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })
  })

  describe('error handling', () => {
    it('returns default model when ctx.client.config.get rejects', async () => {
      const ctx = createMockCtx(undefined, true)
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn').mockImplementation(() => {})

      const result = await resolveDefaultModel(ctx)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
      warnSpy.mockRestore()
    })

    it('logs a warning when ctx.client.config.get rejects', async () => {
      const ctx = createMockCtx(undefined, true)
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn').mockImplementation(() => {})

      await resolveDefaultModel(ctx)

      expect(warnSpy).toHaveBeenCalledWith(
        'OpenCode',
        expect.stringContaining('加载用户配置的默认模型失败'),
        expect.any(Error)
      )
      warnSpy.mockRestore()
    })
  })

  describe('return type', () => {
    it('returns object matching ModelInfo interface', async () => {
      const ctx = createMockCtx('test/model')

      const result: ModelInfo = await resolveDefaultModel(ctx as never)

      expect(result).toHaveProperty('providerID')
      expect(result).toHaveProperty('modelID')
      expect(typeof result.providerID).toBe('string')
      expect(typeof result.modelID).toBe('string')
    })
  })
})
