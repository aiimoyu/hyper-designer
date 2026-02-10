import { describe, it, expect } from 'vitest'
import type { WorkflowDefinition } from '../../workflows/types'
import { getWorkflowDefinition, getAvailableWorkflows } from '../../workflows/registry'

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
          skill: 'test-skill',
          promptFile: 'stage1.md',
          getHandoverPrompt: (current, next) => `Handover from ${current} to ${next}`
        },
        stage2: {
          name: 'Stage 2',
          description: 'Second stage',
          agent: 'test-agent',
          promptFile: 'stage2.md',
          getHandoverPrompt: (current, next) => `Handover from ${current} to ${next}`
        }
      }
    }

    expect(workflow.id).toBe('test-workflow')
    expect(workflow.stageOrder).toEqual(['stage1', 'stage2'])
    expect(Object.keys(workflow.stages)).toHaveLength(2)
  })
})

describe('getWorkflowDefinition', () => {
  it('throws Error for nonexistent workflow', () => {
    expect(() => getWorkflowDefinition('nonexistent')).toThrow(Error)
  })

  it('error message includes available workflows list', () => {
    expect(() => getWorkflowDefinition('nonexistent')).toThrow('Unknown workflow: nonexistent. Available: ')
  })
})

describe('getAvailableWorkflows', () => {
  it('returns string array (empty for now)', () => {
    const result = getAvailableWorkflows()
    expect(Array.isArray(result)).toBe(true)
    expect(result.every(item => typeof item === 'string')).toBe(true)
    expect(result).toEqual([])
  })
})