import type { AgentConfig } from '../agents/types'
import type { WorkflowDefinition } from '../workflows/core/types'
import type { AgentPluginFactory, AgentPluginRegistration, WorkflowPluginRegistration } from './contracts'
export * from './contracts'

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

export type { ToolContext } from '../workflows/core/toolTypes'
export { convertWorkflowToolsToOpenCode } from '../workflows/integrations/opencode'
export { createHyperAgent } from '../agents/Hyper'
export { workflowService } from '../workflows/core/service'
export { createAgentTransformer } from '../transform/opencode/agent-transform'
export { createUsingHyperDesignerTransformer } from '../transform/opencode/using-hyperdesigner-transform'
export { createTransformHooks } from '../transform/opencode/hooks'
export { createWorkflowHooks } from '../workflows/integrations/opencode'
export { createDocumentReviewTools } from '../tools/integrations/opencode'
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
      register: (factory: () => WorkflowDefinition) => void
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
