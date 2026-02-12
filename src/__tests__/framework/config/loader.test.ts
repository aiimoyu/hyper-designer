import { describe, it, expect, afterEach, beforeEach } from "vitest"
import { loadHDConfig, DEFAULT_AGENT_CONFIGS, DEFAULT_CONFIG_PATH } from "../../../config/loader"
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"

const TEST_CONFIG_DIR = join(process.cwd(), ".test-temp", "config-tests")
const TEST_CONFIG_PATH = join(TEST_CONFIG_DIR, "hd-config.json")
const PROJECT_CONFIG_DIR = join(process.cwd(), ".test-temp", "config-tests")
const PROJECT_CONFIG_PATH = join(PROJECT_CONFIG_DIR, DEFAULT_CONFIG_PATH)
const GLOBAL_CONFIG_DIR = join(process.cwd(), ".test-temp", "config-tests")
const GLOBAL_CONFIG_PATH = join(GLOBAL_CONFIG_DIR, "global-hd-config.json")

let originalGlobalConfig: string | null = null
let originalProjectConfig: string | null = null

describe("loadHDConfig", () => {
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
      mkdirSync(dirname(GLOBAL_CONFIG_PATH), { recursive: true })
      writeFileSync(GLOBAL_CONFIG_PATH, originalGlobalConfig)
    } else if (existsSync(GLOBAL_CONFIG_PATH)) {
      rmSync(GLOBAL_CONFIG_PATH, { force: true })
    }

    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    }

    if (existsSync(GLOBAL_CONFIG_DIR) && GLOBAL_CONFIG_DIR !== TEST_CONFIG_DIR) {
      rmSync(GLOBAL_CONFIG_DIR, { recursive: true, force: true })
    }

    originalProjectConfig = null
    originalGlobalConfig = null
  })

  const snapshotConfigs = () => {
    originalProjectConfig = existsSync(PROJECT_CONFIG_PATH)
      ? readFileSync(PROJECT_CONFIG_PATH, "utf-8")
      : null
    originalGlobalConfig = existsSync(GLOBAL_CONFIG_PATH)
      ? readFileSync(GLOBAL_CONFIG_PATH, "utf-8")
      : null
  }

  it("returns default config when no file exists", () => {
    const config = loadHDConfig("/nonexistent/path/config.json")

    expect(config).toHaveProperty("agents")
    expect(config.agents).toEqual(DEFAULT_AGENT_CONFIGS)
    expect(config.workflow).toBe("classic")
  })

  it("loads valid config file", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })

    const testConfig = {
      agents: {
        HArchitect: {
          temperature: 0.9,
          maxTokens: 16000,
        },
      },
    }

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.agents.HArchitect.temperature).toBe(0.9)
    expect(config.agents.HArchitect.maxTokens).toBe(16000)
    expect(config.workflow).toBe("classic")
  })

  it("merges config with defaults", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })

    const testConfig = {
      agents: {
        HArchitect: {
          temperature: 0.8,
        },
      },
    }

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.agents.HArchitect.temperature).toBe(0.8)
    expect(config.agents.HCollector).toEqual(DEFAULT_AGENT_CONFIGS.HCollector)
    expect(config.agents.HCritic).toEqual(DEFAULT_AGENT_CONFIGS.HCritic)
    expect(config.agents.HEngineer).toEqual(DEFAULT_AGENT_CONFIGS.HEngineer)
    expect(config.workflow).toBe("classic")
  })

  it("handles invalid JSON gracefully", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })
    writeFileSync(TEST_CONFIG_PATH, "{ invalid json }")

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.agents).toEqual(DEFAULT_AGENT_CONFIGS)
    expect(config.workflow).toBe("classic")
  })

  it("handles empty config file", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })
    writeFileSync(TEST_CONFIG_PATH, "{}")

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.agents).toEqual(DEFAULT_AGENT_CONFIGS)
    expect(config.workflow).toBe("classic")
  })

  it("preserves $schema field if present", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })

    const testConfig = {
      $schema: "https://example.com/schema.json",
      agents: {},
    }

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.$schema).toBe("https://example.com/schema.json")
    expect(config.workflow).toBe("classic")
  })

  it("handles config with additional agent overrides", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })

    const testConfig = {
      agents: {
        HCollector: {
          model: "gpt-4-turbo",
          temperature: 0.5,
          prompt_append: "Additional instructions",
          permission: { write: "deny" },
        },
      },
    }

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.agents.HCollector.model).toBe("gpt-4-turbo")
    expect(config.agents.HCollector.temperature).toBe(0.5)
    expect(config.agents.HCollector.prompt_append).toBe("Additional instructions")
    expect(config.agents.HCollector.permission).toEqual({ write: "deny" })
    expect(config.workflow).toBe("classic")
  })

  it("defaults workflow to 'classic' when not specified", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })

    const testConfig = {
      agents: {},
    }

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.workflow).toBe("classic")
  })

  it("uses custom workflow when specified", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })

    const testConfig = {
      workflow: "custom",
      agents: {},
    }

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

    const config = loadHDConfig(TEST_CONFIG_PATH)

    expect(config.workflow).toBe("custom")
  })

  it("prioritizes project config over global config", () => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true })
    mkdirSync(PROJECT_CONFIG_DIR, { recursive: true })

    // Create global config
    const globalConfig = {
      agents: {
        HArchitect: {
          temperature: 0.5,
        },
      },
      workflow: "global",
    }
    writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(globalConfig, null, 2))

    // Create project config with different values
    const projectConfig = {
      agents: {
        HArchitect: {
          temperature: 0.9,
        },
      },
      workflow: "project",
    }
    writeFileSync(PROJECT_CONFIG_PATH, JSON.stringify(projectConfig, null, 2))
  
    const config = loadHDConfig()

    expect(config.workflow).toBe("project")
    expect(config.agents.HArchitect.temperature).toBe(0.9)
  })
})

describe("config constants", () => {
  it("DEFAULT_CONFIG_PATH is correct", () => {
    expect(DEFAULT_CONFIG_PATH).toBe("hd-config.json")
  })

  it("GLOBAL_CONFIG_PATH points to user's home", () => {
    expect(GLOBAL_CONFIG_PATH).toContain(".config")
    expect(GLOBAL_CONFIG_PATH).toContain("opencode")
    expect(GLOBAL_CONFIG_PATH).toContain("hyper-designer")
    expect(GLOBAL_CONFIG_PATH).toContain("hd-config.json")
  })

  it("DEFAULT_AGENT_CONFIGS has all required agents", () => {
    expect(DEFAULT_AGENT_CONFIGS).toHaveProperty("HCollector")
    expect(DEFAULT_AGENT_CONFIGS).toHaveProperty("HArchitect")
    expect(DEFAULT_AGENT_CONFIGS).toHaveProperty("HCritic")
    expect(DEFAULT_AGENT_CONFIGS).toHaveProperty("HEngineer")
  })
})
