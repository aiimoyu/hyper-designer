import { readFileSync } from "fs"
import { join } from "path"
import type { WorkflowDefinition } from "../workflows/types"
import { resolvePrompt } from "../prompts/resolver"
import { OPENCODE_TOOL_REGISTRY } from "../prompts/toolRegistries/opencode"

/**
 * Loads and resolves a prompt file for a specific workflow stage
 * @param stage - The stage name
 * @param definition - The workflow definition
 * @returns The fully resolved prompt content
 * @throws Error if the stage is not found or the prompt file cannot be read
 */
export function loadPromptForStage(stage: string, definition: WorkflowDefinition): string {
  const stageConfig = definition.stages[stage]
  if (!stageConfig) {
    throw new Error(`Unknown stage: ${stage}. Available stages: ${Object.keys(definition.stages).join(', ')}`)
  }

  const workflowDir = join(process.cwd(), "src", "workflows", definition.id)
  const promptPath = join(workflowDir, stageConfig.promptFile)

  try {
    const rawPrompt = readFileSync(promptPath, "utf-8")
    if (!rawPrompt.trim()) {
      throw new Error(`Prompt file is empty: ${promptPath}`)
    }
    return resolvePrompt(rawPrompt, OPENCODE_TOOL_REGISTRY)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load prompt for stage "${stage}": ${error.message}`)
    }
    throw error
  }
}