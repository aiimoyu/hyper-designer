import { vi, beforeEach } from 'vitest'

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

const { BUILTIN_PLUGIN } = await import('../builtin/plugin')
const { buildRegistrations } = await import('../plugin')
const { registerAgentsFromRecord, registerWorkflowsFromRecord, registerToolsFromRecord, markBootstrapped, clearAllForTest } = await import('../plugin/registry')

async function registerBuiltinPlugins() {
  clearAllForTest()
  const registrations = await buildRegistrations([BUILTIN_PLUGIN])
  registerAgentsFromRecord(registrations.agent)
  registerWorkflowsFromRecord(registrations.workflow)
  registerToolsFromRecord(registrations.tool)
  markBootstrapped()
}

await registerBuiltinPlugins()

beforeEach(async () => {
  await registerBuiltinPlugins()
})
