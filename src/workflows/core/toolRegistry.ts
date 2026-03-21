/**
 * 工具注册管理器
 *
 * 职责：
 * 1. 从 WorkflowDefinition 中提取工具定义
 * 2. 根据 scope 过滤当前可用工具
 * 3. 转换为统一的 ToolRegistration 格式
 * 4. 通过 PlatformAdapter 注册到具体平台
 *
 * 使用模式：
 * ```typescript
 * const registry = new ToolRegistry()
 * registry.collectFromWorkflow(workflowDefinition)
 * const tools = registry.getAvailableTools(currentStage)
 * const registrations = registry.toRegistrations(tools, context)
 * registry.registerToPlatform(adapter, registrations)
 * ```
 */

import type { WorkflowDefinition } from './types'
import type {
  ToolDefinition,
  ToolContext,
  ToolRegistration,
} from './toolTypes'
import type { PlatformAdapter } from '../../platformBridge/capabilities/types'
import { HyperDesignerLogger } from '../../utils/logger'

const MODULE_NAME = 'ToolRegistry'

/**
 * 工具注册管理器
 *
 * 管理从工作流定义中收集的工具，并提供过滤、转换和注册能力。
 */
export class ToolRegistry {
  /** 已注册的工具定义（name → definition） */
  private tools: Map<string, ToolDefinition> = new Map()

  /**
   * 从工作流定义中收集工具
   *
   * @param workflow - 工作流定义（需包含 tools 字段）
   * @returns 收集的工具数量
   */
  collectFromWorkflow(workflow: Pick<WorkflowDefinition, 'tools' | 'id'>): number {
    if (!workflow.tools || workflow.tools.length === 0) {
      return 0
    }

    let collected = 0
    for (const tool of workflow.tools) {
      if (this.tools.has(tool.name)) {
        HyperDesignerLogger.warn(MODULE_NAME, `工具名冲突，跳过: ${tool.name}`, {
          workflowId: workflow.id,
          toolName: tool.name,
        })
        continue
      }
      this.tools.set(tool.name, tool)
      collected++
    }

    HyperDesignerLogger.debug(MODULE_NAME, `从工作流 ${workflow.id} 收集 ${collected} 个工具`, {
      workflowId: workflow.id,
      collected,
      totalTools: this.tools.size,
    })

    return collected
  }

  /**
   * 获取当前可用的工具列表（基于 scope 和 stage 过滤）
   *
   * 过滤规则：
   * - scope='global'（默认）：始终可用
   * - scope='workflow'：工作流激活时可用（currentStage 为 null 时也可用）
   * - scope='stage'：仅当 currentStage 在 tool.stages 中时可用
   *
   * @param currentStage - 当前阶段 key，null 表示无活动阶段
   * @returns 可用的工具定义列表
   */
  getAvailableTools(currentStage: string | null): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool => {
      // 默认 scope 为 'global'
      const scope = tool.scope ?? 'global'

      if (scope === 'global') return true
      if (scope === 'workflow') return true
      if (scope === 'stage') {
        if (!currentStage) return false
        return tool.stages?.includes(currentStage) ?? false
      }
      return false
    })
  }

  /**
   * 将 ToolDefinition 列表转换为统一的 ToolRegistration 格式
   *
   * @param tools - 工具定义列表
   * @param ctx - 工具执行上下文（绑定到每个 handler）
   * @returns 统一注册格式的工具列表
   */
  toRegistrations(
    tools: ToolDefinition[],
    ctx: ToolContext,
  ): ToolRegistration[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      params: tool.params,
      handler: (params: Record<string, unknown>) => tool.execute(params, ctx),
    }))
  }

  /**
   * 将工具注册到平台适配器
   *
   * 仅当适配器实现了 registerTools 方法时才执行注册。
   *
   * @param adapter - 平台适配器
   * @param registrations - 要注册的工具列表
   */
  registerToPlatform(
    adapter: PlatformAdapter,
    registrations: ToolRegistration[],
  ): void {
    if (registrations.length === 0) {
      HyperDesignerLogger.debug(MODULE_NAME, '没有需要注册的工具')
      return
    }

    if (adapter.registerTools) {
      adapter.registerTools(registrations)
      HyperDesignerLogger.info(MODULE_NAME, `注册 ${registrations.length} 个工具到平台`, {
        toolNames: registrations.map(r => r.name),
      })
    } else {
      HyperDesignerLogger.warn(MODULE_NAME, '平台适配器不支持工具注册，跳过', {
        toolCount: registrations.length,
      })
    }
  }

  /**
   * 便捷方法：从工作流定义到平台注册的完整流程
   *
   * @param workflow - 工作流定义
   * @param currentStage - 当前阶段
   * @param ctx - 工具执行上下文
   * @param adapter - 平台适配器（可选）
   * @returns 已注册的工具数量
   */
  registerWorkflowTools(
    workflow: Pick<WorkflowDefinition, 'tools' | 'id'>,
    currentStage: string | null,
    ctx: ToolContext,
    adapter?: PlatformAdapter,
  ): number {
    this.collectFromWorkflow(workflow)
    const available = this.getAvailableTools(currentStage)
    const registrations = this.toRegistrations(available, ctx)

    if (adapter) {
      this.registerToPlatform(adapter, registrations)
    }

    return registrations.length
  }

  /**
   * 获取所有已收集的工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * 清空所有已收集的工具（用于测试或重新初始化）
   */
  clear(): void {
    this.tools.clear()
  }
}

/**
 * 全局工具注册管理器单例
 */
export const toolRegistry = new ToolRegistry()
