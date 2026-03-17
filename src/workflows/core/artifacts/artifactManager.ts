import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import * as glob from 'glob'

import type { WorkflowDefinition, StageFileItem } from '../types'
import type { WorkflowState } from '../state/types'
import { HyperDesignerLogger } from '../../../utils/logger'
import type { ArtifactValidationResult, ResolvedInputs } from './types'
import { ArtifactResolutionError } from './types'

function resolveInputContent(item: StageFileItem, basePath: string): string {
  const absolutePath = item.path.startsWith('./')
    ? resolve(basePath, item.path.slice(2))
    : join(basePath, item.path)

  if (item.type === 'file') {
    if (existsSync(absolutePath)) {
      return readFileSync(absolutePath, 'utf-8')
    }
    return ''
  }

  if (item.type === 'folder') {
    if (existsSync(absolutePath)) {
      const entries = readdirSync(absolutePath, { withFileTypes: true })
      const lines = entries.map(e => e.isDirectory() ? `📁 ${e.name}/` : `📄 ${e.name}`)
      return lines.join('\n')
    }
    return ''
  }

  if (item.type === 'pattern') {
    const cwd = basePath
    const pattern = item.path.startsWith('./') ? item.path.slice(2) : item.path
    const matches = glob.sync(pattern, { cwd })
    if (matches.length === 0) {
      return '[No matching files found]'
    }
    const contents: string[] = []
    for (const match of matches) {
      const matchPath = resolve(cwd, match)
      if (existsSync(matchPath)) {
        const content = readFileSync(matchPath, 'utf-8')
        contents.push(`--- ${match} ---\n${content}`)
      }
    }
    return contents.join('\n\n')
  }

  return ''
}

export function resolveStageInputs(
  stageName: string,
  definition: WorkflowDefinition,
  _state: WorkflowState,
  basePath: string = process.cwd(),
): ResolvedInputs {
  const stage = definition.stages[stageName]
  if (!stage) {
    throw new ArtifactResolutionError(`Stage not found: ${stageName}`)
  }

  const inputs = stage.inputs ?? []
  const resolvedInputs: ResolvedInputs = {}

  for (const inputItem of inputs) {
    const content = resolveInputContent(inputItem, basePath)
    if (content === '' || content === '[No matching files found]') {
      HyperDesignerLogger.warn('Workflow', '输入产物缺失', {
        stageName,
        inputId: inputItem.id,
        inputPath: inputItem.path,
      })
      resolvedInputs[inputItem.id] = '无'
    } else {
      resolvedInputs[inputItem.id] = content
    }
  }

  return resolvedInputs
}

export function validateStageOutputs(
  stageName: string,
  definition: WorkflowDefinition,
  basePath: string = process.cwd(),
): ArtifactValidationResult {
  const stage = definition.stages[stageName]
  const outputs = stage?.outputs ?? []
  const missing: string[] = []

  for (const output of outputs) {
    const absolutePath = output.path.startsWith('./')
      ? resolve(basePath, output.path.slice(2))
      : join(basePath, output.path)

    let exists = false
    if (output.type === 'file') {
      exists = existsSync(absolutePath)
    } else if (output.type === 'folder') {
      exists = existsSync(absolutePath)
    } else if (output.type === 'pattern') {
      const cwd = basePath
      const pattern = output.path.startsWith('./') ? output.path.slice(2) : output.path
      const matches = glob.sync(pattern, { cwd })
      exists = matches.length > 0
    }

    if (!exists) {
      missing.push(output.path)
    }
  }

  const result: ArtifactValidationResult = {
    valid: missing.length === 0,
    missing,
  }

  HyperDesignerLogger.debug('Workflow', '校验阶段输出产物', {
    stageName,
    outputCount: outputs.length,
    missingCount: missing.length,
    valid: result.valid,
  })

  return result
}
