import type { AgentConfig } from './types'
import type { AgentPluginFactory, AgentPluginRegistration } from '../sdk/contracts'

import { BUILTIN_AGENT_PLUGINS } from '../plugins/agent'
import { USER_AGENT_PLUGINS } from '../../plugins/agents'

const pluginAgentRegistry = new Map<string, AgentPluginFactory>()
let initialized = false

export type { AgentPluginFactory, AgentPluginRegistration }

export function registerAgentPlugin(name: string, factory: AgentPluginFactory): void {
  pluginAgentRegistry.set(name, factory)
}

export function registerAgentPlugins(registrations: AgentPluginRegistration[]): void {
  for (const item of registrations) {
    registerAgentPlugin(item.name, item.factory)
  }
}

export function ensureAgentPluginsBootstrapped(): void {
  if (initialized) {
    return
  }

  registerAgentPlugins(BUILTIN_AGENT_PLUGINS)
  registerAgentPlugins(USER_AGENT_PLUGINS)
  initialized = true
}

export function resetAgentPluginBootstrapForTest(): void {
  initialized = false
}

export function getAgentPluginNames(): string[] {
  ensureAgentPluginsBootstrapped()
  return Array.from(pluginAgentRegistry.keys())
}

export async function createPluginAgents(model?: string): Promise<Record<string, AgentConfig>> {
  ensureAgentPluginsBootstrapped()
  const result: Record<string, AgentConfig> = {}

  for (const [name, factory] of pluginAgentRegistry.entries()) {
    result[name] = await factory(model)
  }

  return result
}

export function clearAgentPluginsForTest(): void {
  pluginAgentRegistry.clear()
}
