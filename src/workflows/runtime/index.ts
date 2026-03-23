/**
 * 工作流运行时模块
 *
 * 统一导出交接处理和提示词加载功能。
 */

export { getHandoverAgent, getHandoverPrompt } from "./handover";
export { FRAMEWORK_FALLBACK_PROMPT_TOKEN } from './tokens'
export {
  loadPromptBindings,
  loadWorkflowPrompt,
  loadStagePrompt,
  loadPromptForStage,
  getFrameworkFallbackPrompt,
  resolvePromptBindingsForMode,
} from './promptLoader'
