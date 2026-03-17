import type { WorkflowDefinition } from '../../../workflows/core/types'
import type { WorkflowPluginRegistration } from '../types'

export const userExampleWorkflow: WorkflowDefinition = {
  id: 'userExampleWorkflow',
  name: 'User Example Workflow',
  description: 'Minimal example workflow for user extension registration',
  entryStageId: 'exampleStage',
  stages: {
    exampleStage: {
      stageId: 'exampleStage',
      name: 'Example Stage',
      description: 'A minimal user-defined workflow stage',
      agent: 'HArchitect',
      getHandoverPrompt: () => 'Run user example workflow stage',
      transitions: [],
    },
  },
}

export const USER_WORKFLOW_PLUGINS: WorkflowPluginRegistration[] = [
  {
    name: userExampleWorkflow.id,
    factory: () => userExampleWorkflow,
  },
]
