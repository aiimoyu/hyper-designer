import type { WorkflowDefinition, WorkflowPluginRegistration } from '../../src/sdk/contracts'

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
    factory: () => userExampleWorkflow,
  },
]
