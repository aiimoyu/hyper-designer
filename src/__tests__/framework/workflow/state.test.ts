import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder
} from "../../../workflows/core/state"
import type { WorkflowDefinition } from "../../../workflows/core/types"
import { rmSync, existsSync, mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"

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
      agent: "HCollector",
      promptFile: "data_collection.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "start"} to dataCollection`
    },
    IRAnalysis: {
      name: "IR Analysis",
      description: "Initial requirements analysis",
      agent: "HArchitect",
      promptFile: "ir_analysis.md",
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
    it("creates state from workflow definition", () => {
      const state = initializeWorkflowState(classicWorkflowDef)

      expect(Object.keys(state.workflow)).toHaveLength(8)
      expect(state.workflow.dataCollection).toEqual({ isCompleted: false })
      expect(state.workflow.IRAnalysis).toEqual({ isCompleted: false })
      expect(state.currentStep).toBeNull()
      expect(state.handoverTo).toBeNull()
      expect(state.typeId).toBe("classic")
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
      expect(Object.keys(state.workflow)).toHaveLength(3)
      expect(state.workflow.stage1).toEqual({ isCompleted: false })
      expect(state.workflow.stage2).toEqual({ isCompleted: false })
      expect(state.workflow.stage3).toEqual({ isCompleted: false })
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

    it("reads existing state file correctly", () => {
      const state = setWorkflowStage("dataCollection", false, classicWorkflowDef)
      expect(state).not.toBeNull()
      expect(state.workflow.dataCollection).toBeDefined()

      const updatedState = setWorkflowStage("dataCollection", true, classicWorkflowDef)
      expect(updatedState.workflow.dataCollection.isCompleted).toBe(true)
    })

    it("loads legacy state file without typeId with default value", () => {
      const legacyState = {
        workflow: {
          dataCollection: { isCompleted: true },
          IRAnalysis: { isCompleted: false },
          scenarioAnalysis: { isCompleted: false },
          useCaseAnalysis: { isCompleted: false },
          functionalRefinement: { isCompleted: false },
          requirementDecomposition: { isCompleted: false },
          systemFunctionalDesign: { isCompleted: false },
          moduleFunctionalDesign: { isCompleted: false },
        },
        currentStep: null,
        handoverTo: null,
      }

      mkdirSync(dirname(STATE_FILE), { recursive: true })
      writeFileSync(STATE_FILE, JSON.stringify(legacyState, null, 2))

      const state = getWorkflowState()
      expect(state).not.toBeNull()
      expect(state!.typeId).toBe("classic")
      expect(state!.workflow.dataCollection.isCompleted).toBe(true)
      expect(state!.currentStep).toBeNull()
    })
  })

  describe("setWorkflowStage", () => {
    it("updates specific stage completion status", () => {
      setWorkflowStage("IRAnalysis", true, classicWorkflowDef)

      const updatedState = getWorkflowState()
      expect(updatedState!.workflow.IRAnalysis.isCompleted).toBe(true)
    })

    it("persists state to file", () => {
      setWorkflowStage("scenarioAnalysis", true, classicWorkflowDef)

      const reloadedState = getWorkflowState()
      expect(reloadedState!.workflow.scenarioAnalysis.isCompleted).toBe(true)
    })

    it("ignores invalid stage name", () => {
      const state = setWorkflowStage("invalidStage", true, classicWorkflowDef)
      expect(state.workflow.invalidStage).toBeUndefined()
    })
  })

  describe("setWorkflowCurrent", () => {
    it("sets current step", () => {
      setWorkflowStage("useCaseAnalysis", false, classicWorkflowDef)
      const updatedState = setWorkflowCurrent("useCaseAnalysis", classicWorkflowDef)

      expect(updatedState.currentStep).toBe("useCaseAnalysis")
    })

    it("allows null to clear current step", () => {
      setWorkflowStage("functionalRefinement", false, classicWorkflowDef)
      setWorkflowCurrent("functionalRefinement", classicWorkflowDef)
      const clearedState = setWorkflowCurrent(null, classicWorkflowDef)

      expect(clearedState.currentStep).toBeNull()
    })

    it("ignores invalid step name", () => {
      const state = setWorkflowCurrent("invalidStep", classicWorkflowDef)
      expect(state.currentStep).toBeNull()
    })

    it("persists current step to file", () => {
      const state = setWorkflowCurrent("systemFunctionalDesign", classicWorkflowDef)

      expect(state.currentStep).toBe("systemFunctionalDesign")
    })
  })

  describe("setWorkflowHandover", () => {
    it("returns state object", () => {
      initializeWorkflowState(classicWorkflowDef)
      setWorkflowCurrent("dataCollection", classicWorkflowDef)
      const updatedState = setWorkflowHandover("IRAnalysis", classicWorkflowDef)

      expect(updatedState).toHaveProperty("workflow")
      expect(updatedState).toHaveProperty("currentStep")
      expect(updatedState).toHaveProperty("handoverTo")
      expect(updatedState.handoverTo).toBe("IRAnalysis")
    })

    it("allows null to clear handover", () => {
      initializeWorkflowState(classicWorkflowDef)
      setWorkflowCurrent("dataCollection", classicWorkflowDef)
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      const clearedState = setWorkflowHandover(null, classicWorkflowDef)

      expect(clearedState.handoverTo).toBeNull()
    })

    it("ignores invalid handover step", () => {
      initializeWorkflowState(classicWorkflowDef)
      setWorkflowCurrent("dataCollection", classicWorkflowDef)
      const state = setWorkflowHandover("invalidHandover", classicWorkflowDef)
      expect(state.handoverTo).toBeNull()
    })

    it("prevents skipping stages in handover", () => {
      initializeWorkflowState(classicWorkflowDef)
      setWorkflowCurrent("dataCollection", classicWorkflowDef)
      const state = setWorkflowHandover("useCaseAnalysis", classicWorkflowDef)
      expect(state.handoverTo).toBeNull()
    })

    it("allows backward handover", () => {
      initializeWorkflowState(classicWorkflowDef)
      setWorkflowStage("dataCollection", true, classicWorkflowDef)
      setWorkflowStage("dataCollection", false, classicWorkflowDef)
      setWorkflowStage("scenarioAnalysis", false, classicWorkflowDef)
      setWorkflowStage("IRAnalysis", false, classicWorkflowDef)
      setWorkflowCurrent("scenarioAnalysis", classicWorkflowDef)
      const currentState = getWorkflowState()
      expect(currentState?.currentStep).toBe("scenarioAnalysis")
      const state = setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      expect(state.handoverTo).toBe("IRAnalysis")
    })
  })

  describe("executeWorkflowHandover", () => {
    it("returns state when handover is not set", () => {
      initializeWorkflowState(classicWorkflowDef)
      const state = executeWorkflowHandover(classicWorkflowDef)
      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("currentStep")
      expect(state).toHaveProperty("handoverTo")
    })

    it("executes handover when handover is set", () => {
      initializeWorkflowState(classicWorkflowDef)
      setWorkflowCurrent("dataCollection", classicWorkflowDef)
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)

      const state = executeWorkflowHandover(classicWorkflowDef)

      expect(state.currentStep).toBe("IRAnalysis")
      expect(state.handoverTo).toBeNull()
      expect(state.workflow.dataCollection.isCompleted).toBe(true)
    })
  })
})
