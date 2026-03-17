import type { WorkflowDefinition } from '../../workflows/core/types'

import type { WorkflowPluginRegistration } from './types'

const pluginWorkflowRegistry = new Map<string, () => WorkflowDefinition>()

export function registerWorkflowPlugin(name: string, factory: () => WorkflowDefinition): void {
  pluginWorkflowRegistry.set(name, factory)
}

export function registerWorkflowPlugins(registrations: WorkflowPluginRegistration[]): void {
  for (const item of registrations) {
    registerWorkflowPlugin(item.name, item.factory)
  }
}

export function getWorkflowPluginDefinition(typeId: string): WorkflowDefinition | null {
  const factory = pluginWorkflowRegistry.get(typeId)
  if (!factory) {
    return null
  }
  return factory()
}

export function getAvailableWorkflowPlugins(): string[] {
  return Array.from(pluginWorkflowRegistry.keys())
}

export function clearWorkflowPluginsForTest(): void {
  pluginWorkflowRegistry.clear()
}
