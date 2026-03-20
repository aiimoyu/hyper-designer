/**
 * HCollector 资料收集钩子
 *
 * 预设的 before/after 钩子，通过 ctx.adapter 获取平台能力，
 * 与具体 AI 框架（OpenCode 等）解耦，可在不同平台实现中复用。
 */

import * as fs from 'fs'
import { join } from 'path'
import type { StageHookFn } from '../types'
import { HyperDesignerLogger } from '../../../utils/logger'

export function pathExists(path: string): boolean {
  return fs.existsSync(path)
}

export const hCollectorFs = {
  pathExists,
}

/** HCollector 最大重试次数 */
const MAX_COLLECTION_RETRIES = 5

/** Classic 工作流资料收集领域类型 */
export type CollectionDomain = 'codebase' | 'domainAnalysis' | 'systemRequirementAnalysis' | 'systemDesign'

/** HCollector Hook 配置选项 */
export interface HCollectorHookOptions {
  /** 收集资料的领域（支持多个领域） */
  domains: CollectionDomain[]
}

/** 领域中文名称映射 */
const DOMAIN_LABELS: Record<CollectionDomain, string> = {
  codebase: '代码库',
  domainAnalysis: '领域分析',
  systemRequirementAnalysis: '系统需求分析',
  systemDesign: '系统设计',
}

/**
 * 创建 HCollector 资料收集钩子
 *
 * @param options 配置选项，包含要收集的领域列表
 * @returns StageHookFn
 */
export function createHCollectorHook(options: HCollectorHookOptions): StageHookFn {
  return async ({ stageKey, stageName, sessionID, adapter }) => {
    if (!adapter || !sessionID) {
      HyperDesignerLogger.warn('ClassicHooks', 'createHCollectorHook: 缺少 adapter 或 sessionID，跳过资料收集', {
        stageKey,
        stageName,
        domains: options.domains,
      })
      return
    }

    const { domains } = options

    const completedFilePaths = domains.map((domain) =>
      join(process.cwd(), '.hyper-designer', 'document', domain, 'completed'),
    )

    for (let attempt = 0; attempt < MAX_COLLECTION_RETRIES; attempt += 1) {
      const allCompleted = completedFilePaths.every((path) => hCollectorFs.pathExists(path))
      if (allCompleted) {
        HyperDesignerLogger.debug('ClassicHooks', '资料收集已完成', { stageKey, stageName, domains, attempt })
        return
      }

      const incompleteDomains = domains.filter((_, index) => !hCollectorFs.pathExists(completedFilePaths[index]))

      let text: string
      if (attempt === 0) {
        const domainItems = incompleteDomains
          .map((d) => `- **${DOMAIN_LABELS[d]}** \`[domain: ${d}]\``)
          .join('\n')
        const outputRequirements = incompleteDomains
          .flatMap((d) => [
            `2. Maintain \`.hyper-designer/document/${d}/draft.md\` in real-time.`,
            `3. Generate \`.hyper-designer/document/${d}/manifest.md\` upon completion.`,
            `4. Create the \`.hyper-designer/document/${d}/completed\` marker file only after confirming that \`manifest.md\` has been successfully written.`,
          ])
          .join('\n')
        const domainNames = incompleteDomains.map((d) => `\`${d}\``).join(', ')
        text = [
          '## Task Directive',
          '',
          'Initiate the resource collection workflow. The target domain is as follows:',
          '',
          domainItems,
          '',
          '## Output Requirements',
          '',
          '1. Execute sequentially according to the standard workflow.',
          outputRequirements,
          '',
          '## Constraint Reminders',
          '',
          `- Strictly prohibited from expanding to domains other than ${domainNames}.`,
          '- Strictly prohibited from writing any business code.',
        ].join('\n')
      } else {
        const domainItems = incompleteDomains
          .map((d) => `- **${DOMAIN_LABELS[d]}** \`[domain: ${d}]\``)
          .join('\n')
        const domainNames = incompleteDomains.map((d) => `\`${d}\``).join(', ')
        text = [
          `## ⚠️ Task Resumption Instruction (Retry #${attempt})`,
          '',
          'The previous execution was interrupted unexpectedly. Please resume from the interruption point; **do not restart**.',
          '',
          '## Task Directive',
          '',
          'Initiate the resource collection workflow. The target domain is as follows:',
          '',
          domainItems,
          '',
          '## Resumption Execution Strategy',
          '',
          'Please diagnose and resume execution in the following order:',
          '',
          '1. **Check Current Progress**',
          '2. **Proceed to Completion**: Continue the standard workflow from the interruption point until `manifest.md` is output and the `completed` marker file is created.',
          '',
          '## Constraint Reminders',
          '',
          '- This is a resumption execution; strictly prohibited from asking the user repeated questions about already confirmed resources.',
          '- Assets already in `✅ Ready` status must be reused directly; do not re-collect them.',
          `- Strictly prohibited from expanding to domains other than ${domainNames}.`,
        ].join('\n')
      }

      HyperDesignerLogger.info('ClassicHooks', '调用 HCollector 收集资料', { stageKey, stageName, domains, attempt })
      await adapter.sendPrompt({ sessionId: sessionID, agent: 'HCollector', text })
    }

    const allCompleted = completedFilePaths.every((path) => hCollectorFs.pathExists(path))
    if (allCompleted) {
      HyperDesignerLogger.debug('ClassicHooks', '资料收集已完成（最终检查通过）', { stageKey, stageName, domains })
      return
    }

    const stillIncomplete = domains.filter((_, index) => !hCollectorFs.pathExists(completedFilePaths[index]))

    HyperDesignerLogger.warn('ClassicHooks', '达到最大重试次数，部分资料收集未完成', {
      stageKey,
      stageName,
      maxRetries: MAX_COLLECTION_RETRIES,
      incompleteDomains: stillIncomplete,
    })
  }
}
