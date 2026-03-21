import { vi } from 'vitest'

process.env.HD_STRICT_ERRORS = "1"
process.env.HD_PROJECT_CONFIG_PATH = ".test-temp/config-tests/hd-config.json"
process.env.HD_GLOBAL_CONFIG_PATH = ".test-temp/config-tests/global-hd-config.json"

vi.mock('@opencode-ai/plugin', () => {
  const tool = (definition: Record<string, unknown>) => definition
  const chainable: Record<string, unknown> = {}
  const chainFn = () => chainable
  chainable.describe = chainFn
  chainable.optional = chainFn
  chainable.nullable = chainFn
  chainable.min = chainFn
  chainable.max = chainFn
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
    number: () => chainable,
    string: () => chainable,
    object: () => chainable,
    array: () => chainable,
  }
  return { tool }
})

const { bootstrapSDK } = await import('../sdk/bootstrap')
await bootstrapSDK({ rootDirectory: process.cwd() })
