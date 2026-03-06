/**
 * 提示词加载器（promptLoader）
 *
 * 负责加载工作流和阶段特定的提示词，包括：
 * 1. 兼容旧版 workflow/stage/fallback promptFile 配置
 * 2. 解析新版 placeholder bindings
 * 3. 提供 stage/fallback 对 workflow 的覆盖规则
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type {
  WorkflowDefinition,
  WorkflowPromptBindings,
} from '../types'
import { HyperDesignerLogger } from '../../../utils/logger'

export const WORKFLOW_OVERVIEW_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}'
export const WORKFLOW_STEP_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'

interface LoadPromptBindingsOptions {
  definition: WorkflowDefinition
  stage: string | null
}

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Navigate from src/workflows/core/runtime/ to src/workflows/ then to plugins/
const WORKFLOWS_PLUGINS_DIR = join(__dirname, '..', '..', 'plugins')

function getWorkflowDir(definition: WorkflowDefinition): string {
  return join(WORKFLOWS_PLUGINS_DIR, definition.id)
}

function loadPromptFile(
  definition: WorkflowDefinition,
  relativePath: string,
  context: Record<string, unknown>,
): string {
  const workflowDir = getWorkflowDir(definition)
  const promptPath = join(workflowDir, relativePath)

  try {
    const rawPrompt = readFileSync(promptPath, 'utf-8')
    if (!rawPrompt.trim()) {
      HyperDesignerLogger.warn('Workflow', '提示词文件为空', {
        workflowId: definition.id,
        path: promptPath,
        promptFile: relativePath,
        ...context,
        error: 'Prompt file is empty',
      })
      return ''
    }

    return rawPrompt
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.warn('Workflow', '加载提示词文件失败', {
      workflowId: definition.id,
      path: promptPath,
      promptFile: relativePath,
      ...context,
      error: err.message,
    })
    return ''
  }
}

function applyPromptBindings(
  result: Record<string, string>,
  bindings: WorkflowPromptBindings | undefined,
): void {
  if (!bindings) {
    return
  }

  for (const [token, binding] of Object.entries(bindings)) {
    result[token] = binding
  }
}

function getLegacyPromptBindings(definition: WorkflowDefinition, stage: string | null): Record<string, string> {
  const result: Record<string, string> = {}

  const workflowPrompt = loadWorkflowPrompt(definition)
  if (workflowPrompt) {
    result[WORKFLOW_OVERVIEW_PROMPT_TOKEN] = workflowPrompt
  }

  const stagePrompt = loadStagePrompt(stage, definition)
  if (stagePrompt) {
    result[WORKFLOW_STEP_PROMPT_TOKEN] = stagePrompt
  }

  return result
}

export function loadPromptBindings({
  definition,
  stage,
}: LoadPromptBindingsOptions): Record<string, string> {
  const resolvedBindings = getLegacyPromptBindings(definition, stage)

  applyPromptBindings(
    resolvedBindings,
    definition.promptBindings,
  )

  if (stage !== null) {
    const stageConfig = definition.stages[stage]
    applyPromptBindings(
      resolvedBindings,
      stageConfig?.promptBindings,
    )
  } else {
    applyPromptBindings(
      resolvedBindings,
      definition.fallbackPromptBindings,
    )
  }

  return resolvedBindings
}

export function loadWorkflowPrompt(definition: WorkflowDefinition): string {
  if (!definition.promptFile) {
    HyperDesignerLogger.debug('Workflow', '工作流未定义提示词文件', {
      workflowId: definition.id,
      action: 'skipWorkflowPrompt',
    })
    return ''
  }

  HyperDesignerLogger.debug('Workflow', '加载工作流级别提示词', {
    workflowId: definition.id,
    promptFile: definition.promptFile,
  })

  return loadPromptFile(definition, definition.promptFile, {
    action: 'loadWorkflowPrompt',
  })
}

export function loadStagePrompt(stage: string | null, definition: WorkflowDefinition): string {
  if (stage !== null) {
    const stageConfig = definition.stages[stage]
    HyperDesignerLogger.debug('Workflow', '加载阶段提示词', {
      workflowId: definition.id,
      stage,
      action: 'loadStagePrompt',
    })

    if (!stageConfig) {
      HyperDesignerLogger.warn('Workflow', '未知的工作流阶段', {
        workflowId: definition.id,
        stage,
        availableStages: Object.keys(definition.stages),
        action: 'validateStage',
        error: `Unknown stage: ${stage}`,
      })
      return ''
    }

    if (!stageConfig.promptFile) {
      HyperDesignerLogger.debug('Workflow', '阶段未定义提示词文件', {
        workflowId: definition.id,
        stage,
        action: 'skipStagePrompt',
      })
      return ''
    }

    return loadPromptFile(definition, stageConfig.promptFile, {
      action: 'loadStagePrompt',
      stage,
    })
  }

  if (!definition.stageFallbackPromptFile) {
    HyperDesignerLogger.debug('Workflow', '未找到阶段提示词', {
      workflowId: definition.id,
      stage,
      action: 'noPromptFound',
    })
    return ''
  }

  HyperDesignerLogger.debug('Workflow', '加载回退提示词', {
    workflowId: definition.id,
    stage,
    fallbackFile: definition.stageFallbackPromptFile,
    action: 'loadFallbackPrompt',
  })

  return loadPromptFile(definition, definition.stageFallbackPromptFile, {
    action: 'loadFallbackPrompt',
    stage,
  })
}

export function loadPromptForStage(stage: string | null, definition: WorkflowDefinition): string {
  const bindings = loadPromptBindings({
    definition,
    stage,
  })

  const workflowPrompt = bindings[WORKFLOW_OVERVIEW_PROMPT_TOKEN] ?? ''
  const stagePrompt = bindings[WORKFLOW_STEP_PROMPT_TOKEN] ?? ''

  const parts: string[] = []
  if (workflowPrompt) {
    parts.push(workflowPrompt)
  }
  if (stagePrompt) {
    parts.push(stagePrompt)
  }

  return parts.join('\n\n')
}
