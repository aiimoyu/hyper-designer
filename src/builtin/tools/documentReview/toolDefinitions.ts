import type { ToolDefinition } from '../../../types'
import { HyperDesignerLogger } from '../../../utils/logger'
import { workflowService } from '../../../workflows/service'
import { finalizeReview } from './finalizeReview'
import { prepareReview } from './prepareReview'

const INTERACTIVE_MODIFICATION_MILESTONE_ID = 'hd-int-mod'

export function createDocumentReviewToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'hd_prepare_review',
      description: 'This tool is used to initiate the interactive document modification workflow. It creates a temporary snapshot file from a specified source path for the user to edit. Call this tool when user intervention is required to adjust content after a document is generated. Note: After calling this, you MUST call hd_finalize_review to retrieve the user\'s modifications. This workflow is required to complete the \'Interactive Modification\' milestone - the milestone will be activated upon successful completion of hd_finalize_review.',
      params: {
        sourcePath: {
          type: 'string',
          description: 'The path of the source file to be reviewed or modified',
        },
        reviewPath: {
          type: 'string',
          optional: true,
          description: 'The temporary destination path for user editing. If not specified, a copy with the same name will be created in the project root by default.',
        },
      },
      execute: async params => {
        const sourcePath = String(params.sourcePath)
        const reviewPath = typeof params.reviewPath === 'string' ? params.reviewPath : undefined

        HyperDesignerLogger.debug('DocumentReview', 'Executing hd_prepare_review', { sourcePath, reviewPath })
        const result = await prepareReview(
          reviewPath === undefined
            ? { sourcePath }
            : { sourcePath, reviewPath },
        )
        return JSON.stringify(result, null, 2)
      },
    },
    {
      name: 'hd_finalize_review',
      description: 'This tool is used to conclude the document modification workflow and retrieve the changes made by the user. It compares the snapshot created by hd_prepare_review with the current content, returns structured data containing additions, deletions, and modifications, and subsequently cleans up the temporary files. Call this tool only after the user explicitly confirms the completion of modifications or indicates no changes are needed, in order to obtain final feedback or update the original document. Upon successful completion, this tool will automatically activate the \'Interactive Modification\' milestone.',
      params: {
        sourcePath: {
          type: 'string',
          description: 'The source file path used when the review was initiated',
        },
        reviewPath: {
          type: 'string',
          optional: true,
          description: 'The temporary path previously edited by the user; must remain consistent with the \'prepare\' phase.',
        },
      },
      execute: async params => {
        const sourcePath = String(params.sourcePath)
        const reviewPath = typeof params.reviewPath === 'string' ? params.reviewPath : undefined

        HyperDesignerLogger.debug('DocumentReview', 'Executing hd_finalize_review', { sourcePath, reviewPath })
        const result = await finalizeReview(
          reviewPath === undefined
            ? { sourcePath }
            : { sourcePath, reviewPath },
        )

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
    },
  ]
}
