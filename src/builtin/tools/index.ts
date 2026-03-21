import type { ToolPluginRegistration } from '../../sdk/contracts'
import { createDocumentReviewToolDefinitions } from './documentReview/toolDefinitions'
import { createHdCoreToolDefinitions } from './hdCoreTools'

export const BUILTIN_TOOL_PLUGINS: ToolPluginRegistration[] = [
  ...createHdCoreToolDefinitions().map(tool => ({
    name: tool.name,
    factory: () => tool,
  })),
  ...createDocumentReviewToolDefinitions().map(tool => ({
    name: tool.name,
    factory: () => tool,
  })),
]
