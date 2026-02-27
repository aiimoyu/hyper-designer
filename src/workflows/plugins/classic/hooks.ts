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

/**
 * HCollector 资料收集钩子（beforeStage）
 *
 * 在进入阶段前委派 HCollector 收集所需资料和参考文档。
 * 检查 .hyper-designer/{stageKey}/document/completed 文件是否存在，
 * 若不存在则循环重新 prompt，直到文件出现或达到最大重试次数。
 *
 * 第一次调用：正常提示语
 * 后续重试：附带错误上下文（未找到文件、可能原因、第 N 次重试）
 */
export const hcollectorHook: StageHookFn = async ({ stageKey, stageName, capabilities }) => {
  if (!capabilities?.prompt) {
    HyperDesignerLogger.warn('ClassicHooks', `hcollectorHook: 缺少 capabilities.prompt，跳过资料收集`, { stageKey, stageName })
    return
  }

  const completedFilePath = join(process.cwd(), '.hyper-designer', stageKey, 'document', 'completed')

  for (let attempt = 0; attempt < MAX_COLLECTION_RETRIES; attempt++) {
    // 检查完成文件是否已存在（每次循环前检查，包括首次）
    if (existsSync(completedFilePath)) {
      HyperDesignerLogger.debug('ClassicHooks', `资料收集已完成`, { stageKey, stageName, attempt })
      return
    }

    let text: string
    if (attempt === 0) {
      text = `进入 ${stageName} 阶段前，请为该阶段收集所需资料和参考文档。\n\n` +
        `完成资料收集后，请将完成标记写入以下路径：\n` +
        `.hyper-designer/${stageKey}/document/completed\n\n` +
        `（写入任意内容即可，该文件用于标记收集完成）`
    } else {
      text = `错误：资料收集尚未完成（未找到完成标记文件）。\n\n` +
        `期望文件路径：.hyper-designer/${stageKey}/document/completed\n\n` +
        `可能原因：\n` +
        `1. 未创建完成标记文件\n` +
        `2. 文件路径不正确（请确认大小写和目录层级）\n` +
        `3. 收集过程中断未完成\n\n` +
        `这是第 ${attempt + 1} 次重试，请重新收集 ${stageName} 阶段所需资料，\n` +
        `完成后务必将完成标记写入：.hyper-designer/${stageKey}/document/completed`
    }

    HyperDesignerLogger.info('ClassicHooks', `调用 HCollector 收集资料`, { stageKey, stageName, attempt })
    await capabilities.prompt('HCollector', text)
  }

  // 最终检查
  if (existsSync(completedFilePath)) {
    HyperDesignerLogger.debug('ClassicHooks', `资料收集已完成（最终检查通过）`, { stageKey, stageName })
    return
  }

  HyperDesignerLogger.warn('ClassicHooks', `达到最大重试次数，资料收集可能未完成`, {
    stageKey,
    stageName,
    maxRetries: MAX_COLLECTION_RETRIES,
    expectedFile: completedFilePath,
  })
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
