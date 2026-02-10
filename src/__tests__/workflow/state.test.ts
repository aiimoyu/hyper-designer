import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getWorkflowState, setWorkflowStage, setWorkflowCurrent, setWorkflowHandover } from "../../workflow/state"
import { rmSync, existsSync } from "fs"
import { join } from "path"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

describe("workflow state management", () => {
  beforeEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  afterEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  describe("getWorkflowState", () => {
    it("returns default state when file doesn't exist", () => {
      const state = getWorkflowState()

      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("currentStep", null)
      expect(state).toHaveProperty("handoverTo", null)

      expect(state.workflow.dataCollection.isCompleted).toBe(false)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
      expect(state.workflow.useCaseAnalysis.isCompleted).toBe(false)
      expect(state.workflow.functionalRefinement.isCompleted).toBe(false)
      expect(state.workflow.requirementDecomposition.isCompleted).toBe(false)
      expect(state.workflow.systemFunctionalDesign.isCompleted).toBe(false)
      expect(state.workflow.moduleFunctionalDesign.isCompleted).toBe(false)
    })

    it("creates state file if it doesn't exist", () => {
      expect(existsSync(STATE_FILE)).toBe(false)

      getWorkflowState()

      expect(existsSync(STATE_FILE)).toBe(true)
    })

    it("reads existing state file correctly", () => {
      const firstState = getWorkflowState()
      firstState.workflow.dataCollection.isCompleted = true
      
      setWorkflowStage("dataCollection", true)

      const secondState = getWorkflowState()
      expect(secondState.workflow.dataCollection.isCompleted).toBe(true)
    })
  })

  describe("setWorkflowStage", () => {
    it("updates specific stage completion status", () => {
      const updatedState = setWorkflowStage("IRAnalysis", true)

      expect(updatedState.workflow.IRAnalysis.isCompleted).toBe(true)
      expect(updatedState.workflow.dataCollection.isCompleted).toBe(false)
    })

    it("persists state to file", () => {
      setWorkflowStage("scenarioAnalysis", true)

      const reloadedState = getWorkflowState()
      expect(reloadedState.workflow.scenarioAnalysis.isCompleted).toBe(true)
    })

    it("throws error for invalid stage name", () => {
      expect(() => {
        setWorkflowStage("invalidStage" as any, true)
      }).toThrow("Invalid workflow stage")
    })
  })

  describe("setWorkflowCurrent", () => {
    it("sets current step", () => {
      const updatedState = setWorkflowCurrent("useCaseAnalysis")

      expect(updatedState.currentStep).toBe("useCaseAnalysis")
    })

    it("allows null to clear current step", () => {
      setWorkflowCurrent("functionalRefinement")
      const clearedState = setWorkflowCurrent(null)

      expect(clearedState.currentStep).toBeNull()
    })

    it("throws error for invalid step name", () => {
      expect(() => {
        setWorkflowCurrent("invalidStep" as any)
      }).toThrow("Invalid workflow step")
    })

    it("persists current step to file", () => {
      setWorkflowCurrent("systemFunctionalDesign")

      const reloadedState = getWorkflowState()
      expect(reloadedState.currentStep).toBe("systemFunctionalDesign")
    })
  })

  describe("setWorkflowHandover", () => {
    it("sets handover step", () => {
      const updatedState = setWorkflowHandover("moduleFunctionalDesign")

      expect(updatedState.handoverTo).toBe("moduleFunctionalDesign")
    })

    it("allows null to clear handover", () => {
      setWorkflowHandover("requirementDecomposition")
      const clearedState = setWorkflowHandover(null)

      expect(clearedState.handoverTo).toBeNull()
    })

    it("throws error for invalid handover step", () => {
      expect(() => {
        setWorkflowHandover("invalidHandover" as any)
      }).toThrow("Invalid workflow step")
    })
  })
})
