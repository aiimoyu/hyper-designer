import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { debug } from "../utils/debug"

export interface AgentOverrideConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  variant?: string
  prompt_append?: string
  permission?: Record<string, string>
}

export interface HDConfig {
  $schema?: string
  workflow?: string
  agents: Record<string, AgentOverrideConfig>
}

export const DEFAULT_CONFIG_PATH = "hd-config.json"

export const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "opencode", "hyper-designer")
export const GLOBAL_CONFIG_PATH = join(GLOBAL_CONFIG_DIR, "hd-config.json")

export const DEFAULT_AGENT_CONFIGS: Record<string, AgentOverrideConfig> = {
  HCollector: {
    temperature: 0.3,
    maxTokens: 32000,
  },
  HArchitect: {
    temperature: 0.7,
    maxTokens: 32000,
  },
  HCritic: {
    temperature: 0.1,
    maxTokens: 16000,
  },
  HEngineer: {
    temperature: 0.4,
    maxTokens: 32000,
  },
}

function findConfigPath(): string | null {
  const searchPaths = [
    join(process.cwd(), ".hyper-designer", DEFAULT_CONFIG_PATH),
    GLOBAL_CONFIG_PATH,
  ]


  for (const path of searchPaths) {
    if (existsSync(path)) {
      return path
    }
  }

  return null
}

export function loadHDConfig(configPath?: string): HDConfig {
  const path = configPath ?? findConfigPath()

  if (!path) {
    return {
      agents: DEFAULT_AGENT_CONFIGS,
      workflow: "traditional",
    }
  }

  try {
    const content = readFileSync(path, "utf-8")
    const config = JSON.parse(content) as HDConfig

    const mergedConfig: HDConfig = {
      workflow: config.workflow ?? "traditional",
      agents: {
        ...DEFAULT_AGENT_CONFIGS,
        ...config.agents,
      },
    }

    if (config.$schema) {
      mergedConfig.$schema = config.$schema
    }


    return mergedConfig
  } catch (error) {
    debug.error(`Failed to load HD config from ${path}`, error)
    return {
      agents: DEFAULT_AGENT_CONFIGS,
      workflow: "traditional",
    }
  }
}
