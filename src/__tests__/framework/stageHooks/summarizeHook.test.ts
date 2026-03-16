import { describe, it, expect, vi, beforeEach } from 'vitest'
import { summarizeHook } from '../../../workflows/core/stageHooks/summarizeHook'
import { createMockAdapter } from '../../helpers/mockAdapter'
import { HyperDesignerLogger } from '../../../utils/logger'
import type { StageHookFn } from '../../../workflows/core/types'
import type { WorkflowDefinition } from '../../../workflows/core/types'

/** Minimal workflow definition for StageHookFn context */
const stubWorkflow: WorkflowDefinition = {
  id: 'test',
  name: 'Test Workflow',
  description: 'stub for summarizeHook tests',
  entryStageId: 'testStage',
  stages: {
    testStage: {
      stageId: 'testStage',
      name: 'Test Stage',
      description: 'stub stage',
      agent: 'TestAgent',
      getHandoverPrompt: () => 'stub',
    },
  },
}

describe('summarizeHook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('matches StageHookFn signature', () => {
    // Type-level check: assigning summarizeHook to StageHookFn should compile
    const hookFn: StageHookFn = summarizeHook
    expect(hookFn).toBe(summarizeHook)
  })

  describe('happy path', () => {
    it('calls adapter.summarizeSession with the given sessionID', async () => {
      const adapter = createMockAdapter()

      await summarizeHook({
        stageKey: 'testStage',
        stageName: 'Test Stage',
        workflow: stubWorkflow,
        sessionID: 'ses-abc-123',
        adapter,
      })

      expect(adapter.summarizeSession).toHaveBeenCalledOnce()
      expect(adapter.summarizeSession).toHaveBeenCalledWith('ses-abc-123')
    })

    it('logs info before calling summarizeSession', async () => {
      const infoSpy = vi.spyOn(HyperDesignerLogger, 'info')
      const adapter = createMockAdapter()

      await summarizeHook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'ses-xyz',
        adapter,
      })

      expect(infoSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        expect.stringContaining('压缩'),
        expect.objectContaining({ stageKey: 'IRAnalysis', stageName: 'Initial Requirement Analysis' }),
      )
    })
  })

  describe('missing adapter or sessionID', () => {
    it('skips when adapter is undefined', async () => {
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')

      await summarizeHook({
        stageKey: 'testStage',
        stageName: 'Test Stage',
        workflow: stubWorkflow,
        sessionID: 'ses-123',
        // adapter omitted to test undefined-guard
      })

      expect(debugSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        expect.stringContaining('缺少'),
        expect.objectContaining({ stageKey: 'testStage' }),
      )
    })

    it('skips when sessionID is undefined', async () => {
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')
      const adapter = createMockAdapter()

      await summarizeHook({
        stageKey: 'testStage',
        stageName: 'Test Stage',
        workflow: stubWorkflow,
        // sessionID omitted to test undefined-guard
        adapter,
      })

      expect(debugSpy).toHaveBeenCalledOnce()
      expect(adapter.summarizeSession).not.toHaveBeenCalled()
    })

    it('skips when sessionID is empty string', async () => {
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')
      const adapter = createMockAdapter()

      await summarizeHook({
        stageKey: 'testStage',
        stageName: 'Test Stage',
        workflow: stubWorkflow,
        sessionID: '',
        adapter,
      })

      // empty string is falsy → guard triggers
      expect(debugSpy).toHaveBeenCalledOnce()
      expect(adapter.summarizeSession).not.toHaveBeenCalled()
    })

    it('skips when both adapter and sessionID are missing', async () => {
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')

      await summarizeHook({
        stageKey: 'testStage',
        stageName: 'Test Stage',
        workflow: stubWorkflow,
      })

      expect(debugSpy).toHaveBeenCalledOnce()
    })
  })

  describe('adapter error propagation', () => {
    it('propagates error when adapter.summarizeSession throws', async () => {
      const adapter = createMockAdapter({
        summarizeSession: vi.fn().mockRejectedValue(new Error('network failure')),
      })

      await expect(
        summarizeHook({
          stageKey: 'testStage',
          stageName: 'Test Stage',
          workflow: stubWorkflow,
          sessionID: 'ses-err',
          adapter,
        }),
      ).rejects.toThrow('network failure')
    })

    it('calls summarizeSession even when error will propagate', async () => {
      const summarizeFn = vi.fn().mockRejectedValue(new Error('timeout'))
      const adapter = createMockAdapter({ summarizeSession: summarizeFn })

      await expect(
        summarizeHook({
          stageKey: 'testStage',
          stageName: 'Test Stage',
          workflow: stubWorkflow,
          sessionID: 'ses-timeout',
          adapter,
        }),
      ).rejects.toThrow()

      expect(summarizeFn).toHaveBeenCalledWith('ses-timeout')
    })
  })
})
