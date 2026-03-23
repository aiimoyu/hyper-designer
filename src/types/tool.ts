export interface ToolParamSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  optional?: boolean
  properties?: Record<string, ToolParamSchema>
  items?: ToolParamSchema
  enum?: string[]
}

export type ToolParamsSchema = Record<string, ToolParamSchema>

export interface ToolContextAdapter {
  sendPrompt: (params: { sessionId: string; agent: string; text: string; schema?: Record<string, unknown>; system?: string }) => Promise<{ structuredOutput?: unknown; text: string }>
  summarizeSession?: (sessionId: string) => Promise<void>
  clearSession?: (sessionId: string) => Promise<string>
  registerTools?: (tools: Array<{ name: string; description: string; params: Record<string, { type: string; description?: string; optional?: boolean }>; handler: (params: Record<string, unknown>) => Promise<string> }>) => void
}

export interface ToolContext {
  workflowId: string
  currentStage: string | null
  state: Record<string, unknown> | null
  adapter?: ToolContextAdapter
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
