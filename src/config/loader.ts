/**
 * 配置加载模块
 * 
 * 负责加载和管理 Hyper Designer 的配置文件，包括：
 * 1. 搜索配置文件路径（项目目录、全局配置目录）
 * 2. 解析和验证配置结构
 * 3. 合并默认配置和用户配置
 * 4. 提供类型安全的配置接口
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { HyperDesignerLogger } from "../utils/logger"

/**
 * Configuration overrides for specific agents
 */
export interface AgentOverrideConfig {
  /** Optional model name to use for the agent */
  model?: string
  /** Optional temperature setting for the agent's model */
  temperature?: number
  /** Optional maximum tokens for the agent's responses */
  maxTokens?: number
  /** Optional variant for the agent's model */
  variant?: string
  /** Optional additional prompt content to append */
  prompt_append?: string
  /** Optional permission settings for the agent */
  permission?: Record<string, string>
}

/**
 * Hyper Designer configuration structure
 */
export interface HDConfig {
  /** Optional schema URL for validation */
  $schema?: string
  /** Optional default workflow to use */
  workflow?: string
  /** Agent-specific configuration overrides */
  agents: Record<string, AgentOverrideConfig>
  /** Optional model identifier for session summarization during workflow handover */
  summarize?: string
}

/** Default name for the configuration file */
export const DEFAULT_CONFIG_PATH = "hd-config.json"

/** Global configuration directory path */
export const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "opencode", "hyper-designer")
/** Global configuration file path */
export const GLOBAL_CONFIG_PATH = join(GLOBAL_CONFIG_DIR, "hd-config.json")

/** 
 * 内置代理的默认配置值
 * 
 * 温度值选择依据：
 * - HCollector (0.3): 较低温度，确保需求收集的准确性和一致性
 * - HArchitect (0.7): 较高温度，鼓励架构设计的创造性和多样性
 * - HCritic (0.1): 极低温度，确保评审的严格性和一致性
 * - HEngineer (0.4): 中等温度，平衡技术设计的严谨性和创造性
 */
export const DEFAULT_AGENT_CONFIGS: Record<string, AgentOverrideConfig> = {
  HCollector: {
    temperature: 0.3,
  },
  HArchitect: {
    temperature: 0.7,
  },
  HCritic: {
    temperature: 0.1,
  },
  HEngineer: {
    temperature: 0.4,
  },
}

/**
 * Finds the configuration file path by searching in predefined locations
 * @returns Path to the configuration file if found, null otherwise
 */
function findConfigPath(): string | null {
  // 配置文件搜索路径（按优先级顺序）：
  // 1. 项目目录下的 .hyper-designer 文件夹
  // 2. 用户全局配置目录
  const projectConfigPath =
    process.env.HD_PROJECT_CONFIG_PATH ??
    join(process.cwd(), ".hyper-designer", DEFAULT_CONFIG_PATH)
  const globalConfigPath = process.env.HD_GLOBAL_CONFIG_PATH ?? GLOBAL_CONFIG_PATH
  const searchPaths = [
    projectConfigPath,
    globalConfigPath,
  ]

  HyperDesignerLogger.debug("Config", `搜索配置文件`, { 
    searchPaths,
    strategy: "projectFirstThenGlobal"
  })

  for (const path of searchPaths) {
    if (existsSync(path)) {
      HyperDesignerLogger.debug("Config", `找到配置文件`, { 
        path,
        priority: searchPaths.indexOf(path) + 1
      })
      return path
    }
  }

  HyperDesignerLogger.debug("Config", `未找到配置文件`, { 
    searchedLocations: searchPaths.length
  })
  return null
}

/**
 * Loads the Hyper Designer configuration
 * @param configPath Optional path to the configuration file
 * @returns Loaded configuration object
 */
export function loadHDConfig(configPath?: string): HDConfig {
  HyperDesignerLogger.info("Config", `加载 Hyper Designer 配置`)
  
  const path = configPath ?? findConfigPath()

  if (!path) {
    HyperDesignerLogger.warn("Config", `未找到配置文件，使用默认配置`, {
      action: "useDefaultConfig",
      reason: "configFileNotFound"
    })
    return {
      agents: DEFAULT_AGENT_CONFIGS,
      workflow: "classic",
    }
  }

  try {
    HyperDesignerLogger.debug("Config", `读取配置文件`, { 
      path,
      action: "readConfigFile"
    })
    
    const content = readFileSync(path, "utf-8")
    const config = JSON.parse(content) as HDConfig

    // 合并配置策略：用户配置覆盖默认配置
    const mergedConfig: HDConfig = {
      workflow: config.workflow ?? "classic",
      agents: {
        ...DEFAULT_AGENT_CONFIGS,
        ...config.agents,
      },
    }

    if (config.$schema) {
      mergedConfig.$schema = config.$schema
    }

    HyperDesignerLogger.info("Config", `配置加载成功`, { 
      path,
      agentCount: Object.keys(mergedConfig.agents).length,
      hasSchema: mergedConfig.$schema !== undefined
    })
    
    return mergedConfig
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.warn("Config", `加载配置文件失败`, { 
      path,
      action: "loadConfig",
      recovery: "usingDefaultConfig",
      error: err.message
    })
    
    HyperDesignerLogger.warn("Config", `由于错误使用默认配置`, {
      path,
      errorType: err.name
    })
    
    return {
      agents: DEFAULT_AGENT_CONFIGS,
      workflow: "classic",
    }
  }
}
