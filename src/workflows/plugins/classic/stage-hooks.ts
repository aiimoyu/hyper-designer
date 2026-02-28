/**
 * @deprecated 请改用 workflows/core/stageHooks
 *
 * 兼容导出层：保留旧路径，避免外部导入立即失效。
 */

export {
  createHCollectorHook,
  summarizeHook,
  irAnalysisCollectorHook,
  scenarioAnalysisCollectorHook,
  systemDesignCollectorHook,
} from '../../core/stageHooks'

export type { CollectionDomain, HCollectorHookOptions } from '../../core/stageHooks'
