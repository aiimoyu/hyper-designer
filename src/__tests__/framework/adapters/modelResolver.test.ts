import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveDefaultModel } from '../../../adapters/opencode/modelResolver'
import type { ModelInfo } from '../../../adapters/opencode/modelResolver'
import type { HDConfig } from '../../../config/loader'
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

/**
 * Creates a minimal HDConfig for testing.
 */
function createMockConfig(overrides?: Partial<HDConfig>): HDConfig {
  return {
    agents: {},
    ...overrides,
  }
}

describe('resolveDefaultModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('config.summarize override (highest priority)', () => {
    it('returns providerID and modelID from config.summarize when set', async () => {
      const ctx = createMockCtx()
      const config = createMockConfig({ summarize: 'anthropic/claude-3-opus' })

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'anthropic',
        modelID: 'claude-3-opus',
      })
    })

    it('handles summarize with nested model path (multiple slashes)', async () => {
      const ctx = createMockCtx()
      const config = createMockConfig({ summarize: 'google/gemini/1.5-pro' })

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'google',
        modelID: 'gemini/1.5-pro',
      })
    })

    it('does not call ctx.client.config.get when summarize is set', async () => {
      const ctx = createMockCtx()
      const config = createMockConfig({ summarize: 'openai/gpt-4o' })

      await resolveDefaultModel(ctx, config)

      expect(ctx.client.config.get).not.toHaveBeenCalled()
    })
  })

  describe('user model from ctx.client.config (second priority)', () => {
    it('returns user model when config.summarize is not set', async () => {
      const ctx = createMockCtx('openai/gpt-4-turbo')
      const config = createMockConfig()

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'openai',
        modelID: 'gpt-4-turbo',
      })
    })

    it('handles user model with nested path (multiple slashes)', async () => {
      const ctx = createMockCtx('azure/openai/gpt-4')
      const config = createMockConfig()

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'azure',
        modelID: 'openai/gpt-4',
      })
    })
  })

  describe('fallback to default model (lowest priority)', () => {
    it('returns default model when no summarize and no user model', async () => {
      const ctx = createMockCtx(undefined)
      const config = createMockConfig()

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })

    it('returns default model when user model is null', async () => {
      const ctx = createMockCtx(null)
      const config = createMockConfig()

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })

    it('returns default model when user model is empty string', async () => {
      // empty string is falsy, so it should fall through
      const ctx = createMockCtx('')
      const config = createMockConfig()

      const result = await resolveDefaultModel(ctx, config)

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
      const config = createMockConfig()

      const result = await resolveDefaultModel(ctx as never, config)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
    })
  })

  describe('error handling', () => {
    it('returns default model when ctx.client.config.get rejects', async () => {
      const ctx = createMockCtx(undefined, true)
      const config = createMockConfig()
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn').mockImplementation(() => {})

      const result = await resolveDefaultModel(ctx, config)

      expect(result).toEqual({
        providerID: 'opencode',
        modelID: 'big-pickle',
      })
      warnSpy.mockRestore()
    })

    it('logs a warning when ctx.client.config.get rejects', async () => {
      const ctx = createMockCtx(undefined, true)
      const config = createMockConfig()
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn').mockImplementation(() => {})

      await resolveDefaultModel(ctx, config)

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
      const config = createMockConfig()

      const result: ModelInfo = await resolveDefaultModel(ctx as never, config)

      expect(result).toHaveProperty('providerID')
      expect(result).toHaveProperty('modelID')
      expect(typeof result.providerID).toBe('string')
      expect(typeof result.modelID).toBe('string')
    })
  })
})
