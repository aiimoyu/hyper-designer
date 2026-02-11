export type RuntimeType = "opencode" | "claudecode"


export interface RuntimeToolSyntax {
  uniName: string
  description: string
  syntax: string
  example?: string
  parameters?: string
}

export type ToolSyntaxRegistry = Record<string, RuntimeToolSyntax>


import { OPENCODE_TOOL_SYNTAX } from "./opencode"

function getToolSyntaxRegistry(runtime: RuntimeType): ToolSyntaxRegistry {
  switch (runtime) {
    case "opencode":
      return OPENCODE_TOOL_SYNTAX
    case "claudecode":
      throw new Error(`Runtime '${runtime}' not yet supported`)
    default:
      throw new Error(`Unknown runtime: ${runtime}`)
  }
}

export function generateToolsPrompt(
  runtime: RuntimeType,
  requiredTools: string[]
): string {
  const syntaxRegistry = getToolSyntaxRegistry(runtime)

  let prompt = "## 重要工具\n\n"
  prompt += "你需要使用以下工具来完成任务：\n\n"
  prompt += "** 永远不要使用工具的通用名称，严格使用语法中的工具名进行调用 **\n\n"

  for (const toolName of requiredTools) {
    const syntax = syntaxRegistry[toolName]

    if (!syntax) {
      console.warn(`Tool syntax not found for ${runtime}: ${toolName}`)
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
  }

  return prompt
}
