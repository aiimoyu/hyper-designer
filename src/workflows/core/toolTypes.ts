/**
 * 平台无关的工具定义类型
 *
 * Plugin 通过此接口声明工具，框架负责适配到各平台（OpenCode、Claude Code 等）。
 *
 * 设计原则：
 * - 参数定义使用 JSON Schema 子集，不绑定任何平台
 * - 执行函数接收统一的 ToolContext，可访问工作流状态
 * - 工具名称遵循 hd_<plugin>_<action> 命名空间约定
 */

import type { PlatformAdapter } from '../../platformBridge/capabilities/types'

// ── 参数 Schema 定义 ─────────────────────────────────────────────────────────

/** JSON Schema 子集，用于描述工具参数 */
export interface ToolParamSchema {
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** 参数描述（LLM 会看到这个） */
  description?: string
  /** 是否可选 */
  optional?: boolean
  /** object 类型的属性定义 */
  properties?: Record<string, ToolParamSchema>
  /** array 类型的元素定义 */
  items?: ToolParamSchema
  /** 枚举值 */
  enum?: string[]
}

/** 工具参数集合 */
export type ToolParamsSchema = Record<string, ToolParamSchema>

// ── 执行上下文 ────────────────────────────────────────────────────────────────

/** 工具执行时的上下文 */
export interface ToolContext {
  /** 当前工作流 ID */
  workflowId: string
  /** 当前阶段 key，null 表示无活动阶段 */
  currentStage: string | null
  /** 工作流状态（只读快照） */
  state: Record<string, unknown> | null
  /** 平台适配器（用于高级交互，如创建子会话） */
  adapter?: PlatformAdapter
}

// ── 工具定义 ──────────────────────────────────────────────────────────────────

/**
 * 平台无关的工具定义
 *
 * Plugin 在 WorkflowDefinition.tools 中声明此类对象，
 * 框架自动将其适配到运行平台的工具系统。
 */
export interface ToolDefinition {
  /**
   * 工具名称
   * 命名规范：hd_<plugin>_<action>
   * 例如：hd_analysis_read_component, hd_review_compare
   */
  name: string

  /** 工具描述 — LLM 通过此描述决定是否调用此工具 */
  description: string

  /** 参数 schema */
  params: ToolParamsSchema

  /** 执行函数 — 返回值为 JSON 字符串 */
  execute: (params: Record<string, unknown>, ctx: ToolContext) => Promise<string>

  /**
   * 作用域：控制工具何时可用
   * - 'global': 始终可用（默认）
   * - 'workflow': 仅在工作流激活时可用
   * - 'stage': 仅在指定阶段可用
   */
  scope?: 'global' | 'workflow' | 'stage'

  /** scope='stage' 时，指定可用的阶段 key 列表 */
  stages?: string[]
}

// ── 平台注册格式 ──────────────────────────────────────────────────────────────

/**
 * 统一的工具注册格式
 * 由 ToolRegistry 将 ToolDefinition 转换为此格式，
 * 再交给平台适配器注册到具体平台。
 */
export interface ToolRegistration {
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 参数 schema */
  params: ToolParamsSchema
  /** 执行函数（已绑定 ToolContext） */
  handler: (params: Record<string, unknown>) => Promise<string>
}
