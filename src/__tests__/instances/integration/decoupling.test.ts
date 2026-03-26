import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { PluginInput } from "@opencode-ai/plugin"
import { loadHDConfig, DEFAULT_CONFIG_PATH, GLOBAL_CONFIG_PATH } from "../../../config/loader"
import { getWorkflowDefinition } from "../../../workflows"
import { createHArchitectAgent } from '../../../builtin/agents/HArchitect'
import { HyperDesignerPlugin } from "../../../../opencode/.plugins/hyper-designer"

vi.mock("@opencode-ai/plugin", () => {
  const tool = (definition: Record<string, unknown>) => definition
  const chainable: Record<string, unknown> = {}
  const chainFn = () => chainable
  chainable.describe = chainFn
  chainable.optional = chainFn
  chainable.nullable = chainFn
  chainable.min = chainFn
  chainable.max = chainFn
  const objectFn = (_args?: Record<string, unknown>) => chainable
  const arrayFn = (_item?: unknown) => chainable
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
    number: () => chainable,
    string: () => chainable,
    object: objectFn,
    array: arrayFn,
  }
  return { tool }
})
import type { WorkflowDefinition } from "../../../workflows"

import {
  getStageOrder,
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

function initClassicWorkflowSelection(): void {
  const detail = workflowService.getWorkflowDetail("classic")
  if (!detail) {
    throw new Error("Classic workflow detail should be defined")
  }

  const stages = detail.stages.map(stage => ({ key: stage.key, selected: true }))
  const result = workflowService.selectWorkflow({ typeId: "classic", stages })
  if (!result.success) {
    throw new Error(result.error ?? "Failed to select classic workflow")
  }
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
      expect(config.agents).toBeDefined()

      const workflow = getWorkflowDefinition("classic")
      expect(workflow).not.toBeNull()
      expect(workflow!.id).toBe("classic")
      expect(workflow!.name).toBeDefined()

      const stageOrder = getStageOrder(workflow!)
      expect(stageOrder.length).toBeGreaterThan(0)

      const agent = createHArchitectAgent()
      expect(agent.prompt).toBeTruthy()
      expect(agent.name).toBe("HArchitect")
      expect(agent.mode).toBe("primary")
    })

    it("should configure plugin agent handler with mapped agents", async () => {
      initClassicWorkflowSelection()

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

    it("should verify extensibility: workflow definition can be loaded", () => {
      const workflow = getWorkflowDefinition("classic")
      expect(workflow!.id).toBe("classic")
    })
  })

  describe("Workflow State Lifecycle Integration", () => {
    beforeEach(() => {
      initClassicWorkflowSelection()
    })

    it("should manage workflow state lifecycle with classic workflow", () => {
      const workflow = getClassicWorkflow()
      const state = initializeWorkflowState(workflow)

      expect(Object.keys(state.workflow).length).toBeGreaterThan(0)
      expect(state.current).toBeNull()
    })

    it("should complete stages and persist to disk", () => {
      const state = workflowService.setStage("IRAnalysis", true)
      expect(state.workflow.IRAnalysis?.mark).toBe(true)
      expect(existsSync(STATE_FILE)).toBe(true)
    })

    it("should transition through multiple stages", () => {
      let state = workflowService.setStage("IRAnalysis", true)
      expect(state.workflow.IRAnalysis.mark).toBe(true)

      state = workflowService.setStage("scenarioAnalysis", true)
      expect(state.workflow.IRAnalysis.mark).toBe(true)
      expect(state.workflow.scenarioAnalysis.mark).toBe(true)
    })
  })

  describe("Handover End-to-End Integration", () => {
    beforeEach(() => {
      initClassicWorkflowSelection()
    })

    it("should get correct handover agent and prompt", () => {
      const nextAgent = workflowService.getHandoverAgent("IRAnalysis")
      expect(nextAgent).toBeTruthy()

      const handoverPrompt = workflowService.getHandoverPrompt(null, "IRAnalysis")
      expect(handoverPrompt).toBeTruthy()
      expect(handoverPrompt!.length).toBeGreaterThan(0)
    })

    it("should initialize state for handover execution", async () => {
      const state = await workflowService.executeHandover()
      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("current")
    })
  })

  describe("Prompt Loading Integration", () => {
    it("should load prompts for all stages", () => {
      const workflow = getClassicWorkflow()

      for (const stage of getStageOrder(workflow)) {
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
    it("should load config with agents", () => {
      const config = loadHDConfig()
      expect(config.agents).toBeDefined()
    })

    it("should merge agent configs with defaults", () => {
      const config = loadHDConfig()

      expect(config.agents.HArchitect).toBeDefined()
      expect(config.agents.HEngineer).toBeDefined()
      expect(config.agents.HCritic).toBeDefined()

      expect(typeof config.agents.HArchitect.temperature).toBe('number')
    })
  })

  describe("Extensibility Verification", () => {
    it("should verify workflow registry is extensible", () => {
      expect(getWorkflowDefinition("classic")).toBeDefined()

      const workflow = getClassicWorkflow()
      expect(workflow).toHaveProperty("id")
      expect(workflow).toHaveProperty("name")
      expect(workflow).toHaveProperty("description")
      expect(workflow).toHaveProperty("stages")

      for (const stageName of getStageOrder(workflow)) {
        const stage = workflow.stages[stageName]
        expect(stage).toHaveProperty("name")
        expect(stage).toHaveProperty("description")
        expect(stage).toHaveProperty("agent")
        expect(stage.promptBindings ?? stage.promptFile).toBeTruthy()
        expect(stage).toHaveProperty("getHandoverPrompt")
      }
    })

    it("should verify workflow definition can be loaded by id", () => {
      const workflow = getWorkflowDefinition("classic")
      expect(workflow!.id).toBe("classic")
    })
  })

  describe("Backward Compatibility Verification", () => {
    it("should maintain existing workflow state structure", () => {
      const workflow = getClassicWorkflow()
      const state = initializeWorkflowState(workflow)

      expect(state).toHaveProperty("workflow")
      expect(state).toHaveProperty("current")

      for (const stageName of getStageOrder(workflow)) {
        expect(state.workflow[stageName]).toHaveProperty("mark")
        expect(typeof state.workflow[stageName].mark).toBe("boolean")
      }
    })

    it("should maintain agent config structure", () => {
      const agent = createHArchitectAgent()

      expect(agent).toHaveProperty("name")
      expect(agent).toHaveProperty("description")
      expect(agent).toHaveProperty("mode")
      expect(agent).toHaveProperty("prompt")
      expect(agent).toHaveProperty("temperature")
      expect(typeof agent.temperature).toBe('number')
      if (agent.maxTokens !== undefined) {
        expect(typeof agent.maxTokens).toBe('number')
      }
      expect(agent).toHaveProperty("color")
      expect(agent).toHaveProperty("permission")
    })
  })
})

describe("No premature .hyper-designer directory creation", () => {
  let hdDirExistedBefore: boolean

  beforeEach(() => {
    hdDirExistedBefore = existsSync(PROJECT_CONFIG_DIR)
  })

  it("importing plugin module does not create .hyper-designer", async () => {
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
