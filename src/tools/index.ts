/**
 * 工具提示词生成模块
 * 
 * 负责为不同运行时环境生成工具使用提示词，包括：
 * 1. 管理运行时环境支持（opencode, claudecode）
 * 2. 提供工具语法定义接口
 * 3. 生成格式化的工具使用说明
 */

import { OPENCODE_TOOL_SYNTAX } from "./opencode"
import { HyperDesignerLogger } from "../utils/logger"

/**
 * Supported runtime environments
 */
export type RuntimeType = "opencode" | "claudecode"

/**
 * Syntax definition for a tool in a specific runtime
 */
export interface RuntimeToolSyntax {
  /** Unique name for the tool */
  uniName: string
  /** Description of what the tool does */
  description: string
  /** Syntax for using the tool */
  syntax: string
  /** Optional example usage of the tool */
  example?: string
  /** Optional parameter documentation for the tool */
  parameters?: string
}

/**
 * Registry mapping tool names to their syntax definitions
 */
export type ToolSyntaxRegistry = Record<string, RuntimeToolSyntax>

/**
 * Gets the tool syntax registry for the specified runtime
 * @param runtime Runtime environment to get syntax for
 * @returns Tool syntax registry for the specified runtime
 */
function getToolSyntaxRegistry(runtime: RuntimeType): ToolSyntaxRegistry {
  switch (runtime) {
    case "opencode":
      HyperDesignerLogger.debug("Tools", `使用 opencode 工具语法注册表`, { runtime })
      return OPENCODE_TOOL_SYNTAX
    case "claudecode":
      HyperDesignerLogger.warn("Tools", `运行时环境暂不支持`, { 
        runtime,
        fallback: "opencode",
        action: "useFallbackRegistry"
      })
      return OPENCODE_TOOL_SYNTAX
    default:
      HyperDesignerLogger.error("Tools", `未知的运行时环境`, new Error(`Unknown runtime: ${runtime}`), { 
        runtime,
        fallback: "opencode",
        action: "handleUnknownRuntime"
      })
      return OPENCODE_TOOL_SYNTAX
  }
}

/**
 * Generates a prompt section describing the required tools
 * @param runtime Runtime environment to generate syntax for
 * @param requiredTools Array of tool names that are required
 * @returns Formatted prompt string describing the tools
 */
export function generateToolsPrompt(
  runtime: RuntimeType,
  requiredTools: string[]
): string {
  HyperDesignerLogger.info("Tools", `生成工具提示词`, { 
    runtime,
    toolCount: requiredTools.length,
    tools: requiredTools
  })
  
  const syntaxRegistry = getToolSyntaxRegistry(runtime)

  let prompt = "## 重要工具\n\n"
  prompt += "你需要使用以下工具来完成任务：\n\n"
  prompt += "** 永远不要使用工具的通用名称，严格使用语法中的工具名进行调用 **\n\n"

  let validToolCount = 0
  for (const toolName of requiredTools) {
    const syntax = syntaxRegistry[toolName]

    if (!syntax) {
      HyperDesignerLogger.warn("Tools", `工具语法未找到`, { 
        runtime,
        toolName,
        action: "skipMissingTool"
      })
      continue
    }

    prompt += `### t${syntax.uniName}\n\n`
    prompt += `**用途**：${syntax.description}\n\n`
    prompt += `**语法**：\`${syntax.syntax}\n\`\n\n`
    if (syntax.parameters) {
      prompt += `**参数**：\n\`\`\`typescript\n${syntax.parameters}\n\`\`\`\n\n`
    }
    if (syntax.example) {
      prompt += `**示例**：\n\`\`\`typescript\n${syntax.example}\n\`\`\`\n\n`
    }
    
    validToolCount++
  }

  HyperDesignerLogger.debug("Tools", `工具提示词生成完成`, { 
    runtime,
    requestedTools: requiredTools.length,
    validTools: validToolCount,
    promptLength: prompt.length
  })
  
  return prompt
}
