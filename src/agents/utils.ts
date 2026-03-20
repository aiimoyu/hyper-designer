import type { AgentConfig } from './types'

import {
  createPluginAgents,
  getAgentPluginNames,
} from './pluginRegistry'
import {
  BUILTIN_AGENT_PLUGINS,
} from '../builtin/agents'

const BUILTIN_AGENT_NAME_SET = new Set(BUILTIN_AGENT_PLUGINS.map(item => item.name))

type BuiltinPluginName = typeof BUILTIN_AGENT_PLUGINS[number]['name']

export const BUILTIN_AGENT_FACTORIES = Object.fromEntries(
  BUILTIN_AGENT_PLUGINS.map(item => [item.name, item.factory]),
) as Record<BuiltinPluginName, (model?: string) => AgentConfig>

export const HD_BUILTIN_AGENT_NAMES = Object.keys(BUILTIN_AGENT_FACTORIES) as BuiltinPluginName[]

export type HDBuiltinAgentName = BuiltinPluginName

export async function createBuiltinAgents(model?: string): Promise<Record<string, AgentConfig>> {
  const agents = await createPluginAgents(model)
  const result: Record<string, AgentConfig> = {}
  for (const [name, config] of Object.entries(agents)) {
    if (BUILTIN_AGENT_NAME_SET.has(name)) {
      result[name] = config
    }
  }
  return result
}

export async function createAllAgents(model?: string): Promise<Record<string, AgentConfig>> {
  return createPluginAgents(model)
}

export function isHDBuiltinAgent(agentName: string | undefined): boolean {
  if (agentName === undefined) {
    return false
  }
  return BUILTIN_AGENT_NAME_SET.has(agentName)
}

export function isHDPluginAgent(agentName: string | undefined): boolean {
  if (agentName === undefined) {
    return false
  }
  return getAgentPluginNames().includes(agentName)
}

export function isHDAgent(agentName: string | undefined): boolean {
  if (agentName === undefined) {
    return false
  }
  if (agentName === 'Hyper') {
    return true
  }
  return isHDBuiltinAgent(agentName) || isHDPluginAgent(agentName)
}
