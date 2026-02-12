/**
 * 工作流提示词加载模块
 * 
 * 负责加载工作流和阶段特定的提示词，包括：
 * 1. 加载工作流级别的通用提示词
 * 2. 加载阶段特定的提示词
 * 3. 提供回退机制（当阶段特定提示词不存在时）
 */

import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { WorkflowDefinition } from "./types"
import { HyperDesignerLogger } from "../../utils/logger"

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Navigate from src/workflows/core/ to src/workflows/ then to plugins/
const WORKFLOWS_PLUGINS_DIR = join(__dirname, "..", "plugins")

export function loadWorkflowPrompt(definition: WorkflowDefinition): string {
  const workflowDir = join(WORKFLOWS_PLUGINS_DIR, definition.id)

  if (definition.promptFile) {
    const workflowPromptPath = join(workflowDir, definition.promptFile)
    HyperDesignerLogger.debug("Workflow", `加载工作流级别提示词`, {
      workflowId: definition.id,
      promptFile: definition.promptFile,
      path: workflowPromptPath
    })
    
    try {
      const rawPrompt = readFileSync(workflowPromptPath, "utf-8")
      if (!rawPrompt.trim()) {
        HyperDesignerLogger.warn("Workflow", `工作流提示词文件为空`, {
          path: workflowPromptPath,
          workflowId: definition.id,
          action: "loadWorkflowPrompt",
          error: "Workflow prompt file is empty"
        })
        return ""
      }
      
      HyperDesignerLogger.debug("Workflow", `工作流提示词加载成功`, {
        workflowId: definition.id,
        promptLength: rawPrompt.length
      })
      
      return rawPrompt
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.warn("Workflow", `加载工作流提示词失败`, {
        path: workflowPromptPath,
        workflowId: definition.id,
        action: "loadWorkflowPrompt",
        error: err.message
      })
      return ""
    }
  }

  HyperDesignerLogger.debug("Workflow", `工作流未定义提示词文件`, {
    workflowId: definition.id,
    action: "skipWorkflowPrompt"
  })
  
  return ""
}

export function loadStagePrompt(stage: string | null, definition: WorkflowDefinition): string {
  const workflowDir = join(WORKFLOWS_PLUGINS_DIR, definition.id)

  if (stage !== null) {
    const stageConfig = definition.stages[stage]
    HyperDesignerLogger.debug("Workflow", `加载阶段提示词`, {
      workflowId: definition.id,
      stage,
      action: "loadStagePrompt"
    })
    
    if (!stageConfig) {
      HyperDesignerLogger.warn("Workflow", `未知的工作流阶段`, {
        workflowId: definition.id,
        stage,
        availableStages: Object.keys(definition.stages),
        action: "validateStage",
        error: `Unknown stage: ${stage}`
      })
      return ""
    }

    if (stageConfig.promptFile) {
      const stagePromptPath = join(workflowDir, stageConfig.promptFile)
      HyperDesignerLogger.debug("Workflow", `加载阶段特定提示词文件`, {
        workflowId: definition.id,
        stage,
        promptFile: stageConfig.promptFile,
        path: stagePromptPath
      })
      
      try {
        const rawPrompt = readFileSync(stagePromptPath, "utf-8")
        if (!rawPrompt.trim()) {
          HyperDesignerLogger.warn("Workflow", `阶段提示词文件为空`, {
            workflowId: definition.id,
            stage,
            path: stagePromptPath,
            action: "validatePromptContent",
            error: "Stage prompt file is empty"
          })
          return ""
        }
        
        HyperDesignerLogger.debug("Workflow", `阶段提示词加载成功`, {
          workflowId: definition.id,
          stage,
          promptLength: rawPrompt.length
        })
        
        return rawPrompt
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        HyperDesignerLogger.warn("Workflow", `加载阶段提示词失败`, {
          workflowId: definition.id,
          stage,
          path: stagePromptPath,
          action: "loadStagePrompt",
          error: err.message
        })
        return ""
      }
    }
    
    HyperDesignerLogger.debug("Workflow", `阶段未定义提示词文件`, {
      workflowId: definition.id,
      stage,
      action: "skipStagePrompt"
    })
  } else if (definition.stageFallbackPromptFile) {
    const fallbackPromptPath = join(workflowDir, definition.stageFallbackPromptFile)
    HyperDesignerLogger.debug("Workflow", `加载回退提示词`, {
      workflowId: definition.id,
      stage,
      fallbackFile: definition.stageFallbackPromptFile,
      path: fallbackPromptPath,
      action: "loadFallbackPrompt"
    })
    
    try {
      const rawPrompt = readFileSync(fallbackPromptPath, "utf-8")
      if (!rawPrompt.trim()) {
        HyperDesignerLogger.warn("Workflow", `回退提示词文件为空`, {
          workflowId: definition.id,
          stage,
          path: fallbackPromptPath,
          action: "validateFallbackContent",
          error: "Stage fallback prompt file is empty"
        })
        return ""
      }
      
      HyperDesignerLogger.debug("Workflow", `回退提示词加载成功`, {
        workflowId: definition.id,
        stage,
        promptLength: rawPrompt.length
      })
      
      return rawPrompt
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.warn("Workflow", `加载回退提示词失败`, {
        workflowId: definition.id,
        stage,
        path: fallbackPromptPath,
        action: "loadFallbackPrompt",
        error: err.message
      })
      return ""
    }
  }

  HyperDesignerLogger.debug("Workflow", `未找到阶段提示词`, {
    workflowId: definition.id,
    stage,
    action: "noPromptFound"
  })
  
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
