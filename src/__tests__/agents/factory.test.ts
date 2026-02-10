import { describe, it, expect } from "vitest"
import { createAgent } from "../../agents/factory"
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
    promptFiles: ["test.md"],
    defaultPermission: { read: "allow" },
    defaultTools: { bash: true },
  }

  it("reads prompt files and concatenates them", () => {
    // Setup test directory
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "# Test Prompt")

    const agent = createAgent(baseDefinition, TEST_DIR)

    expect(agent.prompt).toContain("# Test Prompt")

    // Cleanup
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("handles missing prompt files gracefully", () => {
    const agent = createAgent(baseDefinition, "/nonexistent-dir")

    expect(agent.prompt).toContain("TestAgent - Failed to load test.md")
  })

  it("falls back to defaults when no config override", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agent = createAgent(baseDefinition, TEST_DIR)

    expect(agent.temperature).toBe(0.5)
    expect(agent.maxTokens).toBe(8000)
    expect(agent.permission).toEqual({ read: "allow" })

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("returns correct AgentConfig shape", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agent = createAgent(baseDefinition, TEST_DIR, "gpt-4")

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

  it("concatenates multiple prompt files", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "part1.md"), "# Part 1")
    writeFileSync(join(TEST_DIR, "part2.md"), "# Part 2")

    const multiFileDefinition: AgentDefinition = {
      ...baseDefinition,
      promptFiles: ["part1.md", "part2.md"],
    }

    const agent = createAgent(multiFileDefinition, TEST_DIR)

    expect(agent.prompt).toContain("# Part 1")
    expect(agent.prompt).toContain("# Part 2")

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("handles model parameter correctly", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agentWithModel = createAgent(baseDefinition, TEST_DIR, "claude-3")
    expect(agentWithModel.model).toBe("claude-3")

    const agentWithoutModel = createAgent(baseDefinition, TEST_DIR)
    expect(agentWithoutModel.model).toBeUndefined()

    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe("AgentDefinition promptTools", () => {
    it("should accept optional promptTools field", () => {
      const definition: AgentDefinition = {
        name: "TestAgent",
        description: "Test",
        mode: "primary" as AgentMode,
        color: "#000000",
        defaultTemperature: 0.7,
        defaultMaxTokens: 32000,
        promptFiles: ["test.md"],
        promptTools: ["ask_user", "task"],
        defaultPermission: {},
        defaultTools: {},
      }

      expect(definition.promptTools).toEqual(["ask_user", "task"])
    })

    it("should work without promptTools field", () => {
      const definition: AgentDefinition = {
        name: "TestAgent",
        description: "Test",
        mode: "primary" as AgentMode,
        color: "#000000",
        defaultTemperature: 0.7,
        defaultMaxTokens: 32000,
        promptFiles: ["test.md"],
        defaultPermission: {},
        defaultTools: {},
      }

      expect(definition.promptTools).toBeUndefined()
    })
  })

})
