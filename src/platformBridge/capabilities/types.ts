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

export interface CancelNotification {
  sessionId: string
}

export interface PlatformAdapter {
  createSession: (title: string) => Promise<string>
  sendPrompt: (params: SendPromptParams) => Promise<SendPromptResult>
  deleteSession: (sessionId: string) => Promise<void>
  summarizeSession: (sessionId: string) => Promise<void>
  clearSession: (sessionId: string) => Promise<string>
  cancelSession: (params: CancelNotification) => Promise<void>
  registerTools?: (tools: PlatformToolRegistration[]) => void
  unregisterTools?: (toolNames: string[]) => void
}

export interface NativePlatformCapabilities {
  createSession: (title: string) => Promise<string>
  sendPrompt: (params: SendPromptParams) => Promise<SendPromptResult>
  deleteSession: (sessionId: string) => Promise<void>
  summarizeSession: (sessionId: string) => Promise<void>
  cancelSession: (params: CancelNotification) => Promise<void>
}

export interface CompositePlatformCapabilities {
  clearSession: (sessionId: string) => Promise<string>
}

export interface PlatformCapabilities {
  native: NativePlatformCapabilities
  composite: CompositePlatformCapabilities
  toAdapter: () => PlatformAdapter
}
