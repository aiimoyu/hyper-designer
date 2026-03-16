import { workflowService } from '../../workflows/core/service'
import { transformSystemMessages } from '../systemTransformer'

export function createSystemTransformer() {
  return async (_input: unknown, output: { system: string[] }) => {
    const workflow = workflowService.getDefinition()
    const workflowState = workflowService.getState()
    transformSystemMessages(output.system, workflow, workflowState)
  }
}
