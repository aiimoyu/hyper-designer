import type { WorkflowDefinition } from './types'
import type { WorkflowPluginFactory, WorkflowPluginRegistration } from '../../sdk/contracts'

import { HyperDesignerLogger } from '../../utils/logger'

const pluginWorkflowRegistry = new Map<string, WorkflowPluginFactory>()
let initialized = false

export type { WorkflowPluginFactory, WorkflowPluginRegistration }

export function registerWorkflowPlugin(factory: WorkflowPluginFactory): void {
  const definition = factory()
  if (!definition?.id) {
    HyperDesignerLogger.warn('Workflow', 'Workflow plugin factory must return a definition with an id', {
      action: 'registerWorkflowPlugin',
    })
    return
  }
  pluginWorkflowRegistry.set(definition.id, factory)
}

export function registerWorkflowPlugins(registrations: WorkflowPluginRegistration[]): void {
  for (const item of registrations) {
    registerWorkflowPlugin(item.factory)
  }
}

export function ensureWorkflowPluginsBootstrapped(): void {
  if (initialized) {
    return
  }

  if (pluginWorkflowRegistry.size > 0) {
    initialized = true
  }
}

export function resetWorkflowPluginBootstrapForTest(): void {
  initialized = false
}

export function getWorkflowPluginDefinition(typeId: string): WorkflowDefinition | null {
  ensureWorkflowPluginsBootstrapped()
  const factory = pluginWorkflowRegistry.get(typeId)
  if (!factory) {
    return null
  }
  return factory()
}

export function getAvailableWorkflowPlugins(): string[] {
  ensureWorkflowPluginsBootstrapped()
  return Array.from(pluginWorkflowRegistry.keys())
}

export function clearWorkflowPluginsForTest(): void {
  pluginWorkflowRegistry.clear()
}
