import { describe, it, expect } from "vitest"
import type { WorkflowStageDefinition, StageFileItem } from '../../../workflows/types'
import type {
  CurrentStageState,
  WorkflowState,
  WorkflowStage,
  StageMilestone,
  GateMilestoneDetail,
} from '../../../workflows/state/types'

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

    it('should have inputs field as StageFileItem array', () => {
      const inputs: StageFileItem[] = [
        { id: 'input1', path: './input1.md', type: 'file', description: 'First input' },
        { id: 'input2', path: './input2.md', type: 'file', description: 'Second input' },
      ]
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        inputs,
      }

      expect(stage.inputs?.length).toBe(2)
      expect(stage.inputs?.[0].id).toBe('input1')
      expect(stage.inputs?.[1].type).toBe('file')
    })

    it('should have outputs field as StageFileItem array', () => {
      const outputs: StageFileItem[] = [
        { id: 'output1', path: './output1.md', type: 'file', description: 'First output' },
        { id: 'output2', path: './output2.md', type: 'file', description: 'Second output' },
      ]
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        outputs,
      }

      expect(stage.outputs?.length).toBe(2)
      expect(stage.outputs?.[0].path).toBe('./output1.md')
      expect(stage.outputs?.[1].description).toBe('Second output')
    })

    it('should support pattern type for inputs and outputs', () => {
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        inputs: [
          { id: 'allDocs', path: './docs/*.md', type: 'pattern', description: 'All markdown docs' },
        ],
        outputs: [
          { id: 'allOutputs', path: './output/*.md', type: 'pattern', description: 'All output docs' },
        ],
      }

      expect(stage.inputs?.[0].type).toBe('pattern')
      expect(stage.outputs?.[0].type).toBe('pattern')
    })

    it('should support workflow-defined handover milestone requirements', () => {
      const stage: WorkflowStageDefinition = {
        name: 'Test Stage',
        description: 'Test description',
        agent: 'TestAgent',
        getHandoverPrompt: (from, to) => `${from} -> ${to}`,
        requiredMilestones: ['gate', 'doc_review'],
      }

      expect(stage.requiredMilestones).toEqual(['gate', 'doc_review'])
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

  describe('StageFileItem', () => {
    it('should have id, path, type, and description fields', () => {
      const item: StageFileItem = {
        id: 'test-doc',
        path: './docs/test.md',
        type: 'file',
        description: 'Test document',
      }

      expect(item.id).toBe('test-doc')
      expect(item.path).toBe('./docs/test.md')
      expect(item.type).toBe('file')
      expect(item.description).toBe('Test document')
    })

    it('should support optional content field', () => {
      const item: StageFileItem = {
        id: 'test-doc',
        path: './docs/test.md',
        type: 'file',
        description: 'Test document',
        content: 'This is the file content',
      }

      expect(item.content).toBe('This is the file content')
    })

    it('should support folder type', () => {
      const item: StageFileItem = {
        id: 'test-folder',
        path: './docs/',
        type: 'folder',
        description: 'Test folder',
      }

      expect(item.type).toBe('folder')
    })

    it('should support pattern type', () => {
      const item: StageFileItem = {
        id: 'all-md',
        path: './**/*.md',
        type: 'pattern',
        description: 'All markdown files',
      }

      expect(item.type).toBe('pattern')
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

      expect((currentStage as any).gateResult).toBeUndefined()
    })
  })

  describe('WorkflowStage', () => {
    it('should have selected field', () => {
      const stage: WorkflowStage = {
        mark: false,
        selected: true,
      }

      expect(stage.selected).toBe(true)
    })

    it('should work without selected', () => {
      const stage: WorkflowStage = {
        mark: false,
      }

      expect(stage.selected).toBeUndefined()
    })

    it('should not include legacy milestone map field on stage state', () => {
      const stage: WorkflowStage = {
        mark: false,
      }

      expect((stage as unknown as { legacyMilestones?: unknown }).legacyMilestones).toBeUndefined()
    })

    it('should have previousStage and nextStage fields', () => {
      const stage: WorkflowStage = {
        mark: false,
        previousStage: 'IRAnalysis',
        nextStage: 'ScenarioAnalysis',
      }

      expect(stage.previousStage).toBe('IRAnalysis')
      expect(stage.nextStage).toBe('ScenarioAnalysis')
    })

    it('should allow null for previousStage and next', () => {
      const stage: WorkflowStage = {
        mark: false,
        previousStage: null,
        nextStage: null,
      }

      expect(stage.previousStage).toBeNull()
      expect(stage.nextStage).toBeNull()
    })

    it('should NOT have score or comment fields', () => {
      const stage: WorkflowStage = {
        mark: false,
      }

      expect('score' in stage).toBe(false)
      expect('comment' in stage).toBe(false)
    })
  })

  describe('WorkflowState', () => {
    it('should have initialized and typeId fields', () => {
      const state: WorkflowState = {
        initialized: true,
        typeId: 'test-workflow',
        projectRoot: null,
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
        projectRoot: null,
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
        projectRoot: null,
        workflow: {
          stage1: { mark: false, selected: true },
          stage2: { mark: false, selected: false },
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
          name: 'Quality Gate',
          timestamp: '2026-03-12T10:00:00Z',
          mark: true,
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
