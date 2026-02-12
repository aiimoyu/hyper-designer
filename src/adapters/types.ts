/**
 * 适配器类型定义模块
 * 
 * 定义 Hyper Designer 与外部系统交互的接口类型，包括：
 * 1. 会话提示词发送器接口
 * 2. 交接配置接口
 * 3. 技能加载器接口
 */

/**
 * 会话提示词发送器接口
 * 用于向指定会话发送提示词消息
 */
export interface SessionPromptSender {
  sendPrompt(sessionId: string, agent: string, content: string): Promise<void>
}

/**
 * 交接配置接口
 * 定义工作流阶段间的交接配置
 */
export interface HandoverConfig {
  /** 交接目标代理名称 */
  agent: string
  /** 生成交接提示词的函数 */
  getPrompt(currentStep: string | null, nextStep: string): string
}

/**
 * 技能加载器接口
 * 用于加载阶段特定的技能
 */
export interface SkillLoader {
  loadSkillForStage(stage: string): string
}
