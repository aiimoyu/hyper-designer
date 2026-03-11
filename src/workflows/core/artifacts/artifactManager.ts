import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import type { WorkflowDefinition } from '../types'
import type { WorkflowState } from '../state/types'
import { HyperDesignerLogger } from '../../../utils/logger'
import type { ArtifactValidationResult, ResolvedInputs } from './types'
import { ArtifactResolutionError } from './types'

export function resolveStageInputs(
  stageName: string,
  definition: WorkflowDefinition,
  state: WorkflowState,
  basePath: string = process.cwd(),
): ResolvedInputs {
  const stage = definition.stages[stageName]
  if (!stage) {
    throw new ArtifactResolutionError(`Stage not found: ${stageName}`)
  }

  const inputs = stage.inputs ?? {}
  const resolvedInputs: ResolvedInputs = {}
  // 获取被选中的阶段列表（按 stageOrder 顺序）
  const selectedStages = definition.stageOrder.filter(s => state.workflow[s]?.selected !== false)
  const stageIndex = selectedStages.indexOf(stageName)
  const candidateStages = stageIndex >= 0 ? selectedStages.slice(0, stageIndex) : selectedStages

  for (const [inputName, config] of Object.entries(inputs)) {
    let outputPath: string | null = null

    for (const candidateStageName of candidateStages) {
      if (state.workflow[candidateStageName]?.isCompleted !== true) {
        continue
      }

      const candidateOutputs = definition.stages[candidateStageName]?.outputs
      const matchedOutput = candidateOutputs?.[inputName]
      if (matchedOutput) {
        outputPath = matchedOutput.path
      }
    }

    if (outputPath !== null) {
      const fullPath = join(basePath, outputPath)
      if (existsSync(fullPath)) {
        resolvedInputs[inputName] = readFileSync(fullPath, 'utf-8')
        continue
      }
    }

    if (config.required === true) {
      HyperDesignerLogger.warn('Workflow', '必需输入产物缺失', {
        stageName,
        inputName,
        outputPath,
      })
      throw new ArtifactResolutionError(
        `Missing required input artifact "${inputName}" for stage "${stageName}"`,
      )
    }

    resolvedInputs[inputName] = '无'
  }

  return resolvedInputs
}

export function validateStageOutputs(
  stageName: string,
  definition: WorkflowDefinition,
  basePath: string = process.cwd(),
): ArtifactValidationResult {
  const stage = definition.stages[stageName]
  const outputs = stage?.outputs ?? {}
  const missing: string[] = []

  for (const output of Object.values(outputs)) {
    const fullPath = join(basePath, output.path)
    if (!existsSync(fullPath)) {
      missing.push(output.path)
    }
  }

  const result: ArtifactValidationResult = {
    valid: missing.length === 0,
    missing,
  }

  HyperDesignerLogger.debug('Workflow', '校验阶段输出产物', {
    stageName,
    outputCount: Object.keys(outputs).length,
    missingCount: missing.length,
    valid: result.valid,
  })

  return result
}
