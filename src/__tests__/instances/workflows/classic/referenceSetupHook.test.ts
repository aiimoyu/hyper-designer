import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as referenceSetupHookModule from '../../../../builtin/workflows/classic/hooks/referenceSetupHook'

import { createReferenceSetupHook, referenceSetupHook } from '../../../../builtin/workflows/classic/hooks/referenceSetupHook'
import { createMockAdapter } from '../../../helpers/mockAdapter'
import { HyperDesignerLogger } from '../../../../utils/logger'
import type { WorkflowDefinition } from '../../../../workflows/types'

const stubWorkflow: WorkflowDefinition = {
  id: 'test',
  name: 'Test Workflow',
  description: 'For testing',
  entryStageId: 'stage1',
  stages: {
    stage1: {
      stageId: 'stage1',
      name: 'Stage 1',
      description: 'Test stage',
      agent: 'TestAgent',
      getHandoverPrompt: () => 'handover',
    },
  },
}

describe('referenceSetupHook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(referenceSetupHookModule.referenceFs, 'referencePathExists').mockReturnValue(false)
    vi.spyOn(referenceSetupHookModule.referenceFs, 'writeReferenceFile').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('missing adapter or sessionID', () => {
    it('should return early and log warning when adapter is undefined', async () => {
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')
      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'ReferenceSetupHook',
        expect.stringContaining('缺少 adapter 或 sessionID'),
        expect.objectContaining({ stageKey: 'IRAnalysis' }),
      )
    })

    it('should return early and log warning when sessionID is undefined', async () => {
      const warnSpy = vi.spyOn(HyperDesignerLogger, 'warn')
      const adapter = createMockAdapter()
      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        adapter,
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'ReferenceSetupHook',
        expect.stringContaining('缺少 adapter 或 sessionID'),
        expect.objectContaining({ stageKey: 'IRAnalysis' }),
      )
      expect(adapter.sendPrompt).not.toHaveBeenCalled()
    })
  })

  describe('REFERENCE.md file creation', () => {
    it('should create REFERENCE.md when file does not exist', async () => {
      const adapter = createMockAdapter()
      const infoSpy = vi.spyOn(HyperDesignerLogger, 'info')
      vi.mocked(referenceSetupHookModule.referenceFs.referencePathExists).mockReturnValue(false)

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(referenceSetupHookModule.referenceFs.writeReferenceFile).toHaveBeenCalledTimes(1)
      expect(referenceSetupHookModule.referenceFs.writeReferenceFile).toHaveBeenCalledWith(
        expect.stringContaining('REFERENCE.md'),
        expect.stringContaining('# 参考资料清单'),
      )
      expect(infoSpy).toHaveBeenCalledWith(
        'ReferenceSetupHook',
        '已创建参考资料清单文件',
        expect.objectContaining({ stageKey: 'IRAnalysis' }),
      )
    })

    it('should skip file creation when REFERENCE.md already exists', async () => {
      const adapter = createMockAdapter()
      const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')
      vi.mocked(referenceSetupHookModule.referenceFs.referencePathExists).mockReturnValue(true)

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(referenceSetupHookModule.referenceFs.writeReferenceFile).not.toHaveBeenCalled()
      expect(debugSpy).toHaveBeenCalledWith(
        'ReferenceSetupHook',
        '参考资料清单文件已存在，跳过创建',
        expect.objectContaining({ stageKey: 'IRAnalysis' }),
      )
    })
  })

  describe('sendPrompt call', () => {
    it('should call sendPrompt with correct agent and session', async () => {
      const adapter = createMockAdapter()

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      expect(adapter.sendPrompt).toHaveBeenCalledTimes(1)
      expect(adapter.sendPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          agent: 'Hyper',
        }),
      )
    })

    it('should use system prompt for detailed instructions', async () => {
      const adapter = createMockAdapter()

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const callArgs = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const system = callArgs.system as string

      // 验证功能：系统提示词包含必要的操作指引
      expect(system).toBeDefined()
      expect(system).toContain('REFERENCE.md')
      expect(system).toContain('HD_TOOL_ASK_USER')
      expect(system).toContain('已完成，进入下一步')
      expect(system).toContain('参考资料填写完毕，进入下一步。')
    })

    it('should use simple user prompt for confirmation request', async () => {
      const adapter = createMockAdapter()

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const callArgs = (adapter.sendPrompt as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const text = callArgs.text as string

      expect(text).toContain('确认')
      expect(text).toContain('参考资料填写')
      expect(text.length).toBeLessThan(100)
    })
  })

  describe('pre-created instance', () => {
    it('should export a pre-created referenceSetupHook instance', () => {
      expect(referenceSetupHook).toBeDefined()
      expect(typeof referenceSetupHook).toBe('function')
    })
  })

  describe('REFERENCE.md template content', () => {
    it('should include all required sections in the template', async () => {
      const adapter = createMockAdapter()
      vi.mocked(referenceSetupHookModule.referenceFs.referencePathExists).mockReturnValue(false)

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const writtenContent = vi.mocked(referenceSetupHookModule.referenceFs.writeReferenceFile).mock.calls[0][1] as string

      expect(writtenContent).toContain('## 1. Codebase (代码库)')
      expect(writtenContent).toContain('## 2. Domain Analysis Materials (领域分析资料)')
      expect(writtenContent).toContain('## 3. System Requirement Analysis Materials (系统需求分析资料)')
      expect(writtenContent).toContain('## 4. System Design Materials (系统设计资料)')
    })

    it('should include subcategory rows in tables', async () => {
      const adapter = createMockAdapter()
      vi.mocked(referenceSetupHookModule.referenceFs.referencePathExists).mockReturnValue(false)

      const hook = createReferenceSetupHook()

      await hook({
        stageKey: 'IRAnalysis',
        stageName: 'Initial Requirement Analysis',
        workflow: stubWorkflow,
        sessionID: 'test-session',
        adapter,
      })

      const writtenContent = vi.mocked(referenceSetupHookModule.referenceFs.writeReferenceFile).mock.calls[0][1] as string

      expect(writtenContent).toContain('Project Code (本项目代码)')
      expect(writtenContent).toContain('Reference Code (参考项目代码)')
      expect(writtenContent).toContain('Domain Architecture Analysis (领域架构分析)')
      expect(writtenContent).toContain('Scenario Library (场景库)')
      expect(writtenContent).toContain('FMEA Library (FMEA库)')
      expect(writtenContent).toContain('System Design Specification (系统设计说明书)')
      expect(writtenContent).toContain('Module Design Specification (模块功能设计说明书)')
    })
  })
})
