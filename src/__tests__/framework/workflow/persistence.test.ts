import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { readWorkflowStateFile, writeWorkflowStateFile, getWorkflowStatePath } from "../../../workflows/core/state/persistence"
import { rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { dirname } from "path"

const STATE_FILE = getWorkflowStatePath()

describe("workflow persistence", () => {
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
    expect(state?.initialized).toBe(true)
    expect(state?.current).toEqual({
      name: "dataCollection",
      handoverTo: "IRAnalysis",
      gateResult: {
        score: 100,
        comment: "Passed (legacy)"
      },
      failureCount: 0
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
    expect(state?.initialized).toBe(true)
    expect(state?.current).toEqual({
      name: "IRAnalysis",
      handoverTo: null,
      gateResult: {
        score: 85,
        comment: "Good work",
        stage: "IRAnalysis"
      },
      failureCount: 0
    })
  })

  it("reads already canonical state correctly", () => {
    const canonicalState = {
      initialized: true,
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true, selected: true }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: "scenarioAnalysis",
        gateResult: {
          score: 90,
          comment: "Excellent"
        },
        failureCount: 0
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(canonicalState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.current).toEqual(canonicalState.current)
  })

  it("writes canonical state to disk", () => {
    const state = {
      initialized: true,
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true, selected: true }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: null,
        gateResult: null,
        failureCount: 0
      }
    }

    writeWorkflowStateFile(state)

    const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"))
    expect(raw.initialized).toBe(true)
    expect(raw.current).toEqual(state.current)
  })
})