import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { readFileSync, existsSync, rmSync } from "fs"
import { join } from "path"
import { createHArchitectAgent } from "../../agents/HArchitect"
import { createHCollectorAgent } from "../../agents/HCollector"
import { createHEngineerAgent } from "../../agents/HEngineer"
import { createHCriticAgent } from "../../agents/HCritic"
import type { RuntimeType } from "../../tools"
import { getWorkflowDefinition } from "../../workflows/core/registry"
import { getWorkflowState } from "../../workflows/core/state"

const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json")

const PROMPT_FILES = {
  HArchitect: ["identity.md", "constraints.md", "step.md", "workflow.md", "standard.md", "interview.md"],
  HCollector: ["identity.md", "constraints.md", "step.md", "standard.md", "interview.md"],
  HEngineer: ["identity.md", "constraints.md", "step.md", "workflow.md", "standard.md", "interview.md"],
  HCritic: ["identity.md", "constraints.md", "step.md", "standard.md", "interview.md"],
}




function getPromptsDir(agentName: keyof typeof PROMPT_FILES): string {
  return join(process.cwd(), "src", "agents", agentName, "prompts")
}

function getFirstNonEmptyLine(filePath: string): string {
  const content = readFileSync(filePath, "utf-8")
  const line = content.split("\n").find(lineValue => lineValue.trim().length > 0)
  if (!line) {
    throw new Error(`Prompt file is empty: ${filePath}`)
  }
  return line
}

function expectPromptOrder(prompt: string, markers: string[]) {
  const indices = markers.map(marker => prompt.indexOf(marker))

  for (const index of indices) {
    expect(index).toBeGreaterThanOrEqual(0)
  }

  for (let index = 1; index < indices.length; index += 1) {
    expect(indices[index]).toBeGreaterThan(indices[index - 1])
  }
}

function expectToolsPrompt(prompt: string) {
  expect(prompt).toContain("## 可用工具")
  expect(prompt).toContain("**语法**（opencode）")
  expect(prompt).toContain("### ask_user")
  expect(prompt).toContain("### task")
  expect(prompt).toContain("question({")
  expect(prompt).toContain("task({")
}

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

  it("should compose HArchitect prompt with split files, tools, and no placeholders", () => {
    const agent = createHArchitectAgent(undefined, "opencode" as RuntimeType)
    const prompt = agent.prompt ?? ""

    const promptsDir = getPromptsDir("HArchitect")
    const markers = PROMPT_FILES.HArchitect.map(fileName =>
      getFirstNonEmptyLine(join(promptsDir, fileName))
    )

    expectPromptOrder(prompt, markers)
    expectToolsPrompt(prompt)
    expectNoToolPlaceholders(prompt)
  })

  it("should compose HEngineer prompt with split files, tools, and no placeholders", () => {
    const agent = createHEngineerAgent(undefined, "opencode" as RuntimeType)
    const prompt = agent.prompt ?? ""

    const promptsDir = getPromptsDir("HEngineer")
    const markers = PROMPT_FILES.HEngineer.map(fileName =>
      getFirstNonEmptyLine(join(promptsDir, fileName))
    )

    expectPromptOrder(prompt, markers)
    expectToolsPrompt(prompt)
    expectNoToolPlaceholders(prompt)
  })

  it("should compose HCollector prompt without workflow content", () => {
    const agent = createHCollectorAgent(undefined, "opencode" as RuntimeType)
    const prompt = agent.prompt ?? ""

    const promptsDir = getPromptsDir("HCollector")
    const markers = PROMPT_FILES.HCollector.map(fileName =>
      getFirstNonEmptyLine(join(promptsDir, fileName))
    )

    const hArchitectWorkflowMarker = getFirstNonEmptyLine(
      join(getPromptsDir("HArchitect"), "workflow.md")
    )
    const hEngineerWorkflowMarker = getFirstNonEmptyLine(
      join(getPromptsDir("HEngineer"), "workflow.md")
    )

    expectPromptOrder(prompt, markers)
    expect(prompt).not.toContain(hArchitectWorkflowMarker)
    expect(prompt).not.toContain(hEngineerWorkflowMarker)
    expectToolsPrompt(prompt)
    expectNoToolPlaceholders(prompt)
  })

  it("should compose HCritic prompt without workflow content", () => {
    const agent = createHCriticAgent(undefined, "opencode" as RuntimeType)
    const prompt = agent.prompt ?? ""

    const promptsDir = getPromptsDir("HCritic")
    const markers = PROMPT_FILES.HCritic.map(fileName =>
      getFirstNonEmptyLine(join(promptsDir, fileName))
    )

    const hArchitectWorkflowMarker = getFirstNonEmptyLine(
      join(getPromptsDir("HArchitect"), "workflow.md")
    )
    const hEngineerWorkflowMarker = getFirstNonEmptyLine(
      join(getPromptsDir("HEngineer"), "workflow.md")
    )

    expectPromptOrder(prompt, markers)
    expect(prompt).not.toContain(hArchitectWorkflowMarker)
    expect(prompt).not.toContain(hEngineerWorkflowMarker)
    expectToolsPrompt(prompt)
    expectNoToolPlaceholders(prompt)
  })

  it("should persist typeId when initializing workflow state", () => {
    const workflow = getWorkflowDefinition("traditional")
    const state = getWorkflowState()
    if (!state) {
      throw new Error("Workflow state should be initialized")
    }

    expect(state.typeId).toBe(workflow.id)

    const persisted = JSON.parse(readFileSync(WORKFLOW_STATE_PATH, "utf-8")) as {
      typeId?: string
    }

    expect(persisted.typeId).toBe(workflow.id)
  })
})
