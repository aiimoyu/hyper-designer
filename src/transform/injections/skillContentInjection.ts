import { readFile, readdir, stat } from 'fs/promises'
import { homedir } from 'os'
import { basename, isAbsolute, join, relative, resolve } from 'path'

import { HyperDesignerLogger } from '../../utils/logger'
import type { PromptInjectionProvider } from '../types'
import type { Dirent } from 'fs'

interface SkillFileResult {
  name: string
  content: string | null
  error: string | null
}

function normalizeSkillFiles(files: string[] | undefined): string[] {
  const deduped: string[] = []
  const fileList = files && files.length > 0 ? files : []
  const normalized = ['SKILL.md', ...fileList]
  for (const item of normalized) {
    const trimmed = item.trim()
    if (!trimmed) continue
    if (!deduped.includes(trimmed)) {
      deduped.push(trimmed)
    }
  }
  const skillIndex = deduped.indexOf('SKILL.md')
  if (skillIndex > 0) {
    deduped.splice(skillIndex, 1)
    deduped.unshift('SKILL.md')
  }
  return deduped
}

function isPathWithinDir(baseDir: string, targetPath: string): boolean {
  const relativePath = relative(baseDir, targetPath)
  if (!relativePath) return true
  return !relativePath.startsWith('..') && !isAbsolute(relativePath)
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function findSkillDir(root: string, skillName: string): Promise<string | null> {
  if (basename(root) === skillName) {
    const skillFile = join(root, 'SKILL.md')
    if (await fileExists(skillFile)) {
      return root
    }
  }

  let entries: Dirent[]
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch (error) {
    return null
  }

  const directories = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b))

  for (const directoryName of directories) {
    const directoryPath = join(root, directoryName)
    if (directoryName === skillName) {
      const skillFile = join(directoryPath, 'SKILL.md')
      if (await fileExists(skillFile)) {
        return directoryPath
      }
    }

    const nested = await findSkillDir(directoryPath, skillName)
    if (nested) {
      return nested
    }
  }

  return null
}

async function resolveSkillDirectory(skillName: string): Promise<string | null> {
  const projectRoot = process.cwd()
  const roots = [
    resolve(projectRoot, '.opencode', 'skills'),
    resolve(projectRoot, '.claude', 'skills'),
    resolve(projectRoot, 'src', 'skills', 'hyper-designer'),
    resolve(homedir(), '.config', 'opencode', 'skills'),
    resolve(homedir(), '.claude', 'skills'),
  ]

  for (const root of roots) {
    const found = await findSkillDir(root, skillName)
    if (found) return found
  }

  return null
}

async function readSkillFile(skillDir: string, name: string): Promise<SkillFileResult> {
  const targetPath = resolve(skillDir, name)
  if (!isPathWithinDir(skillDir, targetPath)) {
    return {
      name,
      content: null,
      error: `Invalid file path: ${name}`,
    }
  }

  try {
    const content = await readFile(targetPath, 'utf-8')
    return { name, content, error: null }
  } catch (error) {
    HyperDesignerLogger.warn('SkillContentInjection', `Failed to read file: ${name}`, { error })
    return {
      name,
      content: null,
      error: `Failed to read file: ${name}`,
    }
  }
}

function formatSkillFiles(files: SkillFileResult[]): string {
  return files.map(file => {
    const contentSection = file.content
      ? `\n      <content>\n${file.content}\n      </content>`
      : '\n      <content></content>'
    const errorSection = file.error
      ? `\n      <error>${file.error}</error>`
      : ''
    return `    <item>\n      <name>${file.name}</name>${contentSection}${errorSection}\n    </item>`
  }).join('\n')
}

export const skillContentInjectionProvider: PromptInjectionProvider = {
  id: 'skill-content',
  inject: async ({ config, currentStage }) => {
    if (!config?.skill) {
      HyperDesignerLogger.warn('SkillContentInjection', 'Missing required config: skill')
      return null
    }

    const skillName = config.skill
    const filesToRead = normalizeSkillFiles(config.files)

    HyperDesignerLogger.debug('SkillContentInjection', `Injecting skill content for stage "${currentStage}"`, {
      skill: skillName,
      files: filesToRead,
    })

    const skillDir = await resolveSkillDirectory(skillName)
    if (!skillDir) {
      HyperDesignerLogger.warn('SkillContentInjection', `Skill not found: ${skillName}`)
      return `<hd-using-skill>\n  <item>\n    <id>${skillName}</id>\n    <error>Skill not found</error>\n  </item>\n</hd-using-skill>`
    }

    const fileResults = await Promise.all(filesToRead.map(file => readSkillFile(skillDir, file)))
    const filesXml = formatSkillFiles(fileResults)

    return `<hd-using-skill>\n  <item>\n    <id>${skillName}</id>\n${filesXml}\n  </item>\n</hd-using-skill>`
  },
}
