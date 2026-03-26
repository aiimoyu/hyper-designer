import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readWorkflowStateFile, writeWorkflowStateFile, getWorkflowStatePath } from '../../../workflows/state/persistence'
import { rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { dirname } from 'path'

const STATE_FILE = getWorkflowStatePath()

function findLatestNodeMilestone(
  state: ReturnType<typeof readWorkflowStateFile>,
  nodeId: string,
  key: string,
): { mark?: boolean; detail?: unknown } | undefined {
  const events = state?.history?.events ?? []
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i]
    if (event.type === 'milestone.set' && event.nodeId === nodeId && event.key === key) {
      return event.value as { mark?: boolean; detail?: unknown } | undefined
    }
  }
  return undefined
}

describe('workflow persistence migration', () => {
  beforeEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
    const dir = dirname(STATE_FILE)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  it('migrates legacy state without initialized - defaults to false when no typeId', () => {
    const legacyState = {
      workflow: {
        dataCollection: { mark: true }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        failureCount: 0
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(false)
    expect(state?.typeId).toBeNull()
  })

  it('migrates legacy state with typeId - sets initialized to true', () => {
    const legacyState = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: { mark: true }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        failureCount: 0
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.typeId).toBe('classic')
  })

  it('migrates legacy state without failureCount - defaults to 0', () => {
    const legacyState = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: { mark: true }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current?.failureCount).toBe(0)
  })

  it('migrates legacy selectedStages to workflow[].selected', () => {
    const legacyState = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        IRAnalysis: { mark: true },
        scenarioAnalysis: { mark: false },
        useCaseAnalysis: { mark: false }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        failureCount: 0
      },
      selectedStages: ['IRAnalysis', 'scenarioAnalysis']
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    // IRAnalysis and scenarioAnalysis are selected
    expect(state?.workflow.IRAnalysis?.selected).toBe(true)
    expect(state?.workflow.scenarioAnalysis?.selected).toBe(true)
    // useCaseAnalysis is NOT in selectedStages, so it should NOT be selected
    expect(state?.workflow.useCaseAnalysis?.selected).toBe(false)
  })

  it('preserves existing failureCount value', () => {
    const stateWithFailureCount = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: { mark: true }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        failureCount: 2
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(stateWithFailureCount, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current?.failureCount).toBe(2)
  })

  it('ignores legacy current.gateResult and per-stage score/comment fields', () => {
    const legacyState = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        IRAnalysis: {
          mark: false,
          score: 85,
          comment: 'Old per-stage comment'
        }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        gateResult: {
          score: 85,
          comment: 'Good'
        }
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current).toEqual({
      name: 'IRAnalysis',
      handoverTo: null,
      failureCount: 0,
      previousStage: null,
      nextStage: null,
    })
    expect(findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')).toBeUndefined()
  })

  it('roundtrip: write with milestone fields, read back preserves all fields', () => {
    const stateToWrite = {
      initialized: true,
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        IRAnalysis: {
          mark: true,
          selected: true,
          previousStage: null,
          nextStage: 'scenarioAnalysis',
        },
        scenarioAnalysis: {
          mark: false,
          selected: true,
          previousStage: 'IRAnalysis',
          nextStage: 'useCaseAnalysis',
        },
        useCaseAnalysis: {
          mark: false,
          selected: false,
          previousStage: 'scenarioAnalysis',
          nextStage: null,
        }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: 'scenarioAnalysis',
        failureCount: 3,
        previousStage: null,
        nextStage: 'scenarioAnalysis',
      }
    }

    writeWorkflowStateFile(stateToWrite)

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.typeId).toBe('classic')
    expect(state?.current?.failureCount).toBe(3)
    expect(state?.workflow.IRAnalysis?.selected).toBe(true)
    expect(state?.workflow.scenarioAnalysis?.selected).toBe(true)
    expect(state?.workflow.useCaseAnalysis?.selected).toBe(false)
    expect(state?.workflow.IRAnalysis?.previousStage).toBeNull()
    expect(state?.workflow.IRAnalysis?.nextStage).toBe('scenarioAnalysis')
    expect(state?.workflow.scenarioAnalysis?.previousStage).toBe('IRAnalysis')
    expect(state?.workflow.useCaseAnalysis?.nextStage).toBeNull()
    expect(state?.current?.name).toBe('IRAnalysis')
    expect(state?.current?.handoverTo).toBe('scenarioAnalysis')
  })

  it('write path never persists legacy gateResult/score/comment fields', () => {
    const stateToWrite = {
      initialized: true,
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        IRAnalysis: {
          mark: true,
          selected: true,
          previousStage: null,
          nextStage: null,
        }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        failureCount: 0
      }
    }

    writeWorkflowStateFile(stateToWrite)
    const raw = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    expect(raw.schemaVersion).toBe(2)
    expect(raw.execution.stage.gateResult).toBeUndefined()
    expect(raw.plan.stages.IRAnalysis.score).toBeUndefined()
    expect(raw.plan.stages.IRAnalysis.comment).toBeUndefined()
    expect(raw.current).toBeUndefined()
    expect(raw.workflow).toBeUndefined()
  })
})
