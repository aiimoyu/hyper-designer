import { vi } from 'vitest'
import type { PlatformAdapter } from '../../platformBridge/capabilities/types'

/**
 * Creates a mock PlatformAdapter for unit testing.
 *
 * @param overrides - Optional partial overrides to customize specific methods
 * @returns A fully mocked PlatformAdapter with sensible defaults
 *
 * @example
 * // Use with default values
 * const mock = createMockAdapter()
 * const sessionId = await mock.createSession('test') // 'mock-session-id'
 *
 * @example
 * // Override specific method
 * const mock = createMockAdapter({
 *   createSession: vi.fn().mockResolvedValue('custom-id')
 * })
 */
export function createMockAdapter(
  overrides?: Partial<PlatformAdapter>
): PlatformAdapter {
  return {
    createSession: vi.fn().mockResolvedValue('mock-session-id'),
    sendPrompt: vi.fn().mockResolvedValue({
      text: '',
      structuredOutput: undefined
    }),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    summarizeSession: vi.fn().mockResolvedValue(undefined),
    clearSession: vi.fn().mockResolvedValue('mock-fresh-session-id'),
    cancelSession: vi.fn().mockResolvedValue(undefined),
    ...overrides
  }
}
