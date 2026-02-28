/**
 * 工作流运行时模块
 *
 * 统一导出交接处理和提示词加载功能。
 */

export { getHandoverAgent, getHandoverPrompt } from "./handover";
export { loadWorkflowPrompt, loadStagePrompt, loadPromptForStage } from "./promptLoader";