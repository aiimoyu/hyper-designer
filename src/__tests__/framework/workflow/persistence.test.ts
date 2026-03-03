import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { readWorkflowStateFile, writeWorkflowStateFile, getWorkflowStatePath } from "../../../workflows/core/state/persistence"
import { rmSync, existsSync, mkdirSync, writeFileSync } from "fs"
import { dirname } from "path"

const STATE_FILE = getWorkflowStatePath()

describe("workflow persistence migration", () => {
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

  it("migrates legacy state with top-level currentStage and gatePassed", () => {
    const legacyState = {
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true }
      },
      currentStage: "dataCollection",
      gatePassed: true,
      handoverTo: "IRAnalysis"
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current).toEqual({
      name: "dataCollection",
      handoverTo: "IRAnalysis",
      gateResult: {
        score: 100,
        comment: "Passed (legacy)"
      }
    })
  })

  it("migrates legacy state with top-level currentStage and gateResult object", () => {
    const legacyState = {
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true }
      },
      currentStage: "IRAnalysis",
      gateResult: {
        score: 85,
        comment: "Good work",
        stage: "IRAnalysis"
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current).toEqual({
      name: "IRAnalysis",
      handoverTo: null,
      gateResult: {
        score: 85,
        comment: "Good work",
        stage: "IRAnalysis"
      }
    })
  })

  it("reads already canonical state correctly", () => {
    const canonicalState = {
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: "scenarioAnalysis",
        gateResult: {
          score: 90,
          comment: "Excellent"
        }
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(canonicalState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current).toEqual(canonicalState.current)
  })

  it("writes canonical state to disk", () => {
    const state = {
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: null,
        gateResult: null
      }
    }

    writeWorkflowStateFile(state)

    const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"))
    expect(raw.current).toEqual(state.current)
    // Legacy fields should still be present for backward compatibility if write logic includes them,
    // but the primary should be 'current'.
    // Looking at persistence.ts: writeWorkflowStateFile(state) just stringifies the state object.
  })
})

import { readFileSync } from "fs"
