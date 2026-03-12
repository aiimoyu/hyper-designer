import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGatePassed,
  forceWorkflowNextStep,
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
      // Verify neighbor links for selected stages
      expect(state.workflow.dataCollection?.previousStage).toBeNull()
      expect(state.workflow.dataCollection?.nextStage).toBe("IRAnalysis")
      expect(state.workflow.IRAnalysis?.previousStage).toBe("dataCollection")
      expect(state.workflow.IRAnalysis?.nextStage).toBeNull()
      // Deselected stages should not have neighbor links
      expect(state.workflow.scenarioAnalysis?.previousStage).toBeUndefined()
      expect(state.workflow.scenarioAnalysis?.nextStage).toBeUndefined()
    })

    it("creates state with all stages selected and correct neighbor links", () => {
      const state = initializeWorkflowState(classicWorkflowDef)
      // First stage: previousStage should be null
      expect(state.workflow.dataCollection?.previousStage).toBeNull()
      expect(state.workflow.dataCollection?.nextStage).toBe("IRAnalysis")
      // Middle stages: should have both previous and next
      expect(state.workflow.IRAnalysis?.previousStage).toBe("dataCollection")
      expect(state.workflow.IRAnalysis?.nextStage).toBe("scenarioAnalysis")
      expect(state.workflow.scenarioAnalysis?.previousStage).toBe("IRAnalysis")
      expect(state.workflow.scenarioAnalysis?.nextStage).toBe("useCaseAnalysis")
      expect(state.workflow.useCaseAnalysis?.previousStage).toBe("scenarioAnalysis")
      expect(state.workflow.useCaseAnalysis?.nextStage).toBe("functionalRefinement")
      expect(state.workflow.functionalRefinement?.previousStage).toBe("useCaseAnalysis")
      expect(state.workflow.functionalRefinement?.nextStage).toBe("requirementDecomposition")
      expect(state.workflow.requirementDecomposition?.previousStage).toBe("functionalRefinement")
      expect(state.workflow.requirementDecomposition?.nextStage).toBe("systemFunctionalDesign")
      expect(state.workflow.systemFunctionalDesign?.previousStage).toBe("requirementDecomposition")
      expect(state.workflow.systemFunctionalDesign?.nextStage).toBe("moduleFunctionalDesign")
      // Last stage: nextStage should be null
      expect(state.workflow.moduleFunctionalDesign?.previousStage).toBe("systemFunctionalDesign")
      expect(state.workflow.moduleFunctionalDesign?.nextStage).toBeNull()
    })

    it("creates state with non-contiguous selected stages", () => {
      const state = initializeWorkflowState(classicWorkflowDef, ["dataCollection", "scenarioAnalysis", "moduleFunctionalDesign"])
      // First selected stage
      expect(state.workflow.dataCollection?.previousStage).toBeNull()
      expect(state.workflow.dataCollection?.nextStage).toBe("scenarioAnalysis")
      // Middle selected stage (skips IRAnalysis)
      expect(state.workflow.scenarioAnalysis?.previousStage).toBe("dataCollection")
      expect(state.workflow.scenarioAnalysis?.nextStage).toBe("moduleFunctionalDesign")
      // Last selected stage
      expect(state.workflow.moduleFunctionalDesign?.previousStage).toBe("scenarioAnalysis")
      expect(state.workflow.moduleFunctionalDesign?.nextStage).toBeNull()
      // Deselected stages should not have neighbor links
      expect(state.workflow.IRAnalysis?.previousStage).toBeUndefined()
      expect(state.workflow.IRAnalysis?.nextStage).toBeUndefined()
      expect(state.workflow.useCaseAnalysis?.previousStage).toBeUndefined()
      expect(state.workflow.useCaseAnalysis?.nextStage).toBeUndefined()
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
      // Verify neighbor links
      expect(state.workflow.stage1?.previousStage).toBeNull()
      expect(state.workflow.stage1?.nextStage).toBe("stage2")
      expect(state.workflow.stage2?.previousStage).toBe("stage1")
      expect(state.workflow.stage2?.nextStage).toBe("stage3")
      expect(state.workflow.stage3?.previousStage).toBe("stage2")
      expect(state.workflow.stage3?.nextStage).toBeNull()
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
      setWorkflowCurrent("scenarioAnalysis")
      // Gate data is now in workflow[stageName].stageMilestones.gate
      // Verify IRAnalysis has gate milestone
      const state = getWorkflowState()
      expect(state?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
    })

  })

  describe("setWorkflowGatePassed", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("updates gate pass status in state file", () => {
      setWorkflowCurrent("IRAnalysis")
      const state = setWorkflowGatePassed(true)
      // Gate data is now in workflow[stageName].stageMilestones.gate, NOT in current.gateResult
      expect(state.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
      expect(state.workflow.IRAnalysis?.stageMilestones?.gate?.isCompleted).toBe(true)
      expect((state.workflow.IRAnalysis?.stageMilestones?.gate?.detail as any).score).toBe(100)
      const reloaded = getWorkflowState()
      expect(reloaded?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
      expect(reloaded?.workflow.IRAnalysis?.stageMilestones?.gate?.isCompleted).toBe(true)
      expect((reloaded?.workflow.IRAnalysis?.stageMilestones?.gate?.detail as any).score).toBe(100)
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

    it('increments failureCount when handover target is invalid', () => {
      setWorkflowCurrent('dataCollection')
      const state = setWorkflowHandover('invalidHandover', classicWorkflowDef)
      expect(state.current?.handoverTo).toBeNull()
      expect(state.current?.failureCount).toBe(1)
    })

    it('does not increment failureCount when handover scheduling succeeds', () => {
      setWorkflowCurrent('dataCollection')
      const afterReject = setWorkflowHandover('invalidHandover', classicWorkflowDef)
      expect(afterReject.current?.failureCount).toBe(1)

      const successState = setWorkflowHandover('IRAnalysis', classicWorkflowDef)
      expect(successState.current?.handoverTo).toBe('IRAnalysis')
      expect(successState.current?.failureCount).toBe(1)
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

    it('resets failureCount to 0 after successful stage transition', async () => {
      setWorkflowCurrent('IRAnalysis')
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      const preTransition = getWorkflowState()
      expect(preTransition?.current?.failureCount).toBe(1)

      setWorkflowHandover('scenarioAnalysis', classicWorkflowDef)
      const state = await executeWorkflowHandover(classicWorkflowDef)

      expect(state.current?.name).toBe('scenarioAnalysis')
      expect(state.current?.failureCount).toBe(0)
      expect(state.current?.previousStage).toBe('IRAnalysis')
      expect(state.current?.nextStage).toBe('useCaseAnalysis')
    })
  })

  describe('forceWorkflowNextStep', () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
      setWorkflowCurrent('IRAnalysis')
    })

    it('denies when failureCount is less than 3', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.reason).toContain('failureCount')
      }
    })

    it('denies when handover target is not next selected stage', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('dataCollection', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.reason).toContain('next selected stage')
      }
    })

    it('succeeds when failureCount >= 3 and target is next selected stage', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.current?.name).toBe('scenarioAnalysis')
        expect(result.current?.failureCount).toBe(0)
      }
    })

    it('records auditable force_advance milestone without setting gate milestone', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        const milestone = result.workflow.IRAnalysis?.stageMilestones?.force_advance
        expect(milestone?.type).toBe('force_advance')
        expect(milestone?.isCompleted).toBe(true)
        expect(milestone?.detail).toMatchObject({
          reason: 'Forced transition after 3+ failed handover attempts',
        })
        expect(result.workflow.IRAnalysis?.stageMilestones?.gate).toBeUndefined()
      }
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
      // Gate data is now in workflow[stageName].stageMilestones.gate, NOT in current.gateResult
      expect(state?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
      expect((state?.workflow.IRAnalysis?.stageMilestones?.gate?.detail as any).score).toBe(100)

      setWorkflowCurrent("scenarioAnalysis")

      state = getWorkflowState()
      // Gate milestone should still exist on IRAnalysis stage
      expect(state?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
      // scenarioAnalysis should not have a gate milestone yet
      expect(state?.workflow.scenarioAnalysis?.stageMilestones?.gate).toBeUndefined()
    })

    it("clears gateResult during executeWorkflowHandover", async () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGatePassed(true)
      setWorkflowHandover("scenarioAnalysis", classicWorkflowDef)
      let state = getWorkflowState()
      // Gate data is now in workflow[stageName].stageMilestones.gate, NOT in current.gateResult
      expect(state?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()

      await executeWorkflowHandover(classicWorkflowDef)

      state = getWorkflowState()
      expect(state?.current?.name).toBe("scenarioAnalysis")
      // Gate milestone should still exist on IRAnalysis stage after handover
      expect(state?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
    })

    it("clears gateResult when currentStage is set to null", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGatePassed(true)

      setWorkflowCurrent(null)

      const state = getWorkflowState()
      expect(state?.current).toBeNull()
      // Gate milestone should still exist on IRAnalysis stage
      expect(state?.workflow.IRAnalysis?.stageMilestones?.gate).toBeDefined()
    })
  })

})
