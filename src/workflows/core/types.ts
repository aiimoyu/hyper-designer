import type { PlatformAdapter } from '../../adapters/types'

// 重新导出供上层直接使用
export type { PlatformAdapter } from '../../adapters/types'

export type StageHookFn = (ctx: {
  /** 阶段 key，如 "IRAnalysis" */
  stageKey: string
  stageName: string
  workflow: WorkflowDefinition
  sessionID?: string
  /** 平台适配器（平台注入），提供会话管理与 prompt 能力 */
  adapter?: PlatformAdapter
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
   /** Stage-level gate flag. If true, hd_handover checks score > 75 before allowing handover. */
   gate?: boolean
   getHandoverPrompt: (currentStageName: string | null, thisStageName: string) => string
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

