/**
 * 阶段钩子导出
 */

export {
  createHCollectorHook,
  summarizeHook,
  irAnalysisCollectorHook,
  scenarioAnalysisCollectorHook,
  systemDesignCollectorHook,
} from './classicStageHooks'

export type { CollectionDomain, HCollectorHookOptions } from './classicStageHooks'
