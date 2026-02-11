export interface SessionPromptSender {
  sendPrompt(sessionId: string, agent: string, content: string): Promise<void>
}

export interface HandoverConfig {
  agent: string
  getPrompt(currentStep: string | null, nextStep: string): string
}

export interface SkillLoader {
  loadSkillForStage(stage: string): string
}
