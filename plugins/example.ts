import type { AgentConfig, WorkflowDefinition } from '../src/types'
import { definePlugin } from '../src/plugin'
import { resolve } from 'path'

const userExampleAgent: AgentConfig = {
  name: 'UserExampleAgent',
  description: 'Minimal user-defined agent plugin example',
  mode: 'subagent',
  prompt: 'You are a user example agent plugin.',
}

const userExampleWorkflow: WorkflowDefinition = {
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

export const EXAMPLE_USER_PLUGIN = definePlugin(async ctx => {
  const workflowWithBasePath: WorkflowDefinition = ctx?.path
    ? {
      ...userExampleWorkflow,
      promptBasePath: resolve(ctx.path),
    }
    : userExampleWorkflow

  return {
    agent: async agents => ({
      ...(agents ?? {}),
      UserExampleAgent: userExampleAgent,
    }),
    workflow: async workflows => ({
      ...(workflows ?? {}),
      userExampleWorkflow: workflowWithBasePath,
    }),
    tool: async tools => ({
      ...(tools ?? {}),
    }),
  }
})
