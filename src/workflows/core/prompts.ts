import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { WorkflowDefinition } from "./types"

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Navigate from src/workflows/core/ to src/workflows/ then to plugins/
const WORKFLOWS_PLUGINS_DIR = join(__dirname, "..", "plugins")

export function loadWorkflowPrompt(definition: WorkflowDefinition): string {
  const workflowDir = join(WORKFLOWS_PLUGINS_DIR, definition.id)

  if (definition.promptFile) {
    const workflowPromptPath = join(workflowDir, definition.promptFile)
    console.log(`Loading workflow-level prompt from ${workflowPromptPath} for workflow "${definition.id}"`)
    try {
      const rawPrompt = readFileSync(workflowPromptPath, "utf-8")
      if (!rawPrompt.trim()) {
        throw new Error(`Workflow prompt file is empty: ${workflowPromptPath}`)
      }
      return rawPrompt
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load workflow prompt: ${error.message}`)
      }
      throw error
    }
  }

  return ""
}

export function loadStagePrompt(stage: string | null, definition: WorkflowDefinition): string {
  const workflowDir = join(WORKFLOWS_PLUGINS_DIR, definition.id)

  if (stage !== null) {
    const stageConfig = definition.stages[stage]
    console.log(`Loading prompt for stage "${stage}" in workflow "${definition.id}" from ${stageConfig}`)
    if (!stageConfig) {
      throw new Error(`Unknown stage: ${stage}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
    }

    if (stageConfig.promptFile) {
      const stagePromptPath = join(workflowDir, stageConfig.promptFile)
      console.log(`Loading stage-level prompt from ${stagePromptPath} for stage "${stage}"`)
      try {
        const rawPrompt = readFileSync(stagePromptPath, "utf-8")
        if (!rawPrompt.trim()) {
          throw new Error(`Stage prompt file is empty: ${stagePromptPath}`)
        }
        return rawPrompt
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to load prompt for stage "${stage}": ${error.message}`)
        }
        throw error
      }
    }
  } else if (definition.stageFallbackPromptFile) {
    const fallbackPromptPath = join(workflowDir, definition.stageFallbackPromptFile)
    console.log(`No stage-specific prompt defined for stage "${stage}", loading fallback prompt from ${fallbackPromptPath}`)
    try {
      const rawPrompt = readFileSync(fallbackPromptPath, "utf-8")
      if (!rawPrompt.trim()) {
        throw new Error(`Stage fallback prompt file is empty: ${fallbackPromptPath}`)
      }
      return rawPrompt
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load fallback prompt for stage "${stage}": ${error.message}`)
      }
      throw error
    }
  }

  return ""
}

export function loadPromptForStage(stage: string | null, definition: WorkflowDefinition): string {
  const workflowPrompt = loadWorkflowPrompt(definition)
  const stagePrompt = loadStagePrompt(stage, definition)

  const parts: string[] = []
  if (workflowPrompt) {
    parts.push(workflowPrompt)
  }
  if (stagePrompt) {
    parts.push(stagePrompt)
  }

  return parts.join("\n\n")
}
