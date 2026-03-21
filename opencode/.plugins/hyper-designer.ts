import type { Hooks, Plugin } from "@opencode-ai/plugin"
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import {
  bootstrapPluginRegistries,
  createHyperAgent,
  initLogger,
  sdk,
  workflowService,
} from '../../src/sdk'
import {
  buildOpenCodeMappedAgents,
  createOpenCodePlatformCapabilities,
  createOpenCodePlatformOrchestrator,
} from '../../src/platformBridge'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HD_PACKAGE_ROOT = resolve(__dirname, '../..')

export const HyperDesignerPlugin: Plugin = async (ctx) => {
  // Initialize logger - respects HYPER_DESIGNER_LOG_PERSIST env var
  initLogger()

  sdk.agent.plugins.clear()
  sdk.workflow.plugins.clear()
  sdk.tool.plugins.clear()
  const pluginDirectories = [
    `${ctx.directory}/plugins`,
  ]
  if (process.env.HD_PLUGINS_DIR) {
    pluginDirectories.push(...process.env.HD_PLUGINS_DIR.split(':').filter(Boolean))
  }
  await bootstrapPluginRegistries({
    pluginDirectories,
    rootDirectory: HD_PACKAGE_ROOT,
  })

  const platformCapabilities = createOpenCodePlatformCapabilities(ctx)

  const agents = await sdk.agent.createAll()
  const mappedAgents = buildOpenCodeMappedAgents({
    agents,
    hyperAgent: createHyperAgent(),
  }) as Record<string, OpencodeAgentConfig & { hidden?: boolean }>
  const agentHandler = async (config: Record<string, unknown>) => {
    config.agent = {
      ...(config.agent ?? {}),
      ...mappedAgents,
    }
  }



  const pluginTools = await sdk.tool.plugins.getAll()

  const orchestrator = await createOpenCodePlatformOrchestrator({
    ctx,
    capabilities: platformCapabilities,
    workflowService,
    pluginTools: pluginTools as NonNullable<Hooks['tool']>,
    mappedAgents,
  })

  const hooks = orchestrator.toPluginHooks()
  return {
    ...hooks,
    config: async (config: Record<string, unknown>) => {
      await hooks.config(config)
      await agentHandler(config)
    },
  }
}
