import { describe, it, expect } from 'vitest'
import type { WorkflowDefinition } from '../../../workflows/core/types'
import { getWorkflowDefinition, getAvailableWorkflows } from '../../../workflows/core/registry'

describe('WorkflowDefinition', () => {
  it('can be constructed with valid data', () => {
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      stageOrder: ['stage1', 'stage2'],
      stages: {
        stage1: {
          name: 'Stage 1',
          description: 'First stage',
          agent: 'test-agent',
          promptFile: 'stage1.md',
          getHandoverPrompt: (current) => `Handover from ${current ?? 'start'} to stage1`
        },
        stage2: {
          name: 'Stage 2',
          description: 'Second stage',
          agent: 'test-agent',
          promptFile: 'stage2.md',
          getHandoverPrompt: (current) => `Handover from ${current ?? 'stage1'} to stage2`
        }
      }
    }

    expect(workflow.id).toBe('test-workflow')
    expect(workflow.stageOrder).toEqual(['stage1', 'stage2'])
    expect(Object.keys(workflow.stages)).toHaveLength(2)
  })
})

describe('getWorkflowDefinition', () => {
  it('returns null for nonexistent workflow', () => {
    const result = getWorkflowDefinition('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getAvailableWorkflows', () => {
  it('returns string array with registered workflows', () => {
    const result = getAvailableWorkflows()
    expect(Array.isArray(result)).toBe(true)
    expect(result.every(item => typeof item === 'string')).toBe(true)
    expect(result).toContain('classic')
  })
})
