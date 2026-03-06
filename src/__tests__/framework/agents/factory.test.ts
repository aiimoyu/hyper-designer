import { describe, it, expect, afterEach, beforeEach, vi } from "vitest"
import { createAgent, filePrompt, stringPrompt } from "../../../agents/factory"
import { HyperDesignerLogger } from "../../../utils/logger"
import type { AgentDefinition } from "../../../agents/factory"
import type { AgentMode } from "../../../agents/types"
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { createTempTestDir, cleanupTempDir } from "../../helpers/tempDir"

let TEST_DIR = ""
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
    TEST_DIR = createTempTestDir("factory-tests")
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

    cleanupTempDir(TEST_DIR)



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
  const getBaseDefinition = () => ({
    name: "TestAgent",
    description: "Test agent for unit tests",
    mode: "primary" as AgentMode,
    color: "#FF0000",
    defaultTemperature: 0.5,
    defaultMaxTokens: 8000,
    promptGenerators: [filePrompt(join(TEST_DIR, "test.md"))],
    defaultPermission: { read: "allow" },
    defaultTools: { bash: true },
  })

  it("reads prompt files and concatenates them", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "# Test Prompt")

    const agent = createAgent(getBaseDefinition())

    expect(agent.prompt).toContain("# Test Prompt")


  })

  it("handles missing prompt files gracefully", () => {
    const loggerSpy = vi.spyOn(HyperDesignerLogger, 'warn')
    const agent = createAgent(getBaseDefinition())
    expect(loggerSpy).toHaveBeenCalled()
    expect(agent.prompt).toContain("Failed to load")
    loggerSpy.mockRestore()
  })

  it("falls back to defaults when no config override", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agent = createAgent(getBaseDefinition())

    expect(agent.temperature).toBe(0.5)
    expect(agent.maxTokens).toBe(8000)
    expect(agent.permission).toEqual({ read: "allow" })


  })

  it("returns correct AgentConfig shape", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "test.md"), "Content")

    const agent = createAgent(getBaseDefinition(), "gpt-4")

    expect(agent).toHaveProperty("name", "TestAgent")
    expect(agent).toHaveProperty("description")
    expect(agent).toHaveProperty("mode", "primary")
    expect(agent).toHaveProperty("temperature")
    expect(agent).toHaveProperty("maxTokens")
    expect(agent).toHaveProperty("prompt")
    expect(agent).toHaveProperty("permission")
    expect(agent).toHaveProperty("color")
    // tools 字段在 OpenCode 转换层从 permission 生成，不在 LocalAgentConfig 中
    expect(agent.model).toBe("gpt-4")


  })

  it("concatenates multiple prompt generators", () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, "part1.md"), "# Part 1")
    writeFileSync(join(TEST_DIR, "part2.md"), "# Part 2")

    const multiFileDefinition: AgentDefinition = {
      ...getBaseDefinition(),
      promptGenerators: [
        filePrompt(join(TEST_DIR, "part1.md")),
        filePrompt(join(TEST_DIR, "part2.md")),
      ],
    }

    const agent = createAgent(multiFileDefinition)

    expect(agent.prompt).toContain("# Part 1")
    expect(agent.prompt).toContain("# Part 2")


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

    const agent = createAgent(getBaseDefinition(), "gpt-3")

    expect(agent.temperature).toBe(0.8)
    expect(agent.maxTokens).toBe(2000)
    expect(agent.model).toBe("gpt-4")
  })

  describe("promptGenerators", () => {
    it("should accept filePrompt and stringPrompt generators", () => {
      mkdirSync(TEST_DIR, { recursive: true })
      writeFileSync(join(TEST_DIR, "test.md"), "Identity content")

      const definition: AgentDefinition = {
        name: "TestAgent",
        description: "Test",
        mode: "primary" as AgentMode,
        color: "#000000",
        defaultTemperature: 0.6,
        defaultMaxTokens: 32000,
        promptGenerators: [
          filePrompt(join(TEST_DIR, "test.md")),
          stringPrompt("Additional prompt content"),
        ],
      }

      const agent = createAgent(definition)
      expect(agent.prompt).toContain("Identity content")
      expect(agent.prompt).toContain("Additional prompt content")
    })

    it("should allow empty promptGenerators array", () => {
      const definition: AgentDefinition = {
        name: "TestAgent",
        description: "Test",
        mode: "primary" as AgentMode,
        color: "#000000",
        defaultTemperature: 0.6,
        defaultMaxTokens: 32000,
        promptGenerators: [],
      }

      const agent = createAgent(definition)
      expect(agent.prompt).toBe("")
    })
  })
})
