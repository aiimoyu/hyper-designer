export type {
  WorkflowPlatformAdapter,
  WorkflowPromptBindings,
  StageFileItemType,
  StageFileItem,
  StageHookFn,
  WorkflowHookDefinition,
  StageHook,
  StageTransitionDefinition,
  MilestoneDefinition,
  InjectionConfig,
  WorkflowStageDefinition,
  WorkflowPromptInjectionConfig,
  WorkflowPromptTransformConfig,
  WorkflowDefinition,
} from '../types/workflow'

import { HyperDesignerLogger } from '../utils/logger'
import type { WorkflowPlatformAdapter } from '../types/workflow'

export function safeRegisterTools(
  adapter: WorkflowPlatformAdapter | undefined,
  tools: Array<{ name: string; description: string; params: Record<string, { type: string; description?: string; optional?: boolean }>; handler: (params: Record<string, unknown>) => Promise<string> }>,
  context?: { stageKey?: string; hookId?: string }
): boolean {
  if (!adapter) {
    HyperDesignerLogger.warn('Workflow', '无法注册工具：adapter 未提供', {
      toolCount: tools.length,
      toolNames: tools.map(t => t.name),
      ...context,
    })
    return false
  }

  if (!adapter.registerTools) {
    HyperDesignerLogger.warn('Workflow', '无法注册工具：adapter 未实现 registerTools 方法', {
      toolCount: tools.length,
      toolNames: tools.map(t => t.name),
      ...context,
    })
    return false
  }

  try {
    adapter.registerTools(tools)
    return true
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.error('Workflow', '工具注册失败', err, {
      toolCount: tools.length,
      toolNames: tools.map(t => t.name),
      ...context,
    })
    return false
  }
}
