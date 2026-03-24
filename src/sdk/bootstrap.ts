import type { PluginFactory, PluginContext } from '../types'
import { buildRegistrations, loadPlugins } from '../plugin'
import {
  registerAgentsFromRecord,
  registerWorkflowsFromRecord,
  registerToolsFromRecord,
  markBootstrapped,
  resetBootstrapForTest,
} from '../plugin/registry'
import { HyperDesignerLogger } from '../utils/logger'

export interface BootstrapOptions {
  plugins?: PluginFactory[]
  rootDirectory?: string
  builtinDirectory?: string
  userDirectory?: string
  pluginDirectories?: string[]
  ctx?: PluginContext
}

let sdkBootstrapped = false

export function isSDKBootstrapped(): boolean {
  return sdkBootstrapped
}

export async function bootstrapSDK(opts: BootstrapOptions = {}): Promise<void> {
  if (sdkBootstrapped) {
    HyperDesignerLogger.debug('SDK', 'SDK 已初始化，跳过')
    return
  }

  let plugins = opts.plugins
  if (!plugins || plugins.length === 0) {
    const root = opts.rootDirectory ?? process.cwd()
    const builtin = opts.builtinDirectory ?? `${root}/src/builtin`
    const user = opts.userDirectory ?? `${root}/plugins`

    const builtinPlugins = await loadPlugins({ directory: builtin, pattern: '**/plugin.ts' })
    const userPlugins = await loadPlugins({ directory: user })
    plugins = [...builtinPlugins, ...userPlugins]

    const dirs = opts.pluginDirectories ?? process.env.HD_PLUGINS_DIR?.split(':').filter(Boolean) ?? []
    for (const dir of dirs) {
      plugins.push(...await loadPlugins({ directory: dir }))
    }
  }

  const buildOpts: { plugins: PluginFactory[]; ctx?: PluginContext } = { plugins }
  if (opts.ctx !== undefined) buildOpts.ctx = opts.ctx
  const registrations = await buildRegistrations(buildOpts)
  registerAgentsFromRecord(registrations.agent)
  registerWorkflowsFromRecord(registrations.workflow)
  registerToolsFromRecord(registrations.tool)
  markBootstrapped()

  sdkBootstrapped = true
  HyperDesignerLogger.debug('SDK', 'SDK 初始化完成', {
    rootDirectory: opts.rootDirectory,
  })
}

export function resetSDKForTest(): void {
  sdkBootstrapped = false
  resetBootstrapForTest()
}
