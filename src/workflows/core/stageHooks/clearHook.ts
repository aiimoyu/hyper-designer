/**
 * 上下文清空钩子
 *
 * 离开阶段时创建一个新会话并切换 UI，后续交接提示词进入全新上下文。
 * 通过 adapter.clearSession 执行，若平台未提供则静默跳过。
 */

import type { StageHookFn } from '../types'
import { HyperDesignerLogger } from '../../../utils/logger'

/**
 * 上下文清空钩子（after）
 */
export const clearHook: StageHookFn = async ({ stageKey, stageName, sessionID, adapter }) => {
  if (!adapter || !sessionID) {
    HyperDesignerLogger.debug('ClassicHooks', 'clearHook: 缺少 adapter 或 sessionID，跳过清空', { stageKey, stageName })
    return
  }

  HyperDesignerLogger.info('ClassicHooks', '执行上下文清空', { stageKey, stageName })
  await adapter.clearSession(sessionID)
}
