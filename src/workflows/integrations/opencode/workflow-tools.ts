/**
 * 工作流工具转换器
 *
 * 将平台无关的 ToolDefinition 转换为 OpenCode 平台的 tool() 格式。
 * 供插件入口在初始化时注册工作流提供的工具。
 */

import { tool } from '@opencode-ai/plugin'
import type { ToolDefinition, ToolContext, ToolParamsSchema } from '../../core/toolTypes'
import { HyperDesignerLogger } from '../../../utils/logger'

const MODULE_NAME = 'Integrations:WorkflowTools'

/** OpenCode tool args 的通用类型（兼容各 Zod 类型） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenCodeArg = any

/**
 * 将 ToolParamsSchema 转换为 OpenCode 的 args 格式
 *
 * OpenCode 使用 tool.schema.* 来定义参数，而我们的 ToolDefinition 使用 JSON Schema 子集。
 * 此函数将平台无关的 schema 转换为 OpenCode 格式。
 */
function convertParamsToOpenCodeArgs(
  params: ToolParamsSchema,
): Record<string, OpenCodeArg> {
  const args: Record<string, OpenCodeArg> = {}

  for (const [name, schema] of Object.entries(params)) {
    let arg: OpenCodeArg

    switch (schema.type) {
      case 'string':
        arg = tool.schema.string()
        break
      case 'number':
        arg = tool.schema.number()
        break
      case 'boolean':
        arg = tool.schema.boolean()
        break
      case 'array':
        arg = tool.schema.array(tool.schema.string())
        break
      case 'object':
        arg = tool.schema.object({})
        break
      default:
        arg = tool.schema.string()
    }

    if (schema.description) {
      arg = arg.describe(schema.description)
    }

    if (schema.optional) {
      arg = arg.optional()
    }

    if (schema.enum) {
      // OpenCode 不直接支持 enum，但在 description 中注明
      const enumDesc = `可选值: ${schema.enum.join(', ')}`
      arg = arg.describe(
        schema.description ? `${schema.description}。${enumDesc}` : enumDesc,
      )
    }

    args[name] = arg
  }

  return args
}

/**
 * 将平台无关的 ToolDefinition 列表转换为 OpenCode 工具对象
 *
 * @param tools - 工具定义列表
 * @param getContext - 获取 ToolContext 的工厂函数（每次执行时调用）
 * @returns OpenCode 工具对象（可直接用于 plugin.tool）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertWorkflowToolsToOpenCode(
  tools: ToolDefinition[],
  getContext: () => ToolContext,
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}

  for (const t of tools) {
    const args = convertParamsToOpenCodeArgs(t.params)

    result[t.name] = tool({
      description: t.description,
      args,
      async execute(params: Record<string, unknown>) {
        HyperDesignerLogger.debug(MODULE_NAME, `执行工作流工具: ${t.name}`, {
          toolName: t.name,
          params,
        })
        const ctx = getContext()
        return t.execute(params, ctx)
      },
    })

    HyperDesignerLogger.debug(MODULE_NAME, `转换工作流工具: ${t.name}`, {
      toolName: t.name,
      scope: t.scope ?? 'global',
      stages: t.stages,
    })
  }

  HyperDesignerLogger.info(MODULE_NAME, `转换完成: ${tools.length} 个工作流工具`, {
    toolNames: tools.map(t => t.name),
  })

  return result
}
