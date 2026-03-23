import type { Plugin } from "@opencode-ai/plugin"
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk"
import type { ToolDefinition } from '../../src/types'
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import {
  bootstrapSDK,
  createHyperAgent,
  initLogger,
  sdk,
  workflowService,
} from '../../src/sdk'
import {
  buildOpenCodeMappedAgents,
  createOpenCodePlatformOrchestrator,
} from '../../src/platformBridge/platform/opencode/orchestrator'
import {
  createOpenCodePlatformCapabilities,
} from '../../src/platformBridge/platform/opencode/capabilities'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HD_PACKAGE_ROOT = resolve(__dirname, '../..')

export const HyperDesignerPlugin: Plugin = async (ctx) => {
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
  await bootstrapSDK({
    pluginDirectories,
    rootDirectory: HD_PACKAGE_ROOT,
  })

  const platformCapabilities = createOpenCodePlatformCapabilities(ctx)

  const agents = await sdk.agent.create()
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

  const pluginToolDefinitions = await sdk.tool.plugins.getAll()
  const pluginTools = Object.fromEntries(
    pluginToolDefinitions.map(definition => [definition.name, definition]),
  ) as Record<string, ToolDefinition>

  const orchestrator = await createOpenCodePlatformOrchestrator({
    ctx,
    capabilities: platformCapabilities,
    workflowService,
    pluginTools,
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
