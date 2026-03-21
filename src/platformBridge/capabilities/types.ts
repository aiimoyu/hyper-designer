export interface SendPromptParams {
  sessionId: string
  agent: string
  text: string
  schema?: Record<string, unknown>
  system?: string
}

export interface SendPromptResult {
  structuredOutput?: unknown
  text: string
}

export interface PlatformToolRegistration {
  name: string
  description: string
  params: Record<string, {
    type: string
    description?: string
    optional?: boolean
  }>
  handler: (params: Record<string, unknown>) => Promise<string>
}

export interface PlatformAdapter {
  createSession: (title: string) => Promise<string>
  sendPrompt: (params: SendPromptParams) => Promise<SendPromptResult>
  deleteSession: (sessionId: string) => Promise<void>
  summarizeSession: (sessionId: string) => Promise<void>
  clearSession: (sessionId: string) => Promise<string>
  registerTools?: (tools: PlatformToolRegistration[]) => void
  unregisterTools?: (toolNames: string[]) => void
}

export interface NativePlatformCapabilities {
  createSession: (title: string) => Promise<string>
  sendPrompt: (params: SendPromptParams) => Promise<SendPromptResult>
  deleteSession: (sessionId: string) => Promise<void>
  summarizeSession: (sessionId: string) => Promise<void>
}

export interface CompositePlatformCapabilities {
  clearSession: (sessionId: string) => Promise<string>
}

export interface PlatformCapabilities {
  native: NativePlatformCapabilities
  composite: CompositePlatformCapabilities
  toAdapter: () => PlatformAdapter
}
