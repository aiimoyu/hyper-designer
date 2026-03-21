import type { AgentConfig } from '../agents/types'
import type { ToolDefinition } from '../tools/types'
import type { WorkflowDefinition } from '../workflows/core/types'
import type {
  AgentPluginFactory,
  AgentPluginRegistration,
  ToolPluginRegistration,
  WorkflowPluginRegistration,
} from './contracts'
export * from './contracts'
export { bootstrapPluginRegistries } from './pluginBootstrap'
export {
  buildPluginRegistrations,
  defineHyperDesignerPlugin,
  toAgentPluginRegistrations,
  toToolPluginRegistrations,
  toWorkflowPluginRegistrations,
} from '../plugin'
import { bootstrapPluginRegistries } from './pluginBootstrap'

export type {
  AgentPluginFactory,
  AgentPluginRegistration,
  AgentConfig,
  WorkflowDefinition,
  WorkflowPluginRegistration,
}

import { createAllAgents, createBuiltinAgents, isHDAgent, isHDBuiltinAgent, isHDPluginAgent } from '../agents/utils'
import {
  ensureAgentPluginsBootstrapped,
  resetAgentPluginBootstrapForTest,
  clearAgentPluginsForTest,
  createPluginAgents,
  getAgentPluginNames,
  registerAgentPlugin,
  registerAgentPlugins,
} from '../agents/pluginRegistry'
import {
  ensureWorkflowPluginsBootstrapped,
  resetWorkflowPluginBootstrapForTest,
  clearWorkflowPluginsForTest,
  getAvailableWorkflowPlugins,
  getWorkflowPluginDefinition,
  registerWorkflowPlugin,
  registerWorkflowPlugins,
} from '../workflows/core/pluginRegistry'
import { getAvailableWorkflows, getWorkflowDefinition } from '../workflows/core/registry'
import {
  clearToolPluginsForTest,
  createPluginTools,
  getToolPluginNames,
  registerToolPlugin,
  registerToolPlugins,
} from '../tools/pluginRegistry'

export type { ToolContext } from '../tools/types'
export {
  convertWorkflowToolsToOpenCode,
  buildOpenCodeTools,
  createOpenCodeAgentTransformer,
  createOpenCodeUsingHyperDesignerTransformer,
} from '../platformBridge/platform/opencode/orchestrator'
export { createHyperAgent } from '../agents/Hyper'
export { workflowService } from '../workflows/core/service'
export { initLogger } from '../utils/logger'

interface SDK {
  agent: {
    createBuiltin: (model?: string) => Promise<Record<string, AgentConfig>>
    createAll: (model?: string) => Promise<Record<string, AgentConfig>>
    isBuiltin: (agentName: string | undefined) => boolean
    isPlugin: (agentName: string | undefined) => boolean
    isKnown: (agentName: string | undefined) => boolean
    plugins: {
      register: (name: string, factory: AgentPluginFactory) => void
      registerMany: (registrations: AgentPluginRegistration[]) => Promise<void>
      list: () => string[]
      create: (model?: string) => Promise<Record<string, AgentConfig>>
      clear: () => void
    }
  }
  workflow: {
    get: (typeId: string) => WorkflowDefinition | null
    list: () => string[]
    plugins: {
      register: (factory: () => WorkflowDefinition) => void
      registerMany: (registrations: WorkflowPluginRegistration[]) => Promise<void>
      list: () => string[]
      get: (typeId: string) => WorkflowDefinition | null
      clear: () => void
    }
  }
  tool: {
    plugins: {
      register: (name: string, factory: () => ToolDefinition | Promise<ToolDefinition>) => void
      registerMany: (registrations: ToolPluginRegistration[]) => Promise<void>
      list: () => string[]
      getAll: () => Promise<ToolDefinition[]>
      clear: () => void
    }
  }
}

export const sdk: SDK = {
  agent: {
    createBuiltin: createBuiltinAgents,
    createAll: createAllAgents,
    isBuiltin: isHDBuiltinAgent,
    isPlugin: isHDPluginAgent,
    isKnown: isHDAgent,
    plugins: {
      register: registerAgentPlugin,
      registerMany: async (registrations: AgentPluginRegistration[]) => {
        registerAgentPlugins(registrations)
      },
      list: getAgentPluginNames,
      create: createPluginAgents,
      clear: () => {
        clearAgentPluginsForTest()
        resetAgentPluginBootstrapForTest()
      },
    },
  },
  workflow: {
    get: getWorkflowDefinition,
    list: getAvailableWorkflows,
    plugins: {
      register: registerWorkflowPlugin,
      registerMany: async (registrations: WorkflowPluginRegistration[]) => {
        registerWorkflowPlugins(registrations)
      },
      list: getAvailableWorkflowPlugins,
      get: getWorkflowPluginDefinition,
      clear: () => {
        clearWorkflowPluginsForTest()
        resetWorkflowPluginBootstrapForTest()
      },
    },
  },
  tool: {
    plugins: {
      register: registerToolPlugin,
      registerMany: async (registrations: ToolPluginRegistration[]) => {
        registerToolPlugins(registrations)
      },
      list: getToolPluginNames,
      getAll: createPluginTools,
      clear: clearToolPluginsForTest,
    },
  },
}

const bootstrapOptions: {
  pluginDirectories?: string[]
  rootDirectory: string
} = {
  rootDirectory: process.cwd(),
}
if (process.env.HD_PLUGINS_DIR) {
  bootstrapOptions.pluginDirectories = process.env.HD_PLUGINS_DIR
    .split(':')
    .filter(Boolean)
}

await bootstrapPluginRegistries(bootstrapOptions)
ensureAgentPluginsBootstrapped()
ensureWorkflowPluginsBootstrapped()
