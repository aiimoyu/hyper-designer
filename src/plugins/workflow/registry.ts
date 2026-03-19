import type { WorkflowDefinition } from '../../workflows/core/types'

import type { WorkflowPluginRegistration } from './types'

const pluginWorkflowRegistry = new Map<string, () => WorkflowDefinition>()

export function registerWorkflowPlugin(factory: () => WorkflowDefinition): void {
  const definition = factory()
  if (!definition?.id) {
    console.warn('Workflow plugin factory must return a definition with an id')
    return
  }
  pluginWorkflowRegistry.set(definition.id, factory)
}

export function registerWorkflowPlugins(registrations: WorkflowPluginRegistration[]): void {
  for (const item of registrations) {
    registerWorkflowPlugin(item.factory)
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
