import type { Hooks } from '@opencode-ai/plugin'

import { HyperDesignerLogger } from '../../../../utils/logger'
import type { PlatformCapabilities } from '../../../capabilities/types'
import type { WorkflowServiceLike } from '../../../orchestration/types'

type EventHook = NonNullable<Hooks['event']>
interface EventInput {
  event: {
    type: string
    properties?: Record<string, unknown>
  }
}

export function createEventHandler(
  workflowService: WorkflowServiceLike,
  capabilities: PlatformCapabilities,
): EventHook {
  return (async ({ event }: EventInput) => {
    const props = event.properties as Record<string, unknown> | undefined
    const sessionID = props?.sessionID as string | undefined

    if (!sessionID) {
      return
    }

    if (event.type !== 'session.idle') {
      return
    }

    const workflowState = workflowService.getState()
    const workflow = workflowService.getDefinition()

    if (!(workflowState && workflowState.current?.handoverTo && workflowState.current !== null && !workflowService.isHandoverInProgress() && workflow)) {
      return
    }

    const handoverPhase = workflowState.current.handoverTo
    const currentPhase = workflowState.current.name

    const nextAgent = workflowService.getHandoverAgent(handoverPhase)
    if (!nextAgent) {
      HyperDesignerLogger.error('OpenCode', '获取交接代理失败', new Error(`Failed to get handover agent for phase: ${handoverPhase}`), {
        phase: handoverPhase,
        workflowId: workflow.id,
        action: 'getHandoverAgent',
        recovery: 'skipHandover',
      })
      return
    }

    const handoverContent = workflowService.getHandoverPrompt(currentPhase, handoverPhase)
    if (!handoverContent) {
      HyperDesignerLogger.error('OpenCode', '获取交接提示词失败', new Error(`Failed to get handover prompt for phase: ${handoverPhase}`), {
        phase: handoverPhase,
        currentPhase,
        workflowId: workflow.id,
        action: 'getHandoverPrompt',
        recovery: 'skipHandover',
      })
      return
    }

    HyperDesignerLogger.info('OpenCode', `工作流交接：从阶段 ${currentPhase || '无'} 到阶段 ${handoverPhase}，由代理 ${nextAgent} 处理。`)

    const adapter = capabilities.toAdapter()
    try {
      await workflowService.executeHandover(sessionID, adapter)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.error('OpenCode', '工作流交接执行失败', err, {
        phase: handoverPhase,
        currentPhase,
        workflowId: workflow.id,
        action: 'executeWorkflowHandover',
        recovery: 'skipPrompt',
      })
      return
    }

    await capabilities.native.sendPrompt({
      sessionId: sessionID,
      agent: nextAgent,
      text: handoverContent,
    })
  }) as EventHook
}
