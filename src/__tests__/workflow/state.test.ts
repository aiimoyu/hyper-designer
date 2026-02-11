import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder
} from "../../workflows/core/state"
import type { WorkflowDefinition } from "../../workflows/core/types"
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
      setWorkflowCurrent("dataCollection")

      const firstState = getWorkflowState()
      expect(firstState).not.toBeNull()
      expect(firstState!.currentStep).toBe("dataCollection")

      setWorkflowStage("dataCollection", true)

      const secondState = getWorkflowState()
      expect(secondState!.workflow.dataCollection.isCompleted).toBe(true)
    })

    it("loads legacy state file without typeId with default value", () => {
      // Write a legacy state file without typeId
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
      const updatedState = setWorkflowStage("IRAnalysis", true)

      expect(updatedState.workflow.IRAnalysis.isCompleted).toBe(true)
      expect(updatedState.workflow.dataCollection.isCompleted).toBe(false)
    })

    it("persists state to file", () => {
      setWorkflowStage("scenarioAnalysis", true)

      const reloadedState = getWorkflowState()
      if (!reloadedState) {
        throw new Error("Expected workflow state to be present")
      }
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
      if (!reloadedState) {
        throw new Error("Expected workflow state to be present")
      }
      expect(reloadedState.currentStep).toBe("systemFunctionalDesign")
    })
  })

  describe("setWorkflowHandover", () => {
    it("sets handover step", () => {
      setWorkflowCurrent("dataCollection")
      const updatedState = setWorkflowHandover("IRAnalysis", classicWorkflowDef)

      expect(updatedState.handoverTo).toBe("IRAnalysis")
    })

    it("allows null to clear handover", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      const clearedState = setWorkflowHandover(null, classicWorkflowDef)

      expect(clearedState.handoverTo).toBeNull()
    })

    it("throws error for invalid handover step", () => {
      setWorkflowCurrent("dataCollection")
      expect(() => {
        setWorkflowHandover("invalidHandover" as any, classicWorkflowDef)
      }).toThrow("Invalid workflow step")
    })

    it("validates stage order for handover", () => {
      setWorkflowCurrent("dataCollection")
      expect(() => {
        setWorkflowHandover("useCaseAnalysis", classicWorkflowDef)
      }).toThrow("Cannot skip steps")
    })

    it("allows backward handover", () => {
      setWorkflowCurrent("scenarioAnalysis")
      const state = setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      expect(state.handoverTo).toBe("IRAnalysis")
    })
  })

  describe("executeWorkflowHandover", () => {
    it("executes handover and marks current step complete", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)

      const state = executeWorkflowHandover(classicWorkflowDef)

      expect(state.currentStep).toBe("IRAnalysis")
      expect(state.handoverTo).toBeNull()
      expect(state.workflow.dataCollection.isCompleted).toBe(true)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
    })

    it("marks steps incomplete when going backward", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      executeWorkflowHandover(classicWorkflowDef)

      setWorkflowCurrent("IRAnalysis")
      setWorkflowHandover("scenarioAnalysis", classicWorkflowDef)
      executeWorkflowHandover(classicWorkflowDef)

      setWorkflowCurrent("scenarioAnalysis")
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      const state = executeWorkflowHandover(classicWorkflowDef)

      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
    })
  })
})
