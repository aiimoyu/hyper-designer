import type { CommandDefinition } from '../../types'

export function createHyperHandoverCommand(): CommandDefinition {
  return {
    template: `The user is now requesting a handover. Regardless of what work you are currently doing, stop and execute the handover immediately.

1. First, call \`hd_workflow_state\` to check the current workflow status.
2. If the workflow is not initialized, tell the user: "当前工作流未初始化，无法进行交接。" and stop.
3. If the workflow IS initialized, call \`hd_handover\` to advance to the next stage.
4. If \`hd_handover\` fails (e.g., returns an error), immediately call \`hd_force_next_step\` as a fallback to force the handover.`,
    description: 'Handover to the next workflow stage',
    agent: 'Hyper',
    subtask: false,
  }
}
