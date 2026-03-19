import type { WorkflowPluginRegistration } from '../types'

import { classicWorkflow } from './classic'
import { liteWorkflow } from './lite'
import { projectAnalysisWorkflow } from './projectAnalysis'

export const BUILTIN_WORKFLOW_PLUGINS: WorkflowPluginRegistration[] = [
  {
    factory: () => classicWorkflow,
  },
  {
    factory: () => projectAnalysisWorkflow,
  },
  {
    factory: () => liteWorkflow,
  },
]
