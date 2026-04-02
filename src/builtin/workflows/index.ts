import type { WorkflowPluginRegistration } from '../../types'
import { classicWorkflow } from './classic'
import { liteWorkflow } from './lite'
import { requirementWorkflow } from './requirementsDesign'
import { projectAnalysisWorkflow } from './projectAnalysis'
import { projectToSkillWorkflow } from './projectToSkill'

export const BUILTIN_WORKFLOW_PLUGINS: WorkflowPluginRegistration[] = [
  // {
  //   factory: () => classicWorkflow,
  // },
  {
    factory: () => projectAnalysisWorkflow,
  },
  {
    factory: () => requirementWorkflow,
  },
  // {
  //   factory: () => projectToSkillWorkflow,
  // },
]
