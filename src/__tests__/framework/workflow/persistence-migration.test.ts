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

  it("migrates legacy state without initialized - defaults to false when no typeId", () => {
    const legacyState = {
      workflow: {
        dataCollection: { isCompleted: true }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: null,
        gateResult: null
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(false)
    expect(state?.typeId).toBeNull()
  })

  it("migrates legacy state with typeId - sets initialized to true", () => {
    const legacyState = {
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

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.typeId).toBe("classic")
  })

  it("migrates legacy state without failureCount - defaults to 0", () => {
    const legacyState = {
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

    writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current?.failureCount).toBe(0)
  })

  it("migrates legacy selectedStages to workflow[].selected", () => {
    const legacyState = {
      typeId: "classic",
      workflow: {
        IRAnalysis: { isCompleted: true },
        scenarioAnalysis: { isCompleted: false },
        useCaseAnalysis: { isCompleted: false }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: null,
        gateResult: null
      },
      selectedStages: ["IRAnalysis", "scenarioAnalysis"]
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

  it("preserves existing failureCount value", () => {
    const stateWithFailureCount = {
      typeId: "classic",
      workflow: {
        dataCollection: { isCompleted: true }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: null,
        gateResult: null,
        failureCount: 2
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(stateWithFailureCount, null, 2))

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.current?.failureCount).toBe(2)
  })

  it("roundtrip: write with new fields, read back preserves all fields", () => {
    const stateToWrite = {
      initialized: true,
      typeId: "classic",
      workflow: {
        IRAnalysis: { isCompleted: true, selected: true },
        scenarioAnalysis: { isCompleted: false, selected: true },
        useCaseAnalysis: { isCompleted: false, selected: false }
      },
      current: {
        name: "IRAnalysis",
        handoverTo: "scenarioAnalysis",
        gateResult: { score: 90, comment: "Good" },
        failureCount: 3
      }
    }

    writeWorkflowStateFile(stateToWrite)

    const state = readWorkflowStateFile()
    expect(state).not.toBeNull()
    expect(state?.initialized).toBe(true)
    expect(state?.typeId).toBe("classic")
    expect(state?.current?.failureCount).toBe(3)
    expect(state?.workflow.IRAnalysis?.selected).toBe(true)
    expect(state?.workflow.scenarioAnalysis?.selected).toBe(true)
    expect(state?.workflow.useCaseAnalysis?.selected).toBe(false)
    expect(state?.current?.name).toBe("IRAnalysis")
    expect(state?.current?.handoverTo).toBe("scenarioAnalysis")
  })
})