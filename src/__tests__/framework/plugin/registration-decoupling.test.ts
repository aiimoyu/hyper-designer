import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

import { bootstrapSDK, resetSDKBootstrapForTest, sdk } from '../../../sdk'
import { BUILTIN_PLUGIN } from '../../../builtin/plugin'
import { defineHyperDesignerPlugin } from '../../../plugin'

describe('plugin registration decoupling', () => {
  it('agent registry should not import top-level user plugins directly', () => {
    const filePath = join(process.cwd(), 'src', 'agents', 'pluginRegistry.ts')
    const content = readFileSync(filePath, 'utf-8')

    expect(content).not.toContain("../../plugins/agents")
  })

  it('workflow registry should not import top-level user plugins directly', () => {
    const filePath = join(process.cwd(), 'src', 'workflows', 'core', 'pluginRegistry.ts')
    const content = readFileSync(filePath, 'utf-8')

    expect(content).not.toContain("../../../plugins/workflows")
  })

  it('sdk exposes tool plugin registration API', () => {
    expect(sdk).toHaveProperty('tool')
    expect(sdk.tool).toHaveProperty('plugins')
    expect(typeof sdk.tool.plugins.register).toBe('function')
    expect(typeof sdk.tool.plugins.registerMany).toBe('function')
    expect(typeof sdk.tool.plugins.list).toBe('function')
    expect(typeof sdk.tool.plugins.getAll).toBe('function')
  })

  it('bootstrap registers builtin first then user plugins can override builtin names', async () => {
    sdk.agent.plugins.clear()
    sdk.workflow.plugins.clear()
    sdk.tool.plugins.clear()
    resetSDKBootstrapForTest()

    await bootstrapSDK({
      plugins: [
        BUILTIN_PLUGIN,
        defineHyperDesignerPlugin({
          agent: async agents => {
            const next = { ...(agents ?? {}) }
            delete next.HCollector
            next.HArchitect = {
              name: 'HArchitect',
              description: 'user override architect',
              mode: 'primary',
              prompt: 'override',
            }
            return next
          },
          workflow: async workflows => ({
            ...(workflows ?? {}),
            classic: {
              id: 'classic',
              name: 'classic override',
              description: 'user override workflow',
              entryStageId: 's1',
              stages: {
                s1: {
                  stageId: 's1',
                  name: 'S1',
                  description: 'override stage',
                  agent: 'HArchitect',
                  getHandoverPrompt: () => 'override',
                  transitions: [],
                },
              },
            },
          }),
        }),
      ],
    })

    const agents = await sdk.agent.plugins.create()
    const classicWorkflow = sdk.workflow.plugins.get('classic')

    expect(agents.HCollector).toBeUndefined()
    expect(agents.HArchitect?.description).toBe('user override architect')
    expect(classicWorkflow?.name).toBe('classic override')
  })

  it('builtin tools are registered via plugin pipeline', async () => {
    sdk.tool.plugins.clear()
    resetSDKBootstrapForTest()

    await bootstrapSDK({
      plugins: [BUILTIN_PLUGIN],
    })

    const tools = await sdk.tool.plugins.getAll()
    const names = tools.map(tool => tool.name)

    expect(names).toContain('hd_workflow_state')
    expect(names).toContain('hd_workflow_list')
    expect(names).toContain('hd_handover')
    expect(names).toContain('hd_prepare_review')
    expect(names).toContain('hd_finalize_review')
  })
})
