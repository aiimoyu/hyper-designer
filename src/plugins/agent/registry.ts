import type { AgentConfig } from '../../agents/types'

import type { AgentPluginFactory, AgentPluginRegistration } from './types'
import { ensureAgentPluginsBootstrapped } from './bootstrap'

const pluginAgentRegistry = new Map<string, AgentPluginFactory>()

export function registerAgentPlugin(name: string, factory: AgentPluginFactory): void {
  pluginAgentRegistry.set(name, factory)
}

export function registerAgentPlugins(registrations: AgentPluginRegistration[]): void {
  for (const item of registrations) {
    registerAgentPlugin(item.name, item.factory)
  }
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
