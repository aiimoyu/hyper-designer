import { describe, expect, it } from 'vitest'

import { buildRegistrations, definePlugin } from '../../../plugin'
import { BUILTIN_PLUGIN } from '../../../builtin/plugin'
import type { PluginFactory } from '../../../types'

async function loadExamplePlugin(): Promise<PluginFactory> {
  const loaded = await import('../../../../plugins/example')
  return loaded.EXAMPLE_USER_PLUGIN
}

describe('plugin interface', () => {
  it('exposes plugin define + registration builder API', () => {
    expect(typeof definePlugin).toBe('function')
    expect(typeof buildRegistrations).toBe('function')
  })

  it('builds user plugin registrations for agent/workflow/tool', async () => {
    const registrations = await buildRegistrations([
      BUILTIN_PLUGIN,
      await loadExamplePlugin(),
    ])

    expect(registrations.agent.UserExampleAgent).toBeDefined()
    expect(registrations.workflow.userExampleWorkflow).toBeDefined()
    expect(Object.keys(registrations.agent).length).toBeGreaterThanOrEqual(6)
    expect(Object.keys(registrations.workflow).length).toBeGreaterThanOrEqual(4)
  })

  it('applies plugins in declaration order so later plugins can override earlier definitions', async () => {
    const overrideAgent = definePlugin(async () => ({
      agent: async agents => {
        const base = agents['HCollector']
        return {
          ...agents,
          HCollector: {
            ...base,
            description: 'overridden by test plugin',
          },
        }
      },
    }))

    const registrations = await buildRegistrations([
      BUILTIN_PLUGIN,
      overrideAgent,
    ])

    expect(registrations.agent['HCollector']).toBeDefined()
    const config = registrations.agent['HCollector']
    expect(config.description).toBe('overridden by test plugin')
  })
})
