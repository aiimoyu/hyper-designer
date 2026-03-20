import type { PlatformAdapter, SendPromptParams, SendPromptResult } from '../../adapters/types'

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
