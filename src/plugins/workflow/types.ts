import type { WorkflowDefinition } from '../../workflows/core/types'

export type WorkflowPluginFactory = () => WorkflowDefinition

export interface WorkflowPluginRegistration {
  name: string
  factory: WorkflowPluginFactory
}
