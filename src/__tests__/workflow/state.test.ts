import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { 
  getWorkflowState, 
  setWorkflowStage, 
  setWorkflowCurrent, 
  setWorkflowHandover, 
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder
} from "../../workflows/state"
import type { WorkflowDefinition } from "../../workflows/types"
import { rmSync, existsSync, mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

const traditionalWorkflowDef: WorkflowDefinition = {
  id: "traditional",
  name: "Traditional Workflow",


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
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    IRAnalysis: {
      name: "IR Analysis",
      description: "Initial requirements analysis",
      agent: "HArchitect",
      promptFile: "ir_analysis.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    scenarioAnalysis: {
      name: "Scenario Analysis",
      description: "Analyze scenarios",
      agent: "HArchitect",
      promptFile: "scenario_analysis.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    useCaseAnalysis: {
      name: "Use Case Analysis",
      description: "Analyze use cases",
      agent: "HArchitect",
      promptFile: "use_case_analysis.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    functionalRefinement: {
      name: "Functional Refinement",
      description: "Refine functionality",
      agent: "HEngineer",
      promptFile: "functional_refinement.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    requirementDecomposition: {
      name: "Requirement Decomposition",
      description: "Decompose requirements",
      agent: "HEngineer",
      promptFile: "requirement_decomposition.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    systemFunctionalDesign: {
      name: "System Functional Design",
      description: "Design system functionality",
      agent: "HArchitect",
      promptFile: "system_functional_design.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
    },
    moduleFunctionalDesign: {
      name: "Module Functional Design",
      description: "Design module functionality",
      agent: "HEngineer",
      promptFile: "module_functional_design.md",
      getHandoverPrompt: (from, to) => `Handover from ${from} to ${to}`
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
      const state = initializeWorkflowState(traditionalWorkflowDef)

      expect(Object.keys(state.workflow)).toHaveLength(8)
      expect(state.workflow.dataCollection).toEqual({ isCompleted: false })
      expect(state.workflow.IRAnalysis).toEqual({ isCompleted: false })
      expect(state.currentStep).toBeNull()
      expect(state.handoverTo).toBeNull()
      expect(state.typeId).toBe("traditional")
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
            getHandoverPrompt: (from, to) => `${from} -> ${to}`
          },
          stage2: {
            name: "Stage 2",
            description: "Second stage",
            agent: "TestAgent",
            promptFile: "stage2.md",
            getHandoverPrompt: (from, to) => `${from} -> ${to}`
          },
          stage3: {
            name: "Stage 3",
            description: "Third stage",
            agent: "TestAgent",
            promptFile: "stage3.md",
            getHandoverPrompt: (from, to) => `${from} -> ${to}`
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
      const order = getStageOrder(traditionalWorkflowDef)
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
      expect(state!.typeId).toBe("traditional")
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
      setWorkflowCurrent("dataCollection")
      const updatedState = setWorkflowHandover("IRAnalysis", traditionalWorkflowDef)

      expect(updatedState.handoverTo).toBe("IRAnalysis")
    })

    it("allows null to clear handover", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", traditionalWorkflowDef)
      const clearedState = setWorkflowHandover(null, traditionalWorkflowDef)

      expect(clearedState.handoverTo).toBeNull()
    })

    it("throws error for invalid handover step", () => {
      setWorkflowCurrent("dataCollection")
      expect(() => {
        setWorkflowHandover("invalidHandover" as any, traditionalWorkflowDef)
      }).toThrow("Invalid workflow step")
    })

    it("validates stage order for handover", () => {
      setWorkflowCurrent("dataCollection")
      expect(() => {
        setWorkflowHandover("useCaseAnalysis", traditionalWorkflowDef)
      }).toThrow("Cannot skip steps")
    })

    it("allows backward handover", () => {
      setWorkflowCurrent("scenarioAnalysis")
      const state = setWorkflowHandover("IRAnalysis", traditionalWorkflowDef)
      expect(state.handoverTo).toBe("IRAnalysis")
    })
  })

  describe("executeWorkflowHandover", () => {
    it("executes handover and marks current step complete", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", traditionalWorkflowDef)

      const state = executeWorkflowHandover(traditionalWorkflowDef)

      expect(state.currentStep).toBe("IRAnalysis")
      expect(state.handoverTo).toBeNull()
      expect(state.workflow.dataCollection.isCompleted).toBe(true)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
    })

    it("marks steps incomplete when going backward", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", traditionalWorkflowDef)
      executeWorkflowHandover(traditionalWorkflowDef)

      setWorkflowCurrent("IRAnalysis")
      setWorkflowHandover("scenarioAnalysis", traditionalWorkflowDef)
      executeWorkflowHandover(traditionalWorkflowDef)

      setWorkflowCurrent("scenarioAnalysis")
      setWorkflowHandover("IRAnalysis", traditionalWorkflowDef)
      const state = executeWorkflowHandover(traditionalWorkflowDef)

      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
    })
  })
})
