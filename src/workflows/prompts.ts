import { readFileSync } from "fs"
import { join } from "path"
import type { WorkflowDefinition } from "./types"

export function loadPromptForStage(stage: string | null, definition: WorkflowDefinition): string {
  const workflowDir = join(process.cwd(), "src", "workflows", definition.id)
  const parts: string[] = []

  if (definition.promptFile) {
    const workflowPromptPath = join(workflowDir, definition.promptFile)
    try {
      const rawPrompt = readFileSync(workflowPromptPath, "utf-8")
      if (!rawPrompt.trim()) {
        throw new Error(`Workflow prompt file is empty: ${workflowPromptPath}`)
      }
      parts.push(rawPrompt)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load workflow prompt: ${error.message}`)
      }
      throw error
    }
  }

  if (stage !== null) {
    const stageConfig = definition.stages[stage]
    if (!stageConfig) {
      throw new Error(`Unknown stage: ${stage}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
    }

    if (stageConfig.promptFile) {
      const stagePromptPath = join(workflowDir, stageConfig.promptFile)
      try {
        const rawPrompt = readFileSync(stagePromptPath, "utf-8")
        if (!rawPrompt.trim()) {
          throw new Error(`Stage prompt file is empty: ${stagePromptPath}`)
        }
        parts.push(rawPrompt)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to load prompt for stage "${stage}": ${error.message}`)
        }
        throw error
      }
    }
  }

  if (parts.length === 0) {
    if (stage !== null) {
      throw new Error(`No prompt file defined for stage "${stage}" or workflow "${definition.id}"`)
    } else {
      throw new Error(`No prompt file defined for workflow "${definition.id}"`)
    }
  }

  return parts.join("\n\n")
}
