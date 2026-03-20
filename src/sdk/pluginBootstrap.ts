import type { HyperDesignerPluginFactory } from '../plugin'
import {
  buildPluginRegistrations,
  loadPluginsFromDirectory,
  toAgentPluginRegistrations,
  toToolPluginRegistrations,
  toWorkflowPluginRegistrations,
} from '../plugin'

import { registerAgentPlugins } from '../agents/pluginRegistry'
import { registerToolPlugins } from '../tools/pluginRegistry'
import { registerWorkflowPlugins } from '../workflows/core/pluginRegistry'
import type { HyperDesignerPluginContext } from '../plugin'

export interface PluginBootstrapOptions {
  plugins?: HyperDesignerPluginFactory[]
  rootDirectory?: string
  builtinDirectory?: string
  userDirectory?: string
  pluginDirectories?: string[]
  ctx?: HyperDesignerPluginContext
}

export async function bootstrapPluginRegistries(options: PluginBootstrapOptions = {}): Promise<void> {
  let plugins = options.plugins
  if (!plugins) {
    const rootDirectory = options.rootDirectory ?? process.cwd()
    const builtinDirectory = options.builtinDirectory ?? `${rootDirectory}/src/builtin`
    const userDirectory = options.userDirectory ?? `${rootDirectory}/plugins`

    const builtinPlugins = await loadPluginsFromDirectory({
      directory: builtinDirectory,
      pattern: '**/plugin.ts',
    })
    const userPlugins = await loadPluginsFromDirectory({
      directory: userDirectory,
      pattern: '**/*.ts',
    })

    plugins = [...builtinPlugins, ...userPlugins]

    if (options.pluginDirectories && options.pluginDirectories.length > 0) {
      for (const pluginDirectory of options.pluginDirectories) {
        const directoryPlugins = await loadPluginsFromDirectory({
          directory: pluginDirectory,
        })
        plugins.push(...directoryPlugins)
      }
    }
  }

  const buildOptions: {
    plugins: HyperDesignerPluginFactory[]
    ctx?: HyperDesignerPluginContext
  } = {
    plugins,
  }
  if (options.ctx !== undefined) {
    buildOptions.ctx = options.ctx
  }

  const registrations = await buildPluginRegistrations(buildOptions)

  registerAgentPlugins(toAgentPluginRegistrations(registrations.agent))
  registerWorkflowPlugins(toWorkflowPluginRegistrations(registrations.workflow))
  registerToolPlugins(toToolPluginRegistrations(registrations.tool))
}
