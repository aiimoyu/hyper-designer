import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearHook } from '../../../workflows/stageHooks/clearHook'
import { createMockAdapter } from '../../helpers/mockAdapter'
import { HyperDesignerLogger } from '../../../utils/logger'
import type { StageHookFn } from '../../../workflows/types'
import type { WorkflowDefinition } from '../../../workflows/types'

const stubWorkflow: WorkflowDefinition = {
  id: 'test',
  name: 'Test Workflow',
  description: 'stub for clearHook tests',
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

describe('clearHook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('matches StageHookFn signature', () => {
    const hookFn: StageHookFn = clearHook
    expect(hookFn).toBe(clearHook)
  })

  it('calls adapter.clearSession with the given sessionID', async () => {
    const adapter = createMockAdapter()

    await clearHook({
      stageKey: 'testStage',
      stageName: 'Test Stage',
      workflow: stubWorkflow,
      sessionID: 'ses-abc-123',
      adapter,
    })

    expect(adapter.clearSession).toHaveBeenCalledOnce()
    expect(adapter.clearSession).toHaveBeenCalledWith('ses-abc-123')
  })

  it('logs info before clearing context', async () => {
    const infoSpy = vi.spyOn(HyperDesignerLogger, 'info')
    const adapter = createMockAdapter()

    await clearHook({
      stageKey: 'IRAnalysis',
      stageName: 'Initial Requirement Analysis',
      workflow: stubWorkflow,
      sessionID: 'ses-xyz',
      adapter,
    })

    expect(infoSpy).toHaveBeenCalledWith(
      'ClassicHooks',
      expect.stringContaining('清空'),
      expect.objectContaining({ stageKey: 'IRAnalysis', stageName: 'Initial Requirement Analysis' }),
    )
  })

  it('skips when adapter is undefined', async () => {
    const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')

    await clearHook({
      stageKey: 'testStage',
      stageName: 'Test Stage',
      workflow: stubWorkflow,
      sessionID: 'ses-123',
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

    await clearHook({
      stageKey: 'testStage',
      stageName: 'Test Stage',
      workflow: stubWorkflow,
      adapter,
    })

    expect(debugSpy).toHaveBeenCalledOnce()
    expect(adapter.clearSession).not.toHaveBeenCalled()
  })

  it('propagates error when adapter.clearSession throws', async () => {
    const adapter = createMockAdapter({
      clearSession: vi.fn().mockRejectedValue(new Error('create session failed')),
    })

    await expect(
      clearHook({
        stageKey: 'testStage',
        stageName: 'Test Stage',
        workflow: stubWorkflow,
        sessionID: 'ses-err',
        adapter,
      }),
    ).rejects.toThrow('create session failed')
  })
})
