/**
 * Represents a frontend's ability to send prompts to agents in a session.
 * OpenCode implements this via ctx.client.session.prompt().
 * Other frontends would implement their own session communication.
 */
export interface SessionPromptSender {
  sendPrompt(sessionId: string, agent: string, content: string): Promise<void>
}

/**
 * Configuration for how workflow handovers trigger agent prompts.
 * This is frontend-agnostic — each adapter uses it to drive its own session system.
 */
export interface HandoverConfig {
  agent: string
  getPrompt(currentStep: string | null, nextStep: string): string
}

/**
 * Skill loader interface for loading stage-specific skill content.
 * Core defines the contract, adapters implement how skills are delivered to agents.
 */
export interface SkillLoader {
  loadSkillForStage(stage: string): string
}