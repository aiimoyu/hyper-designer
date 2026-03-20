import { tool } from '@opencode-ai/plugin'
import type { ToolDefinition, ToolContext, ToolParamsSchema } from '../../../workflows/core/toolTypes'
import { HyperDesignerLogger } from '../../../utils/logger'

const MODULE_NAME = 'Integrations:WorkflowTools'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenCodeArg = any

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
      const enumDesc = `可选值: ${schema.enum.join(', ')}`
      arg = arg.describe(
        schema.description ? `${schema.description}。${enumDesc}` : enumDesc,
      )
    }

    args[name] = arg
  }

  return args
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
