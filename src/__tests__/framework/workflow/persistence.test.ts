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

describe('workflow persistence', () => {
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

  it('ignores legacy top-level gatePassed while still reading currentStage', () => {
    const legacyState = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: { mark: true }
      },
      currentStage: 'dataCollection',
      gatePassed: true,
      handoverTo: 'IRAnalysis'
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.current).toEqual({
      name: 'dataCollection',
      handoverTo: 'IRAnalysis',
      failureCount: 0,
      previousStage: null,
      nextStage: null,
    })
    expect(findLatestNodeMilestone(state, 'workflow.dataCollection.main', 'gate')).toBeUndefined()
  })

  it('ignores legacy top-level gateResult object while still reading currentStage', () => {
    const legacyState = {
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: { mark: true }
      },
      currentStage: 'IRAnalysis',
      gateResult: {
        score: 85,
        comment: 'Good work',
        stage: 'IRAnalysis'
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.current).toEqual({
      name: 'IRAnalysis',
      handoverTo: null,
      failureCount: 0,
      previousStage: null,
      nextStage: null,
    })
    expect(state?.workflow.IRAnalysis).toBeUndefined()
    expect(findLatestNodeMilestone(state, 'workflow.dataCollection.main', 'gate')).toBeUndefined()
  })

  it('reads already canonical state correctly', () => {
    const canonicalState = {
      initialized: true,
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: {
          mark: true,
          selected: true,
          previousStage: null,
          nextStage: 'IRAnalysis',
        }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: 'scenarioAnalysis',
        failureCount: 0,
        previousStage: 'dataCollection',
        nextStage: 'scenarioAnalysis',
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(canonicalState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.current).toEqual(canonicalState.current)
    expect(state?.workflow).toEqual(canonicalState.workflow)
  })

  it('writes canonical state to disk', () => {
    const state = {
      initialized: true,
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        dataCollection: {
          mark: true,
          selected: true,
          previousStage: null,
          nextStage: 'IRAnalysis',
        }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        agent: 'HArchitect',
        failureCount: 0,
        previousStage: 'dataCollection',
        nextStage: 'scenarioAnalysis',
      }
    }

    writeWorkflowStateFile(state)

    const raw = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    expect(raw.initialized).toBe(true)
    expect(raw.schemaVersion).toBe(2)
    expect(raw.execution.stage).toEqual({
      current: 'IRAnalysis',
      previous: 'dataCollection',
      next: 'scenarioAnalysis',
      handoverTo: null,
      agent: 'HArchitect',
      failureCount: 0,
    })
    expect(raw.plan.stages.dataCollection).toEqual({
      inclusion: 'selected',
      completed: true,
      previous: null,
      next: 'IRAnalysis',
    })
    expect(raw.current).toBeUndefined()
    expect(raw.workflow).toBeUndefined()
    expect(raw.execution.stage.gateResult).toBeUndefined()
    expect(raw.plan.stages.dataCollection.score).toBeUndefined()
    expect(raw.plan.stages.dataCollection.comment).toBeUndefined()
  })

  it('reads v1 current.agent from canonical current payload for backward compatibility', () => {
    const canonicalStateWithAgent = {
      initialized: true,
      typeId: 'classic',
      projectRoot: null,
      workflow: {
        IRAnalysis: {
          mark: false,
          selected: true,
          previousStage: null,
          nextStage: 'scenarioAnalysis',
        },
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        agent: 'HArchitect',
        failureCount: 0,
        previousStage: null,
        nextStage: 'scenarioAnalysis',
      },
    }

    writeFileSync(STATE_FILE, JSON.stringify(canonicalStateWithAgent, null, 2))

    const state = readWorkflowStateFile()
    expect(state?.current?.agent).toBe('HArchitect')
  })
})
