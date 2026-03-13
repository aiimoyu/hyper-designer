/**
 * 平台适配器抽象接口
 *
 * 定义 hyper-designer 工作流运行所需的底层平台能力契约。
 * 各平台（OpenCode、Claude Code 等）通过实现此接口接入 hyper-designer 工作流。
 *
 * 设计原则：
 * - 所有操作均接受显式 sessionId，无隐式绑定会话
 * - 仅包含原语级能力，业务组合逻辑由上层（hooks、gate）负责
 */

/** 发送 prompt 的参数 */
export interface SendPromptParams {
  /** 目标会话 ID */
  sessionId: string
  /** 目标 agent 名称 */
  agent: string
  /** 提示词文本 */
  text: string
  /** 结构化输出 schema（JSON Schema 格式，可选） */
  schema?: Record<string, unknown>
}

/** sendPrompt 的返回结果 */
export interface SendPromptResult {
  /** 结构化输出（若请求时提供了 schema） */
  structuredOutput?: unknown
  /** 文本形式的响应 */
  text: string
}

/**
 * 平台适配器接口
 *
 * 统一抽象以下操作：
 * - 隔离会话管理（创建、删除）
 * - 向指定会话发送 prompt
 * - 会话上下文压缩
 * - 会话上下文清空（通过切换到新会话）
 */
export interface PlatformAdapter {
  /** 创建隔离会话，返回 sessionId */
  createSession: (title: string) => Promise<string>

  /**
   * 向指定会话发送 prompt，返回归一化结果
   * 支持结构化输出（通过 schema 参数）
   */
  sendPrompt: (params: SendPromptParams) => Promise<SendPromptResult>

  /** 删除指定会话（资源清理） */
  deleteSession: (sessionId: string) => Promise<void>

  /** 压缩指定会话的上下文（降低 token 消耗），失败时静默忽略 */
  summarizeSession: (sessionId: string) => Promise<void>

  /** 清空指定会话上下文并切换到新会话 */
  clearSession: (sessionId: string) => Promise<string>

  /**
   * 向平台注册工具（可选）
   *
   * 各平台通过实现此方法将工具注册到自己的工具系统。
   * 如果平台不支持动态注册，可省略此方法。
   *
   * @param tools - 要注册的工具列表
   */
  registerTools?: (tools: PlatformToolRegistration[]) => void

  /**
   * 从平台注销工具（可选）
   *
   * @param toolNames - 要注销的工具名称列表
   */
  unregisterTools?: (toolNames: string[]) => void
}

/**
 * 平台无关的工具注册格式
 *
 * PlatformAdapter.registerTools 接收此格式的工具列表。
 * 框架负责将 WorkflowDefinition.tools 转换为此格式。
 */
export interface PlatformToolRegistration {
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 参数 schema（JSON Schema 子集） */
  params: Record<string, {
    type: string
    description?: string
    optional?: boolean
  }>
  /** 执行函数 */
  handler: (params: Record<string, unknown>) => Promise<string>
}
