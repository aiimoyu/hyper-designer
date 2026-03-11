import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGatePassed,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
  writeWorkflowStateFile,
} from '../../../workflows/core/state'

import type { WorkflowDefinition } from '../../../workflows/core'
import { rmSync, existsSync } from "fs"
import { join } from "path"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

const classicWorkflowDef: WorkflowDefinition = {
  id: "classic",
  name: "Classic Workflow",
  description: "Test workflow",
  stageOrder: [
    "dataCollection",
    "IRAnalysis",
    "scenarioAnalysis",
    "useCaseAnalysis",
    "functionalRefinement",
    "requirementDecomposition",
    "systemFunctionalDesign",
    "moduleFunctionalDesign"
  ],
  stages: {
    dataCollection: {
      name: "Data Collection",
      description: "Collect initial data",
      agent: "HArchitect",
      promptFile: "data_collection.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "start"} to dataCollection`
    },
    IRAnalysis: {
      name: "IR Analysis",
      description: "Initial requirements analysis",
      agent: "HArchitect",
      promptFile: "ir_analysis.md",
      gate: true,
      getHandoverPrompt: (from) => `Handover from ${from ?? "dataCollection"} to IRAnalysis`
    },
    scenarioAnalysis: {
      name: "Scenario Analysis",
      description: "Analyze scenarios",
      agent: "HArchitect",
      promptFile: "scenario_analysis.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "IRAnalysis"} to scenarioAnalysis`
    },
    useCaseAnalysis: {
      name: "Use Case Analysis",
      description: "Analyze use cases",
      agent: "HArchitect",
      promptFile: "use_case_analysis.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "scenarioAnalysis"} to useCaseAnalysis`
    },
    functionalRefinement: {
      name: "Functional Refinement",
      description: "Refine functionality",
      agent: "HEngineer",
      promptFile: "functional_refinement.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "useCaseAnalysis"} to functionalRefinement`
    },
    requirementDecomposition: {
      name: "Requirement Decomposition",
      description: "Decompose requirements",
      agent: "HEngineer",
      promptFile: "requirement_decomposition.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "functionalRefinement"} to requirementDecomposition`
    },
    systemFunctionalDesign: {
      name: "System Functional Design",
      description: "Design system functionality",
      agent: "HArchitect",
      promptFile: "system_functional_design.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "requirementDecomposition"} to systemFunctionalDesign`
    },
    moduleFunctionalDesign: {
      name: "Module Functional Design",
      description: "Design module functionality",
      agent: "HEngineer",
      promptFile: "module_functional_design.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "systemFunctionalDesign"} to moduleFunctionalDesign`
    }
  }
}

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

  describe("initializeWorkflowState", () => {
    it("creates state from workflow definition with all stages selected", () => {
      const state = initializeWorkflowState(classicWorkflowDef)

      expect(state.initialized).toBe(true)
      expect(state.typeId).toBe("classic")
      expect(Object.keys(state.workflow)).toHaveLength(8)
      expect(state.workflow.dataCollection?.selected).toBe(true)
      expect(state.workflow.IRAnalysis?.selected).toBe(true)
      expect(state.current).toBeNull()
    })

    it("creates state with selected stages", () => {
      const state = initializeWorkflowState(classicWorkflowDef, ["dataCollection", "IRAnalysis"])

      expect(state.initialized).toBe(true)
      expect(state.workflow.dataCollection?.selected).toBe(true)
      expect(state.workflow.IRAnalysis?.selected).toBe(true)
      expect(state.workflow.scenarioAnalysis?.selected).toBe(false)
    })

    it("works with custom workflow definition", () => {
      const customDef: WorkflowDefinition = {
        id: "custom",
        name: "Custom Workflow",
        description: "Test workflow",
        stageOrder: ["stage1", "stage2", "stage3"],
        stages: {
          stage1: {
            name: "Stage 1",
            description: "First stage",
            agent: "TestAgent",
            promptFile: "stage1.md",
            getHandoverPrompt: (from) => `${from ?? "start"} -> stage1`
          },
          stage2: {
            name: "Stage 2",
            description: "Second stage",
            agent: "TestAgent",
            promptFile: "stage2.md",
            getHandoverPrompt: (from) => `${from ?? "stage1"} -> stage2`
          },
          stage3: {
            name: "Stage 3",
            description: "Third stage",
            agent: "TestAgent",
            promptFile: "stage3.md",
            getHandoverPrompt: (from) => `${from ?? "stage2"} -> stage3`
          }
        }
      }

      const state = initializeWorkflowState(customDef)
      expect(state.initialized).toBe(true)
      expect(state.typeId).toBe("custom")
      expect(Object.keys(state.workflow)).toHaveLength(3)
      expect(state.workflow.stage1?.selected).toBe(true)
    })
  })

  describe("getStageOrder", () => {
    it("returns stage order from definition", () => {
      const order = getStageOrder(classicWorkflowDef)
      expect(order).toEqual([
        "dataCollection",
        "IRAnalysis",
        "scenarioAnalysis",
        "useCaseAnalysis",
        "functionalRefinement",
        "requirementDecomposition",
        "systemFunctionalDesign",
        "moduleFunctionalDesign"
      ])
    })
  })

  describe("getWorkflowState", () => {
    it("returns null when file doesn't exist", () => {
      const state = getWorkflowState()
      expect(state).toBeNull()
    })

    it("does not create state file when called", () => {
      expect(existsSync(STATE_FILE)).toBe(false)
      getWorkflowState()
      expect(existsSync(STATE_FILE)).toBe(false)
    })
  })

  describe("setWorkflowStage", () => {
    beforeEach(() => {
      // Initialize state first
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("updates specific stage completion status", () => {
      setWorkflowStage("IRAnalysis", true)

      const updatedState = getWorkflowState()
      expect(updatedState!.workflow.IRAnalysis?.isCompleted).toBe(true)
    })

    it("persists state to file", () => {
      setWorkflowStage("scenarioAnalysis", true)

      const reloadedState = getWorkflowState()
      expect(reloadedState!.workflow.scenarioAnalysis?.isCompleted).toBe(true)
    })

    it("ignores invalid stage name", () => {
      const state = setWorkflowStage("invalidStage", true)
      expect(state.workflow.invalidStage).toBeUndefined()
    })
  })

  describe("setWorkflowCurrent", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("sets current step", () => {
      const updatedState = setWorkflowCurrent("useCaseAnalysis")
      expect(updatedState.current?.name).toBe("useCaseAnalysis")
    })

    it("allows null to clear current step", () => {
      setWorkflowCurrent("functionalRefinement")
      const clearedState = setWorkflowCurrent(null)
      expect(clearedState.current).toBeNull()
    })

    it("ignores invalid step name", () => {
      const state = setWorkflowCurrent("invalidStep")
      expect(state.current).toBeNull()
    })

    it("persists current step to file", () => {
      const state = setWorkflowCurrent("systemFunctionalDesign")
      expect(state.current?.name).toBe("systemFunctionalDesign")
    })

    it("resets gate status when stage changes", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGatePassed(true)
      const state = setWorkflowCurrent("scenarioAnalysis")
      expect(state.current?.gateResult).toBeNull()
    })
  })

  describe("setWorkflowGatePassed", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("updates gate pass status in state file", () => {
      setWorkflowCurrent("IRAnalysis")
      const state = setWorkflowGatePassed(true)
      expect(state.current?.gateResult?.score).toBe(100)
      const reloaded = getWorkflowState()
      expect(reloaded?.current?.gateResult?.score).toBe(100)
    })
  })

  describe("setWorkflowHandover", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("returns state object", () => {
      setWorkflowCurrent("dataCollection")
      const updatedState = setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      expect(updatedState).toHaveProperty("workflow")
      expect(updatedState).toHaveProperty("current")
      expect(updatedState.current?.handoverTo).toBe("IRAnalysis")
    })

    it("allows null to clear handover", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      const clearedState = setWorkflowHandover(null, classicWorkflowDef)
      expect(clearedState.current?.handoverTo).toBeNull()
    })

    it("ignores invalid handover step", () => {
      setWorkflowCurrent("dataCollection")
      const state = setWorkflowHandover("invalidHandover", classicWorkflowDef)
      expect(state.current?.handoverTo).toBeNull()
    })

    it("prevents skipping stages in handover", () => {
      setWorkflowCurrent("dataCollection")
      const state = setWorkflowHandover("useCaseAnalysis", classicWorkflowDef)
      expect(state.current?.handoverTo).toBeNull()
    })

    it("allows backward handover", () => {
      setWorkflowStage("dataCollection", true)
      setWorkflowCurrent("scenarioAnalysis")
      const currentState = getWorkflowState()
      expect(currentState?.current?.name).toBe("scenarioAnalysis")
      const state = setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      expect(state.current?.handoverTo).toBe("IRAnalysis")
    })
  })

  describe("executeWorkflowHandover", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("throws error when workflow not initialized", async () => {
      // Remove state file to simulate uninitialized state
      rmSync(STATE_FILE, { force: true })
      
      await expect(executeWorkflowHandover(classicWorkflowDef)).rejects.toThrow("Workflow not initialized")
    })

    it("returns state when handover is not set", async () => {
      const state = await executeWorkflowHandover(classicWorkflowDef)
      expect(state).toHaveProperty("workflow")
      expect(state.current).toBeDefined()
    })

    it("executes handover when handover is set", async () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowHandover("scenarioAnalysis", classicWorkflowDef)

      const state = await executeWorkflowHandover(classicWorkflowDef)

      expect(state.current?.name).toBe("scenarioAnalysis")
      expect(state.current?.handoverTo).toBeNull()
      expect(state.workflow.IRAnalysis?.isCompleted).toBe(true)
    })
  })

  describe("gateResult clearing", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("clears gateResult when currentStage is updated to a different stage", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGatePassed(true)
      
      let state = getWorkflowState()
      expect(state?.current?.gateResult).not.toBeNull()
      expect(state?.current?.gateResult?.score).toBe(100)

      setWorkflowCurrent("scenarioAnalysis")
      
      state = getWorkflowState()
      expect(state?.current?.gateResult).toBeNull()
    })

    it("clears gateResult during executeWorkflowHandover", async () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGatePassed(true)
      setWorkflowHandover("scenarioAnalysis", classicWorkflowDef)
      
      let state = getWorkflowState()
      expect(state?.current?.gateResult).not.toBeNull()

      await executeWorkflowHandover(classicWorkflowDef)
      
      state = getWorkflowState()
      expect(state?.current?.name).toBe("scenarioAnalysis")
      expect(state?.current?.gateResult).toBeNull()
    })

    it("clears gateResult when currentStage is set to null", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGatePassed(true)
      
      setWorkflowCurrent(null)
      
      const state = getWorkflowState()
      expect(state?.current).toBeNull()
    })
  })
})