import { tool } from '@opencode-ai/plugin'

import { prepareReview } from '../../../../tools/documentReview/prepareReview'
import { finalizeReview } from '../../../../tools/documentReview/finalizeReview'
import { HyperDesignerLogger } from '../../../../utils/logger'
import { workflowService } from '../../../../workflows/core/service/WorkflowService'

const INTERACTIVE_MODIFICATION_MILESTONE_ID = 'hd-int-mod'

export function createDocumentReviewTools() {
  return {
    hd_prepare_review: tool({
      description: 'This tool is used to initiate the interactive document modification workflow. It creates a temporary snapshot file from a specified source path for the user to edit. Call this tool when user intervention is required to adjust content after a document is generated. Note: After calling this, you MUST call hd_finalize_review to retrieve the user\'s modifications. This workflow is required to complete the \'Interactive Modification\' milestone - the milestone will be activated upon successful completion of hd_finalize_review.',
      args: {
        sourcePath: tool.schema.string().describe('The path of the source file to be reviewed or modified'),
        reviewPath: tool.schema.string().optional().describe('The temporary destination path for user editing. If not specified, a copy with the same name will be created in the project root by default.'),
      },
      async execute(params: { sourcePath: string; reviewPath?: string }) {
        HyperDesignerLogger.debug('DocumentReview', 'Executing hd_prepare_review', params)
        const result = await prepareReview(params)
        return JSON.stringify(result, null, 2)
      },
    }),

    hd_finalize_review: tool({
      description: 'This tool is used to conclude the document modification workflow and retrieve the changes made by the user. It compares the snapshot created by hd_prepare_review with the current content, returns structured data containing additions, deletions, and modifications, and subsequently cleans up the temporary files. Call this tool only after the user explicitly confirms the completion of modifications or indicates no changes are needed, in order to obtain final feedback or update the original document. Upon successful completion, this tool will automatically activate the \'Interactive Modification\' milestone.',
      args: {
        sourcePath: tool.schema.string().describe('The source file path used when the review was initiated'),
        reviewPath: tool.schema.string().optional().describe('The temporary path previously edited by the user; must remain consistent with the \'prepare\' phase.'),
      },
      async execute(params: { sourcePath: string; reviewPath?: string }) {
        HyperDesignerLogger.debug('DocumentReview', 'Executing hd_finalize_review', params)
        const result = await finalizeReview(params)

        if (result.success) {
          const currentStage = workflowService.getCurrentStage()
          if (currentStage) {
            workflowService.setStageMilestone({
              stage: currentStage,
              milestone: {
                type: INTERACTIVE_MODIFICATION_MILESTONE_ID,
                isCompleted: true,
                detail: { completedAt: new Date().toISOString() },
              },
            })
            HyperDesignerLogger.info('DocumentReview', 'Interactive Modification milestone activated', {
              stage: currentStage,
              milestoneId: INTERACTIVE_MODIFICATION_MILESTONE_ID,
            })
          }
        }

        return JSON.stringify(result, null, 2)
      },
    }),
  }
}
