import type { PluginInput } from '@opencode-ai/plugin'

import { HyperDesignerLogger } from '../../../utils/logger'
import type { PlatformCapabilities } from '../../capabilities/types'
import type { WorkflowServiceLike } from '../../orchestration/types'
import { createEventHandler } from './event-handler'

export async function createWorkflowHooks(
  _ctx: PluginInput,
  workflowService: WorkflowServiceLike,
  capabilities: PlatformCapabilities,
): Promise<{ event: ReturnType<typeof createEventHandler> }> {
  workflowService.on('handoverExecuted', ({ fromStep, toStep }) => {
    HyperDesignerLogger.info('Integrations', `Handover completed: ${fromStep || '(none)'} → ${toStep}`)
  })

  workflowService.on('stageCompleted', ({ stageName, isCompleted }) => {
    HyperDesignerLogger.info('Integrations', `Stage ${stageName} ${isCompleted ? 'completed' : 'uncompleted'}`)
  })

  if (!workflowService.getDefinition()) {
    HyperDesignerLogger.warn('OpenCode', '工作流未初始化，进入 fallback 模式，等待 hd_workflow_select。', {
      action: 'createWorkflowHooks',
      mode: 'fallback',
    })
  }

  return {
    event: createEventHandler(workflowService, capabilities),
  }
}
