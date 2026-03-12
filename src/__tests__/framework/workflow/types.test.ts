import { describe, it, expect } from "vitest"
import type { WorkflowStageDefinition } from '../../../workflows/core/types'
import type {
  CurrentStageState,
  WorkflowState,
  WorkflowStage,
  StageMilestone,
  GateMilestoneDetail,
} from '../../../workflows/core/state/types'

describe('workflow type definitions', () => {
  describe('WorkflowStageDefinition', () => {
    it('should have required field', () => {
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        required: true,
      }

      expect(stage.required).toBe(true)
    })

    it('should have inputs field with required boolean', () => {
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        inputs: {
          input1: { required: true },
          input2: { required: false },
        },
      }

      expect(stage.inputs?.input1.required).toBe(true)
      expect(stage.inputs?.input2.required).toBe(false)
    })

    it('should have outputs field with path and description', () => {
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        outputs: {
          output1: { path: 'path/to/output1', description: 'First output' },
          output2: { path: 'path/to/output2' },
        },
      }

      expect(stage.outputs?.output1.path).toBe('path/to/output1')
      expect(stage.outputs?.output1.description).toBe('First output')
      expect(stage.outputs?.output2.path).toBe('path/to/output2')
      expect(stage.outputs?.output2.description).toBeUndefined()
    })

    it('should work without optional fields', () => {
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
      }

      expect(stage.required).toBeUndefined()
      expect(stage.inputs).toBeUndefined()
      expect(stage.outputs).toBeUndefined()
    })
  })

  describe('CurrentStageState', () => {
    it('should have failureCount field', () => {
      const currentStage: CurrentStageState = {
        name: 'TestStage',
        handoverTo: null,
        failureCount: 3,
      }

      expect(currentStage.failureCount).toBe(3)
    })

    it('should work without failureCount', () => {
      const currentStage: CurrentStageState = {
        name: 'TestStage',
        handoverTo: null,
      }

      expect(currentStage.failureCount).toBeUndefined()
    })

    it('should NOT have gateResult field', () => {
      const currentStage: CurrentStageState = {
        name: 'TestStage',
        handoverTo: null,
      }

      // gateResult should not exist on CurrentStageState
      expect((currentStage as any).gateResult).toBeUndefined()
    })
  })

  describe('WorkflowStage', () => {
    it('should have selected field', () => {
      const stage: WorkflowStage = {
        isCompleted: false,
        selected: true,
      }

      expect(stage.selected).toBe(true)
    })

    it('should work without selected', () => {
      const stage: WorkflowStage = {
        isCompleted: false,
      }

      expect(stage.selected).toBeUndefined()
    })

    it('should have stageMilestones field', () => {
      const stage: WorkflowStage = {
        isCompleted: false,
        stageMilestones: {
          gate: {
            type: 'gate',
            timestamp: '2026-03-12T10:00:00Z',
            isCompleted: true,
            detail: { score: 85, comment: 'Good quality' },
          },
        },
      }

      expect(stage.stageMilestones).toBeDefined()
      expect(stage.stageMilestones?.gate).toBeDefined()
      expect(stage.stageMilestones?.gate.type).toBe('gate')
    })

    it('should have previousStage and nextStage fields', () => {
      const stage: WorkflowStage = {
        isCompleted: false,
        previousStage: 'IRAnalysis',
        nextStage: 'ScenarioAnalysis',
      }

      expect(stage.previousStage).toBe('IRAnalysis')
      expect(stage.nextStage).toBe('ScenarioAnalysis')
    })

    it('should allow null for previousStage and next', () => {
      const stage: WorkflowStage = {
        isCompleted: false,
        previousStage: null,
        nextStage: null,
      }

      expect(stage.previousStage).toBeNull()
      expect(stage.nextStage).toBeNull()
    })

    it('should NOT have score or comment fields', () => {
      const stage: WorkflowStage = {
        isCompleted: false,
      }

      // @ts-expect-error - score should not exist
      expect(stage.score).toBeUndefined()
      // @ts-expect-error - comment should not exist
      expect(stage.comment).toBeUndefined()
    })
  })

  describe('WorkflowState', () => {
    it('should have initialized and typeId fields', () => {
      const state: WorkflowState = {
        initialized: true,
        typeId: 'test-workflow',
        workflow: {},
        current: null,
      }

      expect(state.initialized).toBe(true)
      expect(state.typeId).toBe('test-workflow')
    })

    it('should support uninitialized state', () => {
      const state: WorkflowState = {
        initialized: false,
        typeId: null,
        workflow: {},
        current: null,
      }

      expect(state.initialized).toBe(false)
      expect(state.typeId).toBeNull()
    })

    it('should have workflow stages with selected field', () => {
      const state: WorkflowState = {
        initialized: true,
        typeId: 'test-workflow',
        workflow: {
          stage1: { isCompleted: false, selected: true },
          stage2: { isCompleted: false, selected: false },
        },
        current: null,
      }

      expect(state.workflow.stage1?.selected).toBe(true)
      expect(state.workflow.stage2?.selected).toBe(false)
    })
  })

  describe('Milestone types', () => {
    describe('StageMilestone', () => {
      it('should have type, timestamp, and detail fields', () => {
        const milestone: StageMilestone = {
          type: 'gate',
          timestamp: '2026-03-12T10:00:00Z',
          isCompleted: true,
          detail: { score: 90 },
        }

        expect(milestone.type).toBe('gate')
        expect(milestone.timestamp).toBe('2026-03-12T10:00:00Z')
        expect(milestone.detail).toBeDefined()
      })
    })

    describe('GateMilestoneDetail', () => {
      it('should have score and optional comment fields', () => {
        const detail: GateMilestoneDetail = {
          score: 85,
          comment: 'Excellent work',
        }

        expect(detail.score).toBe(85)
        expect(detail.comment).toBe('Excellent work')
      })

      it('should allow null score', () => {
        const detail: GateMilestoneDetail = {
          score: null,
        }

        expect(detail.score).toBeNull()
      })

      it('should allow null comment', () => {
        const detail: GateMilestoneDetail = {
          score: 75,
          comment: null,
        }

        expect(detail.comment).toBeNull()
      })
    })

  })
})
