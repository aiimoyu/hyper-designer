import type { ToolPluginFactory, ToolPluginRegistration } from '../sdk/contracts'
import type { ToolDefinition } from './types'

const pluginToolRegistry = new Map<string, ToolPluginFactory>()

export type { ToolPluginFactory, ToolPluginRegistration }

export function registerToolPlugin(name: string, factory: ToolPluginFactory): void {
  pluginToolRegistry.set(name, factory)
}

export function registerToolPlugins(registrations: ToolPluginRegistration[]): void {
  for (const item of registrations) {
    registerToolPlugin(item.name, item.factory)
  }
}

export function getToolPluginNames(): string[] {
  return Array.from(pluginToolRegistry.keys())
}

export async function createPluginTools(): Promise<ToolDefinition[]> {
  const result: ToolDefinition[] = []

  for (const factory of pluginToolRegistry.values()) {
    const tool = await factory()
    result.push(tool)
  }

  return result
}

export function clearToolPluginsForTest(): void {
  pluginToolRegistry.clear()
}
