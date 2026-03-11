import { describe, it, expect } from "vitest"
import type { WorkflowStageDefinition } from '../../../workflows/core/types'
import type { CurrentStageState, WorkflowState, WorkflowStage } from '../../../workflows/core/state/types'

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
        gateResult: null,
        handoverTo: null,
        failureCount: 3,
      }

      expect(currentStage.failureCount).toBe(3)
    })

    it('should work without failureCount', () => {
      const currentStage: CurrentStageState = {
        name: 'TestStage',
        gateResult: null,
        handoverTo: null,
      }

      expect(currentStage.failureCount).toBeUndefined()
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
})