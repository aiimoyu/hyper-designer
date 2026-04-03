import type { CommandDefinition } from '../../types'

export function createHyperEndCommand(): CommandDefinition {
  return {
    template: 'First, call `hd_workflow_state` to check the current workflow status. If the workflow is not initialized (uninitialized state), tell the user: "当前工作流未初始化，无需结束工作流，你可以直接继续工作。" and stop. If the workflow IS initialized, call `hd_handover` with `end=true` to end it. Do NOT continue with any tasks, do NOT call other tools.',
    description: 'End the current hyper-designer workflow and archive all files',
    agent: 'Hyper',
    subtask: false,
  }
}
