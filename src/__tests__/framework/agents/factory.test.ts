import { describe, it, expect, afterEach, beforeEach } from "vitest"
import { createAgent, filePrompt, toolsPrompt } from "../../../agents/factory"
import type { AgentDefinition } from "../../../agents/factory"
import type { AgentMode } from "../../../agents/types"
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"

const TEST_DIR = join(process.cwd(), ".test-temp", "factory-tests")
const PROJECT_CONFIG_PATH = process.env.HD_PROJECT_CONFIG_PATH
  ? join(process.cwd(), process.env.HD_PROJECT_CONFIG_PATH)
  : join(process.cwd(), ".hyper-designer", "hd-config.json")
const PROJECT_CONFIG_DIR = dirname(PROJECT_CONFIG_PATH)
const ORIGINAL_GLOBAL_CONFIG_PATH = process.env.HD_GLOBAL_CONFIG_PATH
  ? join(process.cwd(), process.env.HD_GLOBAL_CONFIG_PATH)
  : join(process.env.HOME ?? process.cwd(), ".config", "opencode", "hyper-designer", "hd-config.json")

let originalProjectConfig: string | null = null
let originalGlobalConfig: string | null = null

describe("createAgent", () => {
  beforeEach(() => {
    snapshotConfigs()
  })

  afterEach(() => {
    if (originalProjectConfig !== null) {
      mkdirSync(PROJECT_CONFIG_DIR, { recursive: true })
      writeFileSync(PROJECT_CONFIG_PATH, originalProjectConfig)
    } else if (existsSync(PROJECT_CONFIG_PATH)) {
      rmSync(PROJECT_CONFIG_PATH, { force: true })
    }

    if (originalGlobalConfig !== null) {
      mkdirSync(dirname(ORIGINAL_GLOBAL_CONFIG_PATH), { recursive: true })
      writeFileSync(ORIGINAL_GLOBAL_CONFIG_PATH, originalGlobalConfig)
    } else if (existsSync(ORIGINAL_GLOBAL_CONFIG_PATH)) {
      rmSync(ORIGINAL_GLOBAL_CONFIG_PATH, { force: true })
    }

    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }

    originalProjectConfig = null
    originalGlobalConfig = null
  })

  const snapshotConfigs = () => {
    originalProjectConfig = existsSync(PROJECT_CONFIG_PATH)
      ? readFileSync(PROJECT_CONFIG_PATH, "utf-8")
      : null
    originalGlobalConfig = existsSync(ORIGINAL_GLOBAL_CONFIG_PATH)
      ? readFileSync(ORIGINAL_GLOBAL_CONFIG_PATH, "utf-8")
      : null
  }
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

  it("logs fallback when prompt files are missing", () => {
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

  it("applies config overrides from hd-config", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    mkdirSync(PROJECT_CONFIG_DIR, { recursive: true })
    const config = {
      agents: {
        TestAgent: {
          temperature: 0.8,
          maxTokens: 2000,
          model: "gpt-4",
        }
      }
    }
    writeFileSync(PROJECT_CONFIG_PATH, JSON.stringify(config, null, 2))

    const agent = createAgent(baseDefinition, "gpt-3")

    expect(agent.temperature).toBe(0.8)
    expect(agent.maxTokens).toBe(2000)
    expect(agent.model).toBe("gpt-4")
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
