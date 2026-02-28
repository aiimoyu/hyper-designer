/**
 * 上下文压缩钩子
 *
 * 离开阶段时压缩会话上下文，避免历史消息过长影响后续阶段的推理质量。
 * 通过 capabilities.summarize 执行，若平台未提供则静默跳过。
 */

import type { StageHookFn } from '../types'
import { HyperDesignerLogger } from '../../../utils/logger'

/**
 * 上下文压缩钩子（afterStage）
 */
export const summarizeHook: StageHookFn = async ({ stageKey, stageName, capabilities }) => {
  if (!capabilities?.summarize) {
    HyperDesignerLogger.debug('ClassicHooks', 'summarizeHook: 缺少 capabilities.summarize，跳过压缩', { stageKey, stageName })
    return
  }

  HyperDesignerLogger.info('ClassicHooks', '执行上下文压缩', { stageKey, stageName })
  await capabilities.summarize()
}