import type { WorkflowPlatformAdapter } from '../workflows/core/types'

export interface ToolParamSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  optional?: boolean
  properties?: Record<string, ToolParamSchema>
  items?: ToolParamSchema
  enum?: string[]
}

export type ToolParamsSchema = Record<string, ToolParamSchema>

export interface ToolContext {
  workflowId: string
  currentStage: string | null
  state: Record<string, unknown> | null
  adapter?: WorkflowPlatformAdapter
}

export interface ToolDefinition {
  name: string
  description: string
  params: ToolParamsSchema
  execute: (params: Record<string, unknown>, ctx: ToolContext) => Promise<string>
  scope?: 'global' | 'workflow' | 'stage'
  stages?: string[]
}

export interface ToolRegistration {
  name: string
  description: string
  params: ToolParamsSchema
  handler: (params: Record<string, unknown>) => Promise<string>
}
