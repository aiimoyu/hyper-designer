import type { WorkflowPluginRegistration } from '../types'

import { classicWorkflow } from './classic'
import { liteWorkflow } from './lite'
import { projectAnalysisWorkflow } from './projectAnalysis'

export const BUILTIN_WORKFLOW_PLUGINS: WorkflowPluginRegistration[] = [
  {
    name: 'classic',
    factory: () => classicWorkflow,
  },
  {
    name: 'projectAnalysis',
    factory: () => projectAnalysisWorkflow,
  },
  {
    name: 'lite',
    factory: () => liteWorkflow,
  },
]
