import type { AgentPluginFactory, AgentPluginRegistration } from '../plugins/agent'
import type { AgentConfig } from '../agents/types'
import type { WorkflowDefinition } from '../workflows/core/types'
import type { WorkflowPluginRegistration } from '../plugins/workflow'

import { createAllAgents, createBuiltinAgents, isHDAgent, isHDBuiltinAgent, isHDPluginAgent } from '../agents/utils'
import {
  ensureAgentPluginsBootstrapped,
  resetAgentPluginBootstrapForTest,
  clearAgentPluginsForTest,
  createPluginAgents,
  getAgentPluginNames,
  registerAgentPlugin,
  registerAgentPlugins,
} from '../plugins/agent'
import {
  ensureWorkflowPluginsBootstrapped,
  resetWorkflowPluginBootstrapForTest,
  clearWorkflowPluginsForTest,
  getAvailableWorkflowPlugins,
  getWorkflowPluginDefinition,
  registerWorkflowPlugin,
  registerWorkflowPlugins,
} from '../plugins/workflow'
import { getAvailableWorkflows, getWorkflowDefinition } from '../workflows/core/registry'

interface SDK {
  agent: {
    createBuiltin: (model?: string) => Promise<Record<string, AgentConfig>>
    createAll: (model?: string) => Promise<Record<string, AgentConfig>>
    isBuiltin: (agentName: string | undefined) => boolean
    isPlugin: (agentName: string | undefined) => boolean
    isKnown: (agentName: string | undefined) => boolean
    plugins: {
      register: (name: string, factory: AgentPluginFactory) => void
      registerMany: (registrations: AgentPluginRegistration[]) => void
      list: () => string[]
      create: (model?: string) => Promise<Record<string, AgentConfig>>
      clear: () => void
    }
  }
  workflow: {
    get: (typeId: string) => WorkflowDefinition | null
    list: () => string[]
    plugins: {
      register: (name: string, factory: () => WorkflowDefinition) => void
      registerMany: (registrations: WorkflowPluginRegistration[]) => void
      list: () => string[]
      get: (typeId: string) => WorkflowDefinition | null
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
      registerMany: registerAgentPlugins,
      list: getAgentPluginNames,
      create: createPluginAgents,
      clear: () => {
        clearAgentPluginsForTest()
        resetAgentPluginBootstrapForTest()
        ensureAgentPluginsBootstrapped()
      },
    },
  },
  workflow: {
    get: getWorkflowDefinition,
    list: getAvailableWorkflows,
    plugins: {
      register: registerWorkflowPlugin,
      registerMany: registerWorkflowPlugins,
      list: getAvailableWorkflowPlugins,
      get: getWorkflowPluginDefinition,
      clear: () => {
        clearWorkflowPluginsForTest()
        resetWorkflowPluginBootstrapForTest()
        ensureWorkflowPluginsBootstrapped()
      },
    },
  },
}

ensureAgentPluginsBootstrapped()
ensureWorkflowPluginsBootstrapped()
