/**
 * Classic workflow stage hooks (framework-agnostic)
 *
 * 预设的 beforeStage/afterStage 钩子，通过 ctx.capabilities 获取平台能力，
 * 与具体 AI 框架（OpenCode 等）解耦，可在不同平台实现中复用。
 */

import { existsSync } from 'fs'
import { join } from 'path'
import type { StageHookFn } from '../../core/types'
import { HyperDesignerLogger } from '../../../utils/logger'

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
 *
 * @example
 * ```ts
 * // 收集领域分析资料
 * beforeStage: [createHCollectorHook({ domains: ['domainAnalysis'] })]
 *
 * // 收集系统设计和代码库资料
 * beforeStage: [createHCollectorHook({ domains: ['systemDesign', 'codebase'] })]
 * ```
 */
export function createHCollectorHook(options: HCollectorHookOptions): StageHookFn {
  return async ({ stageKey, stageName, capabilities }) => {
    if (!capabilities?.prompt) {
      HyperDesignerLogger.warn('ClassicHooks', `createHCollectorHook: 缺少 capabilities.prompt，跳过资料收集`, { stageKey, stageName, domains: options.domains })
      return
    }

    const { domains } = options
    const domainLabels = domains.map(d => DOMAIN_LABELS[d]).join('、')

    // 收集所有领域的完成标记文件路径
    const completedFilePaths = domains.map(domain =>
      join(process.cwd(), '.hyper-designer', 'document', domain, 'completed')
    )

    for (let attempt = 0; attempt < MAX_COLLECTION_RETRIES; attempt++) {
      // 检查所有领域的完成文件是否都已存在
      const allCompleted = completedFilePaths.every(path => existsSync(path))
      if (allCompleted) {
        HyperDesignerLogger.debug('ClassicHooks', `资料收集已完成`, { stageKey, stageName, domains, attempt })
        return
      }

      // 找出未完成的领域
      const incompleteDomains = domains.filter((_, index) => 
        !existsSync(completedFilePaths[index])
      )

      let text: string
      if (attempt === 0) {
        text = `进入 ${stageName} 阶段前，需要收集以下领域的资料：${domainLabels}\n\n` +
          `请按照 HCollector 的工作流程，依次收集各领域资料：\n` +
          incompleteDomains.map(d => `- ${DOMAIN_LABELS[d]}：.hyper-designer/document/${d}/completed`).join('\n') +
          `\n\n完成资料收集后，请在对应领域目录下创建 completed 标记文件。`
      } else {
        const incompleteLabels = incompleteDomains.map(d => DOMAIN_LABELS[d]).join('、')
        text = `错误：以下领域资料收集尚未完成：${incompleteLabels}\n\n` +
          `未找到的完成标记文件：\n` +
          incompleteDomains.map(d => `- .hyper-designer/document/${d}/completed`).join('\n') +
          `\n\n这是第 ${attempt + 1} 次重试，请继续收集缺失的资料。`
      }

      HyperDesignerLogger.info('ClassicHooks', `调用 HCollector 收集资料`, { stageKey, stageName, domains, attempt })
      await capabilities.prompt('HCollector', text)
    }

    // 最终检查
    const allCompleted = completedFilePaths.every(path => existsSync(path))
    if (allCompleted) {
      HyperDesignerLogger.debug('ClassicHooks', `资料收集已完成（最终检查通过）`, { stageKey, stageName, domains })
      return
    }

    const stillIncomplete = domains.filter((_, index) => 
      !existsSync(completedFilePaths[index])
    )

    HyperDesignerLogger.warn('ClassicHooks', `达到最大重试次数，部分资料收集未完成`, {
      stageKey,
      stageName,
      maxRetries: MAX_COLLECTION_RETRIES,
      incompleteDomains: stillIncomplete,
    })
  }
}

/**
 * 上下文压缩钩子（afterStage）
 *
 * 离开阶段时压缩会话上下文，避免历史消息过长影响后续阶段的推理质量。
 * 通过 capabilities.summarize 执行，若平台未提供则静默跳过。
 */
export const summarizeHook: StageHookFn = async ({ stageKey, stageName, capabilities }) => {
  if (!capabilities?.summarize) {
    HyperDesignerLogger.debug('ClassicHooks', `summarizeHook: 缺少 capabilities.summarize，跳过压缩`, { stageKey, stageName })
    return
  }

  HyperDesignerLogger.info('ClassicHooks', `执行上下文压缩`, { stageKey, stageName })
  await capabilities.summarize()
}

// ============ 预设钩子实例 ============

/** IR分析阶段：收集领域分析资料 */
export const irAnalysisCollectorHook = createHCollectorHook({ domains: ['domainAnalysis'] })

/** 场景分析阶段：收集系统需求分析资料 */
export const scenarioAnalysisCollectorHook = createHCollectorHook({ domains: ['systemRequirementAnalysis'] })

/** 系统功能设计阶段：收集系统设计和代码库资料 */
export const systemDesignCollectorHook = createHCollectorHook({ domains: ['systemDesign', 'codebase'] })

