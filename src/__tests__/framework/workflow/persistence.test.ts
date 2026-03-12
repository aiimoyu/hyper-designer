import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readWorkflowStateFile, writeWorkflowStateFile, getWorkflowStatePath } from '../../../workflows/core/state/persistence'
import { rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { dirname } from 'path'

const STATE_FILE = getWorkflowStatePath()

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
      workflow: {
        dataCollection: { isCompleted: true }
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
    expect(state?.workflow.dataCollection?.stageMilestones?.gate).toBeUndefined()
  })

  it('ignores legacy top-level gateResult object while still reading currentStage', () => {
    const legacyState = {
      typeId: 'classic',
      workflow: {
        dataCollection: { isCompleted: true }
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
    expect(state?.workflow.dataCollection?.stageMilestones?.gate).toBeUndefined()
  })

  it('reads already canonical state correctly', () => {
    const canonicalState = {
      initialized: true,
      typeId: 'classic',
      workflow: {
        dataCollection: {
          isCompleted: true,
          selected: true,
          previousStage: null,
          nextStage: 'IRAnalysis',
          stageMilestones: {
            gate: {
              type: 'gate',
              timestamp: '2026-01-01T00:00:00.000Z',
              isCompleted: true,
              detail: {
                score: 90,
                comment: 'Excellent'
              }
            }
          }
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
      workflow: {
        dataCollection: {
          isCompleted: true,
          selected: true,
          previousStage: null,
          nextStage: 'IRAnalysis',
          stageMilestones: {
            gate: {
              type: 'gate',
              timestamp: '2026-01-01T00:00:00.000Z',
              isCompleted: true,
              detail: {
                score: 95,
                comment: 'Strong quality'
              }
            }
          }
        }
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
        failureCount: 0,
        previousStage: 'dataCollection',
        nextStage: 'scenarioAnalysis',
      }
    }

    writeWorkflowStateFile(state)

    const raw = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    expect(raw.initialized).toBe(true)
    expect(raw.current).toEqual(state.current)
    expect(raw.workflow).toEqual(state.workflow)
    expect(raw.current.gateResult).toBeUndefined()
    expect(raw.workflow.dataCollection.score).toBeUndefined()
    expect(raw.workflow.dataCollection.comment).toBeUndefined()
  })
})
