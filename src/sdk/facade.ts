import type {
  AgentConfig,
  AgentPluginFactory,
  ToolDefinition,
  ToolPluginFactory,
  WorkflowDefinition,
  WorkflowPluginFactory,
} from '../types'
import {
  registerAgent,
  getAgentNames,
  createAgents,
  clearAgentsForTest,
  registerWorkflow,
  getWorkflowNames,
  getWorkflow,
  clearWorkflowsForTest,
  registerTool,
  getToolNames,
  createTools,
  clearToolsForTest,
} from '../plugin/registry'
import { workflowService } from '../workflows/service'
import { HyperDesignerLogger } from '../utils/logger'

export interface SDK {
  agent: {
    create: (model?: string) => Promise<Record<string, AgentConfig>>
    isKnown: (name: string | undefined) => boolean
    plugins: {
      register: (name: string, factory: AgentPluginFactory) => void
      list: () => string[]
      create: (model?: string) => Promise<Record<string, AgentConfig>>
      clear: () => void
    }
  }
  workflow: {
    get: (id: string) => WorkflowDefinition | null
    list: () => string[]
    plugins: {
      register: (factory: WorkflowPluginFactory) => void
      list: () => string[]
      get: (id: string) => WorkflowDefinition | null
      clear: () => void
    }
  }
  tool: {
    plugins: {
      register: (name: string, factory: ToolPluginFactory) => void
      list: () => string[]
      getAll: () => Promise<ToolDefinition[]>
      clear: () => void
    }
  }
}

export const sdk: SDK = {
  agent: {
    create: createAgents,
    isKnown: (name) => name ? getAgentNames().includes(name) : false,
    plugins: {
      register: registerAgent,
      list: getAgentNames,
      create: createAgents,
      clear: clearAgentsForTest,
    },
  },
  workflow: {
    get: getWorkflow,
    list: getWorkflowNames,
    plugins: {
      register: registerWorkflow,
      list: getWorkflowNames,
      get: getWorkflow,
      clear: clearWorkflowsForTest,
    },
  },
  tool: {
    plugins: {
      register: registerTool,
      list: getToolNames,
      getAll: createTools,
      clear: clearToolsForTest,
    },
  },
}

export { workflowService, HyperDesignerLogger }
