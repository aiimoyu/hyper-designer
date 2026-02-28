export interface SessionCapabilities {
  /** 创建隔离评审会话，返回会话 ID */
  create: (title: string) => Promise<string>
  /** 向指定会话发送结构化 prompt，返回归一化结果 */
  prompt: (params: {
    sessionId: string
    agent: string
    text: string
    schema?: Record<string, unknown>
  }) => Promise<{ structuredOutput?: unknown; text: string }>
  /** 删除隔离会话（清理资源） */
  delete: (sessionId: string) => Promise<void>
}

export interface StageHookCapabilities {
  /** 向指定 agent 发送 prompt（平台注入，绑定当前会话） */
  prompt?: (agent: string, text: string) => Promise<void>
  /** 压缩当前会话上下文（平台注入） */
  summarize?: () => Promise<void>
  /** session 原语（平台注入），供门禁评审使用 */
  session?: SessionCapabilities
}


export type StageHookFn = (ctx: {
  /** 阶段 key，如 "IRAnalysis" */
  stageKey: string
  stageName: string
  workflow: WorkflowDefinition
  sessionID?: string
  capabilities?: StageHookCapabilities
}) => Promise<void>

export interface WorkflowStageDefinition {
   /** Display name for this stage */
   name: string
   /** Description of what this stage does */
   description: string
   /** Which agent handles this stage */
   agent: string
   /** Prompt file path relative to the workflow directory (optional - use workflow-level prompt if not specified) */
   promptFile?: string
   /** Hooks to run before the stage's primary agent starts */
   beforeStage?: StageHookFn[]
   /** Hooks to run after the stage completes (future use) */
   afterStage?: StageHookFn[]
   /** Stage-level quality gate config */
   /** Stage-level quality gate prompt. If set, HCritic review is run; if undefined, gate is skipped. */
   qualityGate?: string
   getHandoverPrompt: (currentStep: string | null) => string
}

export interface WorkflowDefinition {
   /** Unique workflow identifier */
   id: string
   /** Human-readable name */
   name: string
   /** Description */
   description: string
   /** Prompt file path relative to the workflow directory for the entire process */
   promptFile?: string
   stageFallbackPromptFile?: string
   /** Ordered list of stage keys */
   stageOrder: string[]
   /** Stage definitions keyed by stage name */
   stages: Record<string, WorkflowStageDefinition>
}
export interface WorkflowStateAccessor {
  /** 获取当前工作流状态 */
  getState: () => { currentStep?: string | null } | null
  /** 写回门禁通过状态 */
  setGatePassed: (passed: boolean) => unknown
}

