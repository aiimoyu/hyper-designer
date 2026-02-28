export interface StageHookCapabilities {
  /** 向指定 agent 发送 prompt（平台注入） */
  prompt?: (agent: string, text: string) => Promise<void>
  /** 压缩当前会话上下文（平台注入） */
  summarize?: () => Promise<void>
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
