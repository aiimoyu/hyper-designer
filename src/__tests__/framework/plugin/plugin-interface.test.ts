import { describe, expect, it } from 'vitest'

import { buildPluginRegistrations, defineHyperDesignerPlugin } from '../../../plugin'
import { BUILTIN_PLUGIN } from '../../../builtin/plugin'
import type { HyperDesignerPluginFactory } from '../../../plugin'

async function loadExamplePlugin(): Promise<HyperDesignerPluginFactory> {
  const loaded = await import('../../../../plugins/example')
  return loaded.EXAMPLE_USER_PLUGIN
}

describe('plugin interface', () => {
  it('exposes plugin define + registration builder API', () => {
    expect(typeof defineHyperDesignerPlugin).toBe('function')
    expect(typeof buildPluginRegistrations).toBe('function')
  })

  it('builds user plugin registrations for agent/workflow/tool', async () => {
    const registrations = await buildPluginRegistrations([
      BUILTIN_PLUGIN,
      await loadExamplePlugin(),
    ])

    expect(registrations.agent).toBeDefined()
    expect(registrations.workflow).toBeDefined()
    expect(registrations.tool).toBeDefined()

    expect(registrations.agent.UserExampleAgent?.name).toBe('UserExampleAgent')
    expect(registrations.agent.HArchitect?.name).toBe('HArchitect')
    expect(registrations.workflow.userExampleWorkflow?.id).toBe('userExampleWorkflow')
    expect(registrations.workflow.classic?.id).toBe('classic')
  })

  it('applies plugins in declaration order so later plugins can override earlier definitions', async () => {
    const basePlugin = defineHyperDesignerPlugin({
      agent: async agents => ({
        ...agents,
        HArchitect: {
          name: 'HArchitect',
          description: 'builtin architect',
          mode: 'primary',
          prompt: 'builtin',
        },
      }),
    })

    const overridePlugin = defineHyperDesignerPlugin({
      agent: async agents => ({
        ...agents,
        HArchitect: {
          name: 'HArchitect',
          description: 'user override architect',
          mode: 'primary',
          prompt: 'override',
        },
      }),
    })

    const registrations = await buildPluginRegistrations([basePlugin, overridePlugin])
    expect(registrations.agent.HArchitect?.description).toBe('user override architect')
  })
})
