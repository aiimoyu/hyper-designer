import { bootstrapPluginRegistries, type PluginBootstrapOptions } from './pluginBootstrap'
import type { HyperDesignerPluginFactory } from '../plugin'
import { ensureAgentPluginsBootstrapped } from '../agents/pluginRegistry'
import { ensureWorkflowPluginsBootstrapped } from '../workflows/core/pluginRegistry'
import { HyperDesignerLogger } from '../utils/logger'

export interface SDKBootstrapOptions {
  plugins?: HyperDesignerPluginFactory[]
  pluginDirectories?: string[]
  rootDirectory?: string
  builtinDirectory?: string
  userDirectory?: string
}

let bootstrapped = false

export function isSDKBootstrapped(): boolean {
  return bootstrapped
}

export async function bootstrapSDK(options: SDKBootstrapOptions = {}): Promise<void> {
  if (bootstrapped) {
    HyperDesignerLogger.debug('SDK', 'SDK 已初始化，跳过重复 bootstrap')
    return
  }

  const bootstrapOptions: PluginBootstrapOptions = {
    rootDirectory: options.rootDirectory ?? process.cwd(),
  }

  if (options.plugins) {
    bootstrapOptions.plugins = options.plugins
  }

  if (options.builtinDirectory) {
    bootstrapOptions.builtinDirectory = options.builtinDirectory
  }

  if (options.userDirectory) {
    bootstrapOptions.userDirectory = options.userDirectory
  }

  if (options.pluginDirectories) {
    bootstrapOptions.pluginDirectories = options.pluginDirectories
  } else if (process.env.HD_PLUGINS_DIR) {
    bootstrapOptions.pluginDirectories = process.env.HD_PLUGINS_DIR
      .split(':')
      .filter(Boolean)
  }

  await bootstrapPluginRegistries(bootstrapOptions)
  ensureAgentPluginsBootstrapped()
  ensureWorkflowPluginsBootstrapped()

  bootstrapped = true
  HyperDesignerLogger.debug('SDK', 'SDK 初始化完成', {
    rootDirectory: bootstrapOptions.rootDirectory,
    pluginDirectories: bootstrapOptions.pluginDirectories,
  })
}

export function resetSDKBootstrapForTest(): void {
  bootstrapped = false
}
