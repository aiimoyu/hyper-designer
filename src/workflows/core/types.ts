export interface WorkflowStageDefinition {
   /** Display name for this stage */
   name: string
   /** Description of what this stage does */
   description: string
   /** Which agent handles this stage */
   agent: string
   /** Skill to load for this stage (skill name, not path) */
   skill?: string
   /** Prompt file path relative to the workflow directory (optional - use workflow-level prompt if not specified) */
   promptFile?: string
   /** Handover prompt generator - only takes current step since next stage is determined */
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
