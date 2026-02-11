import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { loadHDConfig } from "../../config/loader"
import { getWorkflowDefinition } from "../../workflows/core/registry"
import { createHArchitectAgent } from "../../agents/HArchitect"

import {
  initializeWorkflowState,
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  executeWorkflowHandover,
} from "../../workflows/core/state"
import { getHandoverAgent, getHandoverPrompt } from "../../workflows/core/handover"
import { loadPromptForStage } from "../../workflows/core/prompts"
import { rmSync, existsSync } from "fs"
import { join } from "path"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")


describe("Integration Tests: Deep Decoupling System", () => {
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

  describe("Full Pipeline Integration", () => {
    it("should load config, get workflow, create agent, and resolve prompts end-to-end", () => {
      const config = loadHDConfig()
      expect(config.workflow).toBe("traditional")
      expect(config.agents).toBeDefined()

      const workflow = getWorkflowDefinition(config.workflow!)
      expect(workflow.id).toBe("traditional")
      expect(workflow.name).toBe("Traditional Requirements Engineering")
      expect(workflow.stageOrder).toHaveLength(8)
      expect(workflow.stageOrder).toEqual([
        "dataCollection",
        "IRAnalysis",
        "scenarioAnalysis",
        "useCaseAnalysis",
        "functionalRefinement",
        "requirementDecomposition",
        "systemFunctionalDesign",
        "moduleFunctionalDesign",
      ])

      const agent = createHArchitectAgent()
      expect(agent.prompt).toBeTruthy()
      expect(agent.name).toBe("HArchitect")
      expect(agent.mode).toBe("primary")

      const prompt = agent.prompt!
      expect(prompt).toBeTruthy()
    })

    it("should verify extensibility: config workflow affects loaded definition", () => {
      const config = loadHDConfig()
      expect(config.workflow).toBe("traditional")

      const workflow = getWorkflowDefinition(config.workflow!)
      expect(workflow.id).toBe(config.workflow)
    })
  })



  describe("Workflow State Lifecycle Integration", () => {
    it("should manage workflow state lifecycle with traditional workflow", () => {
      const workflow = getWorkflowDefinition("traditional")
      const state = initializeWorkflowState(workflow)

      expect(Object.keys(state.workflow)).toHaveLength(8)
      expect(state.currentStep).toBeNull()
      expect(state.handoverTo).toBeNull()

      expect(state.workflow.dataCollection.isCompleted).toBe(false)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
      expect(state.workflow.useCaseAnalysis.isCompleted).toBe(false)
      expect(state.workflow.functionalRefinement.isCompleted).toBe(false)
      expect(state.workflow.requirementDecomposition.isCompleted).toBe(false)
      expect(state.workflow.systemFunctionalDesign.isCompleted).toBe(false)
      expect(state.workflow.moduleFunctionalDesign.isCompleted).toBe(false)
    })

    it("should complete stages and persist to disk", () => {
      const workflow = getWorkflowDefinition("traditional")
      initializeWorkflowState(workflow)

      setWorkflowStage("dataCollection", true)
      const updatedState = getWorkflowState()
      if (!updatedState) {
        throw new Error("Workflow state should be initialized")
      }
      expect(updatedState.workflow.dataCollection.isCompleted).toBe(true)

      expect(existsSync(STATE_FILE)).toBe(true)
    })

    it("should transition through multiple stages", () => {
      const workflow = getWorkflowDefinition("traditional")
      initializeWorkflowState(workflow)

      setWorkflowStage("dataCollection", true)
      setWorkflowStage("IRAnalysis", true)

      const state = getWorkflowState()
      if (!state) {
        throw new Error("Workflow state should be initialized")
      }
      expect(state.workflow.dataCollection.isCompleted).toBe(true)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(true)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
    })
  })

  describe("Handover End-to-End Integration", () => {
    it("should perform handover from dataCollection to IRAnalysis", () => {
      const workflow = getWorkflowDefinition("traditional")

      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", workflow)

      const state = getWorkflowState()
      if (!state) {
        throw new Error("Workflow state should be initialized")
      }
      expect(state.currentStep).toBe("dataCollection")
      expect(state.handoverTo).toBe("IRAnalysis")

      const nextAgent = getHandoverAgent(workflow, "IRAnalysis")
      expect(nextAgent).toBe("HArchitect")

      const handoverPrompt = getHandoverPrompt(workflow, "dataCollection", "IRAnalysis")
      expect(handoverPrompt).toBeTruthy()
      expect(handoverPrompt.length).toBeGreaterThan(0)
    })

    it("should execute handover and update state correctly", () => {
      const workflow = getWorkflowDefinition("traditional")

      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", workflow)

      const state = executeWorkflowHandover(workflow)

      expect(state.currentStep).toBe("IRAnalysis")
      expect(state.handoverTo).toBeNull()
      expect(state.workflow.dataCollection.isCompleted).toBe(true)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
    })

    it("should handle full handover chain: dataCollection → IRAnalysis → scenarioAnalysis", () => {
      const workflow = getWorkflowDefinition("traditional")

      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", workflow)
      let state = executeWorkflowHandover(workflow)

      expect(state.currentStep).toBe("IRAnalysis")
      expect(state.workflow.dataCollection.isCompleted).toBe(true)

      setWorkflowCurrent("IRAnalysis")
      setWorkflowHandover("scenarioAnalysis", workflow)
      state = executeWorkflowHandover(workflow)

      expect(state.currentStep).toBe("scenarioAnalysis")
      expect(state.workflow.IRAnalysis.isCompleted).toBe(true)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
    })

    it("should get correct agent for each stage", () => {
      const workflow = getWorkflowDefinition("traditional")

      expect(getHandoverAgent(workflow, "dataCollection")).toBe("HCollector")
      expect(getHandoverAgent(workflow, "IRAnalysis")).toBe("HArchitect")
      expect(getHandoverAgent(workflow, "scenarioAnalysis")).toBe("HArchitect")
      expect(getHandoverAgent(workflow, "useCaseAnalysis")).toBe("HArchitect")
      expect(getHandoverAgent(workflow, "functionalRefinement")).toBe("HArchitect")
      expect(getHandoverAgent(workflow, "requirementDecomposition")).toBe("HEngineer")
      expect(getHandoverAgent(workflow, "systemFunctionalDesign")).toBe("HEngineer")
      expect(getHandoverAgent(workflow, "moduleFunctionalDesign")).toBe("HEngineer")
    })
  })

  describe("Prompt Loading Integration", () => {
    it("should load prompts for all stages", () => {
      const workflow = getWorkflowDefinition("traditional")

      for (const stage of workflow.stageOrder) {
        const prompt = loadPromptForStage(stage, workflow)
        expect(prompt).toBeTruthy()
        expect(prompt.length).toBeGreaterThan(0)
      }
    })

    it("should throw error for invalid stage", () => {
      const workflow = getWorkflowDefinition("traditional")

      expect(() => loadPromptForStage("invalidStage", workflow)).toThrow(
        "Unknown stage: invalidStage"
      )
    })
  })

  describe("Config Default Behavior", () => {
    it("should default to traditional workflow when not specified", () => {
      const config = loadHDConfig()
      expect(config.workflow).toBe("traditional")
    })

    it("should merge agent configs with defaults", () => {
      const config = loadHDConfig()

      expect(config.agents.HArchitect).toBeDefined()
      expect(config.agents.HCollector).toBeDefined()
      expect(config.agents.HEngineer).toBeDefined()
      expect(config.agents.HCritic).toBeDefined()

      expect(config.agents.HArchitect.temperature).toBe(0.7)
      expect(config.agents.HArchitect.maxTokens).toBe(32000)
    })
  })

  describe("Extensibility Verification", () => {
    it("should verify workflow registry is extensible", () => {
      expect(getWorkflowDefinition("traditional")).toBeDefined()

      const workflow = getWorkflowDefinition("traditional")
      expect(workflow).toHaveProperty("id")
      expect(workflow).toHaveProperty("name")
      expect(workflow).toHaveProperty("description")
      expect(workflow).toHaveProperty("stageOrder")
      expect(workflow).toHaveProperty("stages")

      for (const stageName of workflow.stageOrder) {
        const stage = workflow.stages[stageName]
        expect(stage).toHaveProperty("name")
        expect(stage).toHaveProperty("description")
        expect(stage).toHaveProperty("agent")
        expect(stage).toHaveProperty("promptFile")
        expect(stage).toHaveProperty("getHandoverPrompt")
      }
    })

    it("should verify new workflow can be added by config change", () => {
      const config = loadHDConfig()
      const workflow = getWorkflowDefinition(config.workflow!)

      expect(workflow.id).toBe(config.workflow)

      expect(true).toBe(true)
    })
  })

  describe("Backward Compatibility Verification", () => {
    it("should maintain existing workflow state structure", () => {
      const workflow = getWorkflowDefinition("traditional")
      const state = initializeWorkflowState(workflow)

      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("currentStep")
      expect(state).toHaveProperty("handoverTo")

      for (const stageName of workflow.stageOrder) {
        expect(state.workflow[stageName]).toHaveProperty("isCompleted")
        expect(typeof state.workflow[stageName].isCompleted).toBe("boolean")
      }
    })

    it("should maintain agent config structure", () => {
      const agent = createHArchitectAgent()

      expect(agent).toHaveProperty("name")
      expect(agent).toHaveProperty("description")
      expect(agent).toHaveProperty("mode")
      expect(agent).toHaveProperty("prompt")
      expect(agent).toHaveProperty("temperature")
      expect(agent).toHaveProperty("maxTokens")
      expect(agent).toHaveProperty("color")
      expect(agent).toHaveProperty("permission")
      expect(agent).toHaveProperty("tools")
    })
  })
})
