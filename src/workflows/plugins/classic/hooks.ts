/**
 * Classic workflow stage hooks
 *
 * Provides beforeStage/afterStage hook functions for the classic
 * requirements engineering workflow. Currently implements the
 * HCollector pre-stage hook that triggers material collection
 * before each workflow stage begins.
 */

import type { StageHookFn } from '../../core/types'
import { createOpencodeClient } from '@opencode-ai/sdk'

/**
 * Pre-stage hook that invokes HCollector to gather required materials
 * and reference documents before a workflow stage starts.
 *
 * Called automatically by the workflow engine's beforeStage mechanism
 * for every classic workflow stage.
 *
 * @param ctx - Hook context containing stageName and workflow definition
 */
export const hcollectorHook: StageHookFn = async ({ stageName, workflow }) => {
  const client = createOpencodeClient()
  const prompt = `进入 ${stageName} 阶段前，请为该阶段收集所需资料和参考文档。`

  await client.session.prompt({
    path: { id: workflow.id },
    body: {
      agent: 'HCollector',
      noReply: false,
      parts: [{ type: 'text', text: prompt }],
    },
  })
}
