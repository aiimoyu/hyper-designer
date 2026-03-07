import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { PluginInput } from "@opencode-ai/plugin"
import { loadHDConfig, DEFAULT_CONFIG_PATH, GLOBAL_CONFIG_PATH } from "../../../config/loader"
import { getWorkflowDefinition } from "../../../workflows"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { HyperDesignerPlugin } from "../../../../opencode/.plugins/hyper-designer"

vi.mock("@opencode-ai/plugin", () => {
  const tool = (definition: Record<string, unknown>) => definition
  // Chainable Zod-like stub: every method returns itself so .string().optional().describe() works
  const chainable: Record<string, unknown> = {}
  const chainFn = () => chainable
  chainable.describe = chainFn
  chainable.optional = chainFn
  chainable.nullable = chainFn
  chainable.min = chainFn
  chainable.max = chainFn
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
    number: () => chainable,
    string: () => chainable,
  }
  return { tool }
})
import type { WorkflowDefinition } from "../../../workflows"

import {
  initializeWorkflowState,
  loadPromptForStage,
  workflowService,
} from "../../../workflows"
import { rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")
const PROJECT_CONFIG_DIR = join(process.cwd(), ".hyper-designer")
const PROJECT_CONFIG_PATH = join(PROJECT_CONFIG_DIR, DEFAULT_CONFIG_PATH)

let originalProjectConfig: string | null = null
let originalGlobalConfig: string | null = null

const snapshotConfigs = () => {
  originalProjectConfig = existsSync(PROJECT_CONFIG_PATH)
    ? readFileSync(PROJECT_CONFIG_PATH, "utf-8")
    : null
  originalGlobalConfig = existsSync(GLOBAL_CONFIG_PATH)
    ? readFileSync(GLOBAL_CONFIG_PATH, "utf-8")
    : null
}

const restoreConfigs = () => {
  if (originalProjectConfig !== null) {
    mkdirSync(PROJECT_CONFIG_DIR, { recursive: true })
    writeFileSync(PROJECT_CONFIG_PATH, originalProjectConfig)
  } else if (existsSync(PROJECT_CONFIG_PATH)) {
    rmSync(PROJECT_CONFIG_PATH, { force: true })
  }

  if (originalGlobalConfig !== null) {
    mkdirSync(dirname(GLOBAL_CONFIG_PATH), { recursive: true })
    writeFileSync(GLOBAL_CONFIG_PATH, originalGlobalConfig)
  } else if (existsSync(GLOBAL_CONFIG_PATH)) {
    rmSync(GLOBAL_CONFIG_PATH, { force: true })
  }

  originalProjectConfig = null
  originalGlobalConfig = null
}

function getClassicWorkflow(): WorkflowDefinition {
  const workflow = getWorkflowDefinition("classic")
  if (!workflow) {
    throw new Error("Classic workflow should be defined")
  }
  return workflow
}

describe("Integration Tests: Deep Decoupling System", () => {
  beforeEach(() => {
    snapshotConfigs()
    if (existsSync(PROJECT_CONFIG_PATH)) {
      rmSync(PROJECT_CONFIG_PATH, { force: true })
    }
    if (existsSync(GLOBAL_CONFIG_PATH)) {
      rmSync(GLOBAL_CONFIG_PATH, { force: true })
    }
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  afterEach(() => {
    restoreConfigs()
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  describe("Full Pipeline Integration", () => {
    it("should load config, get workflow, create agent, and resolve prompts end-to-end", () => {
      const config = loadHDConfig()
      expect(config.workflow).toBe("classic")
      expect(config.agents).toBeDefined()

      const workflow = getWorkflowDefinition(config.workflow!)
      expect(workflow).not.toBeNull()
      expect(workflow!.id).toBe("classic")
      expect(workflow!.name).toBe("Classic Requirements Engineering")
      expect(workflow!.stageOrder).toHaveLength(8)
      expect(workflow!.stageOrder).toEqual([
        "IRAnalysis",
        "scenarioAnalysis",
        "useCaseAnalysis",
        "functionalRefinement",
        "requirementDecomposition",
        "systemFunctionalDesign",
        "moduleFunctionalDesign",
        "sddPlanGeneration",
      ])

      const agent = createHArchitectAgent()
      expect(agent.prompt).toBeTruthy()
      expect(agent.name).toBe("HArchitect")
      expect(agent.mode).toBe("primary")

      const prompt = agent.prompt!
      expect(prompt).toBeTruthy()
    })

    it("should configure plugin agent handler with mapped agents", async () => {
      const mockCtx = {
        client: { session: { prompt: async () => { } } },
        directory: process.cwd(),
      } as unknown as PluginInput

      const pluginInstance = await HyperDesignerPlugin(mockCtx)
      const configInput: Record<string, unknown> = {
        agent: {
          existingAgent: { model: "gpt-4" },
        },
      }

      await pluginInstance.config?.(configInput)

      const agentConfig = configInput.agent as Record<string, unknown>
      expect(agentConfig).toHaveProperty("HArchitect")
      expect(agentConfig).toHaveProperty("HEngineer")
      expect(agentConfig).toHaveProperty("HCritic")
      expect(agentConfig).toHaveProperty("existingAgent")
    })

    it("should verify extensibility: config workflow affects loaded definition", () => {
      const config = loadHDConfig()
      expect(config.workflow).toBe("classic")

      const workflow = getWorkflowDefinition(config.workflow!)
      expect(workflow!.id).toBe(config.workflow)
    })
  })

  describe("Workflow State Lifecycle Integration", () => {
    it("should manage workflow state lifecycle with classic workflow", () => {
      const workflow = getClassicWorkflow()
      const state = initializeWorkflowState(workflow)

      expect(Object.keys(state.workflow)).toHaveLength(8)
      expect(state.current).toBeNull()
      
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false)
      expect(state.workflow.useCaseAnalysis.isCompleted).toBe(false)
      expect(state.workflow.functionalRefinement.isCompleted).toBe(false)
      expect(state.workflow.requirementDecomposition.isCompleted).toBe(false)
      expect(state.workflow.systemFunctionalDesign.isCompleted).toBe(false)
      expect(state.workflow.moduleFunctionalDesign.isCompleted).toBe(false)
      expect(state.workflow.sddPlanGeneration.isCompleted).toBe(false)
    })

    it("should complete stages and persist to disk", () => {

      const state = workflowService.setStage("IRAnalysis", true)
      expect(state.workflow.IRAnalysis?.isCompleted).toBe(true)
      expect(existsSync(STATE_FILE)).toBe(true)
    })

    it("should transition through multiple stages", () => {

      let state = workflowService.setStage("IRAnalysis", true)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(true)

      state = workflowService.setStage("scenarioAnalysis", true)
      expect(state.workflow.IRAnalysis.isCompleted).toBe(true)
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(true)
      expect(state.workflow.useCaseAnalysis.isCompleted).toBe(false)
    })
  })

  describe("Handover End-to-End Integration", () => {
    it("should get correct handover agent and prompt", () => {

      const nextAgent = workflowService.getHandoverAgent("IRAnalysis")
      expect(nextAgent).toBe("HArchitect")

      const handoverPrompt = workflowService.getHandoverPrompt(null, "IRAnalysis")
      expect(handoverPrompt).toBeTruthy()
      expect(handoverPrompt!.length).toBeGreaterThan(0)
    })

    it("should initialize state for handover execution", async () => {
      const state = await workflowService.executeHandover()
      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("current")
    });
      
    it("should get correct agent for each stage", () => {
      expect(workflowService.getHandoverAgent("IRAnalysis")).toBe("HArchitect")
      expect(workflowService.getHandoverAgent("scenarioAnalysis")).toBe("HArchitect")
      expect(workflowService.getHandoverAgent("useCaseAnalysis")).toBe("HArchitect")
      expect(workflowService.getHandoverAgent("functionalRefinement")).toBe("HArchitect")
      expect(workflowService.getHandoverAgent("requirementDecomposition")).toBe("HEngineer")
      expect(workflowService.getHandoverAgent("systemFunctionalDesign")).toBe("HEngineer")
      expect(workflowService.getHandoverAgent("moduleFunctionalDesign")).toBe("HEngineer")
    })
  })

  describe("Prompt Loading Integration", () => {
    it("should load prompts for all stages", () => {
      const workflow = getClassicWorkflow()

      for (const stage of workflow.stageOrder) {
        const prompt = loadPromptForStage(stage, workflow)
        expect(prompt).toBeTruthy()
        expect(prompt.length).toBeGreaterThan(0)
      }
    })

    it("should return workflow prompt for invalid stage", () => {
      const workflow = getClassicWorkflow()
      const prompt = loadPromptForStage("invalidStage", workflow)
      expect(prompt.length).toBeGreaterThan(0)
    })

    it("should load workflow overview prompt", () => {
      const workflow = getClassicWorkflow()
      const prompt = loadPromptForStage(null, workflow)

      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe("Config Default Behavior", () => {
    it("should default to classic workflow when not specified", () => {
      const config = loadHDConfig()
      expect(config.workflow).toBe("classic")
    })

    it("should merge agent configs with defaults", () => {
      const config = loadHDConfig()

      expect(config.agents.HArchitect).toBeDefined()
      expect(config.agents.HEngineer).toBeDefined()
      expect(config.agents.HCritic).toBeDefined()

      expect(config.agents.HArchitect.temperature).toBe(0.6)
      expect(config.agents.HArchitect.maxTokens).toBeUndefined()
    })
  })

  describe("Extensibility Verification", () => {
    it("should verify workflow registry is extensible", () => {
      expect(getWorkflowDefinition("classic")).toBeDefined()

      const workflow = getClassicWorkflow()
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
        expect(stage.promptBindings ?? stage.promptFile).toBeTruthy()
        expect(stage).toHaveProperty("getHandoverPrompt")
      }
    })

    it("should verify new workflow can be added by config change", () => {
      const config = loadHDConfig()
      const workflow = getWorkflowDefinition(config.workflow!)

      expect(workflow!.id).toBe(config.workflow)
    })
  })

  describe("Backward Compatibility Verification", () => {
    it("should maintain existing workflow state structure", () => {
      const workflow = getClassicWorkflow()
      const state = initializeWorkflowState(workflow)

      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("current")
      
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
      expect(agent.maxTokens).toBeUndefined()
      expect(agent).toHaveProperty("color")
      expect(agent).toHaveProperty("permission")
      // tools 字段在 OpenCode 转换层从 permission 生成，不在 LocalAgentConfig 中
    })
  })
})

describe("No premature .hyper-designer directory creation", () => {
  /**
   * Regression guard: importing the plugin, loading config, reading workflow
   * definitions, or creating agents must NOT cause the .hyper-designer
   * directory to appear on disk.  Only explicit state writes (setStage,
   * executeHandover) may create it.
   */
  let hdDirExistedBefore: boolean

  beforeEach(() => {
    hdDirExistedBefore = existsSync(PROJECT_CONFIG_DIR)
  })

  it("importing plugin module does not create .hyper-designer", async () => {
    // HyperDesignerPlugin is already imported at the top of this file;
    // the import itself must not create the directory.
    if (!hdDirExistedBefore) {
      expect(existsSync(PROJECT_CONFIG_DIR)).toBe(false)
    }
  })

  it("loadHDConfig() does not create .hyper-designer", () => {
    loadHDConfig()
    if (!hdDirExistedBefore) {
      expect(existsSync(PROJECT_CONFIG_DIR)).toBe(false)
    }
  })

  it("getWorkflowDefinition() does not create .hyper-designer", () => {
    getWorkflowDefinition("classic")
    if (!hdDirExistedBefore) {
      expect(existsSync(PROJECT_CONFIG_DIR)).toBe(false)
    }
  })

  it("createHArchitectAgent() does not create .hyper-designer", () => {
    createHArchitectAgent()
    if (!hdDirExistedBefore) {
      expect(existsSync(PROJECT_CONFIG_DIR)).toBe(false)
    }
  })

  it("HyperDesignerPlugin() initialisation does not create .hyper-designer", async () => {
    const mockCtx = {
      client: { session: { prompt: async () => { } } },
      directory: process.cwd(),
    } as unknown as PluginInput
    await HyperDesignerPlugin(mockCtx)
    if (!hdDirExistedBefore) {
      expect(existsSync(PROJECT_CONFIG_DIR)).toBe(false)
    }
  })
})
