import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, rmSync } from "fs"
import { join } from "path"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { createHCollectorAgent } from "../../../agents/HCollector"
import { createHEngineerAgent } from "../../../agents/HEngineer"
import { createHCriticAgent } from "../../../agents/HCritic"
import type { RuntimeType } from "../../../tools"
import { loadPromptForStage } from "../../../workflows/core/prompts"
import { getWorkflowDefinition } from "../../../workflows/core/registry"
import { initializeWorkflowState } from "../../../workflows/core/state"

const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json")

function expectNoToolPlaceholders(prompt: string) {
  expect(prompt).not.toMatch(/\{\{TOOL:/)
}

describe("Integration Tests: Prompt Composition", () => {
  beforeEach(() => {
    if (existsSync(WORKFLOW_STATE_PATH)) {
      rmSync(WORKFLOW_STATE_PATH, { force: true })
    }
  })

  afterEach(() => {
    if (existsSync(WORKFLOW_STATE_PATH)) {
      rmSync(WORKFLOW_STATE_PATH, { force: true })
    }
  })

  it("creates HArchitect agent with valid configuration", () => {
    const agent = createHArchitectAgent(undefined, "opencode" as RuntimeType)

    expect(agent.name).toBe("HArchitect")
    expect(agent.mode).toBe("primary")
    expect(agent.prompt).toBeTruthy()
    expect(agent.prompt!.length).toBeGreaterThan(0)
    expectNoToolPlaceholders(agent.prompt!)
    expect(agent.prompt).toContain("{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}")
    expect(agent.prompt).toContain("{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}")
  })

  it("creates HEngineer agent with valid configuration", () => {
    const agent = createHEngineerAgent(undefined, "opencode" as RuntimeType)

    expect(agent.name).toBe("HEngineer")
    expect(agent.prompt).toBeTruthy()
    expect(agent.prompt!.length).toBeGreaterThan(0)
    expectNoToolPlaceholders(agent.prompt!)
  })

  it("creates HCollector agent with valid configuration", () => {
    const agent = createHCollectorAgent(undefined, "opencode" as RuntimeType)

    expect(agent.name).toBe("HCollector")
    expect(agent.prompt).toBeTruthy()
    expect(agent.prompt!.length).toBeGreaterThan(0)
    expectNoToolPlaceholders(agent.prompt!)
  })

  it("creates HCritic agent with valid configuration", () => {
    const agent = createHCriticAgent(undefined, "opencode" as RuntimeType)

    expect(agent.name).toBe("HCritic")
    expect(agent.prompt).toBeTruthy()
    expect(agent.prompt!.length).toBeGreaterThan(0)
    expectNoToolPlaceholders(agent.prompt!)
  })

  it("initializes workflow state with correct typeId", () => {
    const workflow = getWorkflowDefinition("classic")
    if (!workflow) {
      throw new Error("Classic workflow should be defined")
    }

    const state = initializeWorkflowState(workflow)
    expect(state.typeId).toBe(workflow.id)
  })

  it("loads workflow prompt content for classic workflow", () => {
    const workflow = getWorkflowDefinition("classic")
    if (!workflow) {
      throw new Error("Classic workflow should be defined")
    }

    const prompt = loadPromptForStage(null, workflow)
    expect(prompt).toBeTruthy()
    expect(prompt.length).toBeGreaterThan(0)
    expectNoToolPlaceholders(prompt)
  })
})
