import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHCollectorHook } from '../../../workflows/core/stageHooks/hCollectorHook'
import type { HCollectorHookOptions, CollectionDomain } from '../../../workflows/core/stageHooks/hCollectorHook'
import { createMockAdapter } from '../../helpers/mockAdapter'
import { HyperDesignerLogger } from '../../../utils/logger'
import type { WorkflowDefinition } from '../../../workflows/core/types'

// Mock fs.existsSync to control file existence checks
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
  }
})

import { existsSync } from 'fs'

const mockedExistsSync = vi.mocked(existsSync)

/** Minimal workflow definition for hook context */
const stubWorkflow: WorkflowDefinition = {
  id: 'test',
  name: 'Test Workflow',
  description: 'For testing',
  stageOrder: ['stage1'],
  stages: {
    stage1: {
      name: 'Stage 1',
      description: 'Test stage',
      agent: 'TestAgent',
      getHandoverPrompt: () => 'handover',
    },
  },
}

describe('hCollectorHook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Re-apply the mock since restoreAllMocks clears it
    mockedExistsSync.mockReturnValue(false)
  })

  describe('missing adapter or sessionID', () => {
    it('should return early and log warning when adapter is undefined', async () => {
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')
      const options: HCollectorHookOptions = { domains: ['codebase'] }
      const hook = createHCollectorHook(options)

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        expect.stringContaining('缺少 adapter 或 sessionID'),
        expect.objectContaining({ stageKey: 'stage1', domains: ['codebase'] }),
      )
    })

    it('should return early and log warning when sessionID is undefined', async () => {
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')
      const adapter = createMockAdapter()
      const options: HCollectorHookOptions = { domains: ['domainAnalysis'] }
      const hook = createHCollectorHook(options)

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        adapter,
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        expect.stringContaining('缺少 adapter 或 sessionID'),
        expect.objectContaining({ domains: ['domainAnalysis'] }),
      )
      expect(adapter.sendPrompt).not.toHaveBeenCalled()
    })
  })

  describe('happy path - files already completed', () => {
    it('should return immediately when all domain completed files exist', async () => {
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(true)

      const options: HCollectorHookOptions = { domains: ['codebase'] }
      const hook = createHCollectorHook(options)

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(adapter.sendPrompt).not.toHaveBeenCalled()
      expect(debugSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '资料收集已完成',
        expect.objectContaining({ stageKey: 'stage1', attempt: 0 }),
      )
    })

    it('should handle multiple domains all completed', async () => {
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(true)

      const domains: CollectionDomain[] = ['codebase', 'domainAnalysis', 'systemDesign']
      const hook = createHCollectorHook({ domains })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(adapter.sendPrompt).not.toHaveBeenCalled()
    })
  })

  describe('collection flow - sendPrompt calls', () => {
    it('should call adapter.sendPrompt with correct params on first attempt', async () => {
      const adapter = createMockAdapter()
      const infoSpy = vi.spyOn(HyperDesignerLogger, 'info')

      // Not completed before call, completed after first call
      let callCount = 0
      mockedExistsSync.mockImplementation(() => {
        // First call in loop (allCompleted check) returns false
        // After sendPrompt, second iteration check returns true
        callCount++
        // existsSync called: attempt 0 allCompleted(1), incompleteDomains(1), attempt 1 allCompleted(1) = true
        return callCount > 2
      })

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(adapter.sendPrompt).toHaveBeenCalledTimes(1)
      expect(adapter.sendPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          agent: 'HCollector',
        }),
      )
      expect(infoSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '调用 HCollector 收集资料',
        expect.objectContaining({ attempt: 0 }),
      )
    })

    it('should include domain labels and output requirements in first attempt text', async () => {
      const adapter = createMockAdapter()

      // Never completed — will exhaust retries
      mockedExistsSync.mockReturnValue(false)

      const hook = createHCollectorHook({ domains: ['codebase', 'domainAnalysis'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      // First call should have first-attempt text
      const firstCallText = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0].text as string
      expect(firstCallText).toContain('## Task Directive')
      expect(firstCallText).toContain('代码库')
      expect(firstCallText).toContain('领域分析')
      expect(firstCallText).toContain('[domain: codebase]')
      expect(firstCallText).toContain('[domain: domainAnalysis]')
      expect(firstCallText).toContain('## Output Requirements')
      expect(firstCallText).toContain('## Constraint Reminders')
    })

    it('should include retry text on subsequent attempts', async () => {
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(false)

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      // Second call (attempt=1) should have retry text
      expect(adapter.sendPrompt).toHaveBeenCalledTimes(5) // MAX_COLLECTION_RETRIES
      const secondCallText = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[1][0].text as string
      expect(secondCallText).toContain('Task Resumption Instruction (Retry #1)')
      expect(secondCallText).toContain('Resumption Execution Strategy')
      expect(secondCallText).not.toContain('## Output Requirements')
    })
  })

  describe('retry logic', () => {
    it('should retry up to MAX_COLLECTION_RETRIES (5) times when files never appear', async () => {
      const adapter = createMockAdapter()
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')
      mockedExistsSync.mockReturnValue(false)

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(adapter.sendPrompt).toHaveBeenCalledTimes(5)
      // Should warn about max retries exceeded
      expect(warnSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '达到最大重试次数，部分资料收集未完成',
        expect.objectContaining({
          maxRetries: 5,
          incompleteDomains: ['codebase'],
        }),
      )
    })

    it('should stop retrying when completed file appears mid-loop', async () => {
      const adapter = createMockAdapter()
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')

      // Track calls to determine when to "complete"
      let existsSyncCallCount = 0
      mockedExistsSync.mockImplementation(() => {
        existsSyncCallCount++
        // Each loop iteration calls existsSync twice for 1 domain:
        //   1. allCompleted check (every)
        //   2. incompleteDomains check (filter)
        // After 2 sendPrompt calls (4 existsSync calls), start returning true
        return existsSyncCallCount > 4
      })

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      // Should have called sendPrompt only twice before completion detected
      expect(adapter.sendPrompt).toHaveBeenCalledTimes(2)
      expect(debugSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '资料收集已完成',
        expect.objectContaining({ stageKey: 'stage1' }),
      )
    })

    it('should only collect incomplete domains when some are already done', async () => {
      const adapter = createMockAdapter()

      // Simulate: codebase completed, domainAnalysis not completed
      mockedExistsSync.mockImplementation((path: unknown) => {
        const pathStr = String(path)
        if (pathStr.includes('/codebase/')) return true
        return false
      })

      const hook = createHCollectorHook({ domains: ['codebase', 'domainAnalysis'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      // First call text should only include domainAnalysis (the incomplete one)
      const firstCallText = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0].text as string
      expect(firstCallText).toContain('领域分析')
      expect(firstCallText).toContain('[domain: domainAnalysis]')
      // codebase should NOT be in the prompt since it's already completed
      expect(firstCallText).not.toContain('[domain: codebase]')
    })
  })

  describe('final completion check after loop', () => {
    it('should log success when files appear after max retries (final check passes)', async () => {
      const adapter = createMockAdapter()
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')

      let existsSyncCallCount = 0
      mockedExistsSync.mockImplementation(() => {
        existsSyncCallCount++
        // For 1 domain, each loop iteration: 2 calls (allCompleted + incompleteDomains)
        // 5 iterations × 2 = 10 calls in loop
        // Final check after loop = call 11
        // Return true only on call 11+ (after loop)
        return existsSyncCallCount > 10
      })

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(adapter.sendPrompt).toHaveBeenCalledTimes(5)
      expect(debugSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '资料收集已完成（最终检查通过）',
        expect.objectContaining({ stageKey: 'stage1' }),
      )
      // Should NOT have warned about max retries since final check passed
      expect(warnSpy).not.toHaveBeenCalledWith(
        'ClassicHooks',
        '达到最大重试次数，部分资料收集未完成',
        expect.anything(),
      )
    })

    it('should warn about incomplete domains when final check also fails', async () => {
      const adapter = createMockAdapter()
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')
      mockedExistsSync.mockReturnValue(false)

      const domains: CollectionDomain[] = ['codebase', 'systemDesign']
      const hook = createHCollectorHook({ domains })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '达到最大重试次数，部分资料收集未完成',
        expect.objectContaining({
          maxRetries: 5,
          incompleteDomains: ['codebase', 'systemDesign'],
        }),
      )
    })

    it('should report only still-incomplete domains in final warning', async () => {
      const adapter = createMockAdapter()
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')

      // systemDesign completes after loop but codebase never does
      let existsSyncCallCount = 0
      mockedExistsSync.mockImplementation((path: unknown) => {
        existsSyncCallCount++
        const pathStr = String(path)
        // After all 5 loop iterations, systemDesign completes but codebase doesn't
        if (pathStr.includes('/systemDesign/') && existsSyncCallCount > 15) return true
        return false
      })

      const hook = createHCollectorHook({ domains: ['codebase', 'systemDesign'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      // Final warning should only include codebase, not systemDesign
      expect(warnSpy).toHaveBeenCalledWith(
        'ClassicHooks',
        '达到最大重试次数，部分资料收集未完成',
        expect.objectContaining({
          incompleteDomains: ['codebase'],
        }),
      )
    })
  })

  describe('prompt text content', () => {
    it('should include all four domain labels in prompt', async () => {
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(false)

      const allDomains: CollectionDomain[] = ['codebase', 'domainAnalysis', 'systemRequirementAnalysis', 'systemDesign']
      const hook = createHCollectorHook({ domains: allDomains })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const text = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0].text as string
      expect(text).toContain('代码库')
      expect(text).toContain('领域分析')
      expect(text).toContain('系统需求分析')
      expect(text).toContain('系统设计')
    })

    it('should include correct output requirements per domain', async () => {
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(false)

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const text = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0].text as string
      expect(text).toContain('.hyper-designer/document/codebase/draft.md')
      expect(text).toContain('.hyper-designer/document/codebase/manifest.md')
      expect(text).toContain('.hyper-designer/document/codebase/completed')
    })

    it('should include retry number in resumption prompt', async () => {
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(false)

      const hook = createHCollectorHook({ domains: ['codebase'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      // Check attempt 2 (index 2, retry #2)
      const thirdCallText = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[2][0].text as string
      expect(thirdCallText).toContain('Retry #2')

      // Check attempt 4 (index 4, retry #4)
      const fifthCallText = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[4][0].text as string
      expect(fifthCallText).toContain('Retry #4')
    })

    it('should include constraint reminders with domain names', async () => {
      const adapter = createMockAdapter()
      mockedExistsSync.mockReturnValue(false)

      const hook = createHCollectorHook({ domains: ['codebase', 'domainAnalysis'] })

      await hook({
        stageKey: 'stage1',
        stageName: 'Stage 1',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const text = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0].text as string
      expect(text).toContain('`codebase`')
      expect(text).toContain('`domainAnalysis`')
      expect(text).toContain('Strictly prohibited from expanding to domains other than')
      expect(text).toContain('Strictly prohibited from writing any business code')
    })
  })
})
