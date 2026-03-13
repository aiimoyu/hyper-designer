/**
 * 工作流运行时模块
 *
 * 统一导出交接处理和提示词加载功能。
 */

export { getHandoverAgent, getHandoverPrompt } from "./handover";
export {
  loadPromptBindings,
  loadWorkflowPrompt,
  loadStagePrompt,
  loadPromptForStage,
  getFrameworkFallbackPrompt,
  resolvePromptBindingsForMode,
  FRAMEWORK_FALLBACK_PROMPT_TOKEN,
  WORKFLOW_OVERVIEW_PROMPT_TOKEN,
  WORKFLOW_STEP_PROMPT_TOKEN,
} from './promptLoader'
