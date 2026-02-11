import { describe, it, expect } from "vitest"
import { createAgent, filePrompt, toolsPrompt } from "../../agents/factory"
import type { AgentDefinition } from "../../agents/factory"
import type { AgentMode } from "../../agents/types"
import { writeFileSync, mkdirSync, rmSync } from "fs"
import { join } from "path"

const TEST_DIR = join(process.cwd(), ".test-temp", "factory-tests")

describe("createAgent", () => {
  const baseDefinition: AgentDefinition = {
    name: "TestAgent",
    description: "Test agent for unit tests",
    mode: "primary" as AgentMode,
    color: "#FF0000",
    defaultTemperature: 0.5,
    defaultMaxTokens: 8000,
    promptGenerators: [filePrompt(join(TEST_DIR, "test.md"))],
    defaultPermission: { read: "allow" },
    defaultTools: { bash: true },
  }

  it("reads prompt files and concatenates them", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "# Test Prompt")

    const agent = createAgent(baseDefinition)

    expect(agent.prompt).toContain("# Test Prompt")

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("handles missing prompt files gracefully", () => {
    const agent = createAgent(baseDefinition)

    expect(agent.prompt).toContain("Failed to load")
  })

  it("falls back to defaults when no config override", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agent = createAgent(baseDefinition)

    expect(agent.temperature).toBe(0.5)
    expect(agent.maxTokens).toBe(8000)
    expect(agent.permission).toEqual({ read: "allow" })

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("returns correct AgentConfig shape", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agent = createAgent(baseDefinition, "gpt-4")

    expect(agent).toHaveProperty("name", "TestAgent")
    expect(agent).toHaveProperty("description")
    expect(agent).toHaveProperty("mode", "primary")
    expect(agent).toHaveProperty("temperature")
    expect(agent).toHaveProperty("maxTokens")
    expect(agent).toHaveProperty("prompt")
    expect(agent).toHaveProperty("permission")
    expect(agent).toHaveProperty("color")
    expect(agent).toHaveProperty("tools")
    expect(agent.model).toBe("gpt-4")

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("concatenates multiple prompt generators", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "part1.md"), "# Part 1")
    writeFileSync(join(TEST_DIR, "part2.md"), "# Part 2")

    const multiFileDefinition: AgentDefinition = {
      ...baseDefinition,
      promptGenerators: [
        filePrompt(join(TEST_DIR, "part1.md")),
        filePrompt(join(TEST_DIR, "part2.md")),
      ],
    }

    const agent = createAgent(multiFileDefinition)

    expect(agent.prompt).toContain("# Part 1")
    expect(agent.prompt).toContain("# Part 2")

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("handles model parameter correctly", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agentWithModel = createAgent(baseDefinition, "claude-3")
    expect(agentWithModel.model).toBe("claude-3")

    const agentWithoutModel = createAgent(baseDefinition)
    expect(agentWithoutModel.model).toBeUndefined()

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe("promptGenerators", () => {
    it("should accept filePrompt and toolsPrompt generators", () => {
      mkdirSync(TEST_DIR, { recursive: true })
      writeFileSync(join(TEST_DIR, "test.md"), "Identity content")

      const definition: AgentDefinition = {
        name: "TestAgent",
        description: "Test",
        mode: "primary" as AgentMode,
        color: "#000000",
        defaultTemperature: 0.7,
        defaultMaxTokens: 32000,
        promptGenerators: [
          filePrompt(join(TEST_DIR, "test.md")),
          toolsPrompt(["ask_user"]),
        ],
        defaultPermission: {},
        defaultTools: {},
      }

      const agent = createAgent(definition)
      expect(agent.prompt).toContain("Identity content")

      rmSync(TEST_DIR, { recursive: true, force: true })
    })

    it("should allow empty promptGenerators array", () => {
      const definition: AgentDefinition = {
        name: "TestAgent",
        description: "Test",
        mode: "primary" as AgentMode,
        color: "#000000",
        defaultTemperature: 0.7,
        defaultMaxTokens: 32000,
        promptGenerators: [],
        defaultPermission: {},
        defaultTools: {},
      }

      const agent = createAgent(definition)
      expect(agent.prompt).toBe("")
    })
  })

})
