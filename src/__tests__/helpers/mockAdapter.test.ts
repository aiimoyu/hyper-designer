import { describe, it, expect, vi } from 'vitest'
import { createMockAdapter } from './mockAdapter'

describe('createMockAdapter', () => {
  it('returns default mock with expected values', async () => {
    const mock = createMockAdapter()

    // Test createSession returns mock-session-id
    const sessionId = await mock.createSession('test-title')
    expect(sessionId).toBe('mock-session-id')

    // Test sendPrompt returns expected structure
    const promptResult = await mock.sendPrompt({
      sessionId: 'test-id',
      agent: 'test-agent',
      text: 'test prompt'
    })
    expect(promptResult.text).toBe('')
    expect(promptResult.structuredOutput).toBeUndefined()

    // Test deleteSession returns undefined
    const deleteResult = await mock.deleteSession('test-id')
    expect(deleteResult).toBeUndefined()

    // Test summarizeSession returns undefined
    const summarizeResult = await mock.summarizeSession('test-id')
    expect(summarizeResult).toBeUndefined()
  })

  it('allows overrides to replace specific methods', async () => {
    const customCreateSession = vi.fn().mockResolvedValue('custom-session-id')
    const mock = createMockAdapter({
      createSession: customCreateSession
    })

    const sessionId = await mock.createSession('override-test')
    expect(sessionId).toBe('custom-session-id')
    expect(customCreateSession).toHaveBeenCalledWith('override-test')
  })

  it('mock functions are callable and track calls with vi.fn()', async () => {
    const mock = createMockAdapter()

    // Verify all methods are vi.fn() functions
    expect(mock.createSession).toBeDefined()
    expect(typeof mock.createSession).toBe('function')
    expect(mock.sendPrompt).toBeDefined()
    expect(typeof mock.sendPrompt).toBe('function')
    expect(mock.deleteSession).toBeDefined()
    expect(typeof mock.deleteSession).toBe('function')
    expect(mock.summarizeSession).toBeDefined()
    expect(typeof mock.summarizeSession).toBe('function')

    // Verify vi.fn() tracking works
    await mock.createSession('track-calls')
    expect(mock.createSession).toHaveBeenCalledTimes(1)
    expect(mock.createSession).toHaveBeenCalledWith('track-calls')

    await mock.deleteSession('session-1')
    await mock.deleteSession('session-2')
    expect(mock.deleteSession).toHaveBeenCalledTimes(2)
  })
})
