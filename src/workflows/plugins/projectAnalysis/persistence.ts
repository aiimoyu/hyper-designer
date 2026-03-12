import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface ProjectAnalysisMetadata {
  projectPath: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

function getMetaDir(targetRoot: string): string {
  return join(targetRoot, '.hyper-designer', 'projectAnalysis', '_meta')
}

function getManifestPath(targetRoot: string): string {
  return join(getMetaDir(targetRoot), 'manifest.json')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.toISOString() === value
}

function isDirectory(path: string): boolean {
  if (!existsSync(path)) {
    return false
  }

  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function readManifest(manifestPath: string): Record<string, unknown> | null {
  try {
    if (!existsSync(manifestPath)) {
      return null
    }

    const raw = readFileSync(manifestPath, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

/**
 * 校验 manifest 文件是否符合最小 schema。
 *
 * 必填字段：projectPath、createdAt、updatedAt。
 * 允许扩展字段。
 *
 * @param manifestPath manifest 文件绝对路径
 * @returns 是否符合 schema
 */
export function validateManifestSchema(manifestPath: string): boolean {
  const parsed = readManifest(manifestPath)
  if (!parsed) {
    return false
  }

  return (
    isNonEmptyString(parsed.projectPath) &&
    isIsoDateString(parsed.createdAt) &&
    isIsoDateString(parsed.updatedAt)
  )
}

/**
 * 保存 projectAnalysis 的目标项目路径到目标项目 manifest。
 *
 * @param projectPath 目标项目路径
 * @param targetRoot 目标项目根目录（写入根）
 */
export function saveProjectPath(projectPath: string, targetRoot: string): void {
  if (!isNonEmptyString(projectPath)) {
    throw new Error('projectPath must be a non-empty string')
  }

  if (!isDirectory(targetRoot)) {
    throw new Error(`targetRoot is not a valid directory: ${targetRoot}`)
  }

  const metaDir = getMetaDir(targetRoot)
  const manifestPath = getManifestPath(targetRoot)
  const existing = readManifest(manifestPath)
  const now = new Date().toISOString()

  const createdAt =
    existing && isIsoDateString(existing.createdAt)
      ? existing.createdAt
      : now

  const manifest: ProjectAnalysisMetadata = {
    ...(existing ?? {}),
    projectPath: projectPath.trim(),
    createdAt,
    updatedAt: now,
  }

  mkdirSync(metaDir, { recursive: true })
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
}

/**
 * 读取 projectAnalysis manifest 元数据。
 *
 * @param targetRoot 目标项目根目录
 * @returns 有效 metadata；无效或不存在时返回 null
 */
export function getProjectAnalysisMetadata(targetRoot: string): ProjectAnalysisMetadata | null {
  if (!isDirectory(targetRoot)) {
    return null
  }

  const manifestPath = getManifestPath(targetRoot)
  if (!validateManifestSchema(manifestPath)) {
    return null
  }

  const parsed = readManifest(manifestPath)
  if (!parsed) {
    return null
  }

  return parsed as ProjectAnalysisMetadata
}

/**
 * 获取已保存的项目路径，并更新 manifest 的 updatedAt。
 *
 * @param targetRoot 目标项目根目录
 * @returns 已保存 projectPath；不存在或无效时返回 null
 */
export function getProjectPath(targetRoot: string): string | null {
  const metadata = getProjectAnalysisMetadata(targetRoot)
  if (!metadata) {
    return null
  }

  const manifestPath = getManifestPath(targetRoot)
  const nextManifest: ProjectAnalysisMetadata = {
    ...metadata,
    updatedAt: new Date().toISOString(),
  }

  writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2), 'utf-8')
  return metadata.projectPath
}

/**
 * 是否应重新提示用户输入 project path。
 *
 * @param targetRoot 目标项目根目录
 * @returns true 表示应提示；false 表示可复用 manifest
 */
export function shouldPromptForProjectPath(targetRoot: string): boolean {
  return getProjectAnalysisMetadata(targetRoot) === null
}
