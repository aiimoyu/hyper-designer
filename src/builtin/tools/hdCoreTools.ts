import type { ToolDefinition } from '../../types'
import { workflowService } from '../../workflows/service'
import { HyperDesignerLogger } from '../../utils/logger'

export function createHdCoreToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'hd_workflow_state',
      description: 'Get the current workflow state of the Hyper Designer project. Returns uninitialized status if no workflow has been selected. Call this tool with parameter: {"_": ""}',
      params: {
        _: {
          type: 'string',
          optional: true,
          description: 'Optional placeholder parameter - pass empty string or omit',
        },
      },
      execute: async () => {
        const result = workflowService.hdGetWorkflowState()
        return JSON.stringify(result, null, 2)
      },
    },
    {
      name: 'hd_workflow_list',
      description: 'List all available workflows that can be selected for the Hyper Designer project. Use this to see what workflows are available before calling hd_workflow_select. Call this tool with parameter: {"_": ""}',
      params: {
        _: {
          type: 'string',
          optional: true,
          description: 'Optional placeholder parameter - pass empty string or omit',
        },
      },
      execute: async () => {
        const workflows = workflowService.listWorkflows()
        return JSON.stringify({ workflows }, null, 2)
      },
    },
    // {
    //   name: 'hd_workflow_detail',
    //   description: 'Get detailed information about a specific workflow, including its stages, their descriptions, and which stages are required. Use this to understand a workflow before selecting it.',
    //   params: {
    //     type_id: {
    //       type: 'string',
    //       description: "The ID of the workflow to get details for (e.g., 'classic')",
    //     },
    //   },
    //   execute: async params => {
    //     const typeId = String(params.type_id)
    //     const detail = workflowService.getWorkflowDetail(typeId)
    //     if (!detail) {
    //       return JSON.stringify({ error: `Workflow '${typeId}' not found`, availableWorkflows: workflowService.listWorkflows().map(w => w.id) }, null, 2)
    //     }
    //     return JSON.stringify(detail, null, 2)
    //   },
    // },
    {
      name: 'hd_workflow_select',
      description: 'Select and initialize a workflow for the Hyper Designer project. This MUST be called before any workflow operations. All available stages will be selected by default.',
      params: {
        type_id: {
          type: 'string',
          description: "The workflow ID to select (e.g., 'classic', 'lite-designer', 'requirement-designer')",
        },
      },
      execute: async (params, ctx) => {
        const typeId = String(params.type_id)
        const detail = workflowService.getWorkflowDetail(typeId)
        if (!detail) {
          const availableWorkflows = workflowService.listWorkflows()
          return JSON.stringify({
            success: false,
            error: `Workflow '${typeId}' not found.`,
            hint: 'Use hd_workflow_list to see all available workflows.',
            availableWorkflows: availableWorkflows.map(w => ({ id: w.id, name: w.name })),
          }, null, 2)
        }

        const stages = detail.stages.map(stage => ({ key: stage.key, selected: true }))
        const result = workflowService.selectWorkflow({ typeId, stages })

        if (result.success) {
          const handoverResult = await workflowService.hdScheduleHandover('')
          if (handoverResult.scheduled === true) {
            const sessionID = ctx.sessionID
            const adapter = ctx.adapter
            if (sessionID && adapter?.cancelSession) {
              HyperDesignerLogger.info('hd_workflow_select', '初始化完成并触发首次 handover', {
                sessionID,
                workflow: typeId,
                handoverTo: handoverResult.handover_to,
              })
              adapter.cancelSession({ sessionId: sessionID }).catch((error) => {
                const err = error instanceof Error ? error : new Error(String(error))
                HyperDesignerLogger.error('hd_workflow_select', '取消 session 失败（不影响 handover 调度）', err, {
                  sessionID,
                  action: 'cancelSession',
                })
              })
            }
          }
        }

        return JSON.stringify(result, null, 2)
      },
    },
    {
      name: 'hd_handover',
      description: `Handover or end the workflow of the Hyper Designer project.
- next_name: The target stage to handover to. If empty/null/undefined, automatically selects the next stage (first stage if current is null, next stage otherwise). If this is the final stage, workflow will end.
- end: Optional boolean. If true, forces workflow to end regardless of next_name.
- IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.`,
      params: {
        next_name: {
          type: 'string',
          optional: false,
          description: 'The name of the workflow stage to handover to. Pass empty string to auto-select next stage. If this is the final stage, workflow will end.',
        },
        end: {
          type: 'boolean',
          optional: true,
          description: 'If true, ends the workflow regardless of next_name. All files will be archived to .hyper-designer/history.',
        },
      },
      execute: async (params, ctx) => {
        const nextName = typeof params.next_name === 'string' ? params.next_name.trim() : ''
        const endFlag = typeof params.end === 'boolean' ? params.end : false
        const result = await workflowService.hdScheduleHandover(nextName, endFlag)

        if (result.scheduled === true) {
          const sessionID = ctx.sessionID
          const adapter = ctx.adapter
          if (sessionID && adapter?.cancelSession) {
            HyperDesignerLogger.info('hd_handover', '调度成功，立即取消当前 session 以阻止模型继续输出', {
              sessionID,
              handoverTo: result.handover_to,
            })
            adapter.cancelSession({ sessionId: sessionID }).catch((error) => {
              const err = error instanceof Error ? error : new Error(String(error))
              HyperDesignerLogger.error('hd_handover', '取消 session 失败（不影响 handover 调度）', err, {
                sessionID,
                action: 'cancelSession',
              })
            })
          }
        }

        return JSON.stringify(result, null, 2)
      },
    },
    {
      name: 'hd_get_milestone',
      description: 'Get the status of a specific milestone or all milestones for the current workflow stage.',
      params: {
        id: {
          type: 'string',
          optional: true,
          description: 'The milestone id to query. If omitted, returns all milestones for the current stage.',
        },
      },
      execute: async params => {
        const state = workflowService.getState()
        if (!state || !state.initialized) {
          return JSON.stringify({
            error: 'Workflow not initialized. Use hd_workflow_select to initialize a workflow first.',
          }, null, 2)
        }

        const currentStage = state.current?.name
        if (!currentStage) {
          return JSON.stringify({
            error: 'No current stage set. Use hd_handover to advance to a stage first.',
          }, null, 2)
        }

        const milestones = state.runtime?.currentNodeContext?.milestones ?? {}
        const milestoneId = params.id as string | undefined

        if (milestoneId) {
          const milestone = milestones[milestoneId]
          if (!milestone) {
            return JSON.stringify({
              stage: currentStage,
              id: milestoneId,
              status: 'not_set',
              available_milestones: Object.keys(milestones),
            }, null, 2)
          }
          return JSON.stringify({
            stage: currentStage,
            id: milestoneId,
            name: milestone.name,
            mark: milestone.mark,
            timestamp: milestone.updatedAt,
            detail: milestone.detail,
          }, null, 2)
        }

        return JSON.stringify({
          stage: currentStage,
          milestones: Object.entries(milestones).map(([key, m]) => ({
            id: key,
            name: m.name,
            mark: m.mark,
            timestamp: m.updatedAt,
            detail: m.detail,
          })),
        }, null, 2)
      },
    },
    {
      name: 'hd_record_milestone',
      description: `Record or overwrite a milestone for the current workflow stage. Multiple calls with the same id will overwrite the previous milestone.
- id: A private, unique identifier for the milestone. Used for querying and setting. Should NOT be exposed or leaked.
- name: The display name of the milestone (e.g., "Quality Gate"). This is what everyone sees and knows. Names CAN be duplicated across milestones.
- IMPORTANT: id and name MUST NOT be identical. id is for internal reference (e.g., 'hd-gate-passed'), name is for human display (e.g., 'Quality Gate').`,
      params: {
        id: {
          type: 'string',
          description: "Private milestone identifier. Used for querying and setting. Should NOT be exposed or leaked. WARNING: Built-in milestones (starting with 'hd-') control workflow flow and should NOT be lit unless you explicitly understand their impact (e.g., 'hd-force-advance' enables forced progression). For normal stage completion, use custom milestone ids.",
        },
        name: {
          type: 'string',
          description: 'The display name of the milestone. This is the human-readable label that everyone knows. Names may be duplicated.',
        },
        mark: {
          type: 'boolean',
          description: 'Mark the milestone as lit (true) or unlit (false)',
        },
        detail: {
          type: 'object',
          optional: true,
          description: 'Additional context for this milestone (e.g., evidence for why it was lit, reference links, notes). This is for documentation purposes and does not affect workflow logic.',
        },
      },
      execute: async params => {
        const typeValue = params.id
        const nameValue = params.name
        const markValue = params.mark

        if (typeof typeValue !== 'string') {
          return JSON.stringify({
            success: false,
            error: `Invalid id parameter. Expected string, got ${typeValue === undefined ? 'undefined' : typeof typeValue}`,
            requiredFields: {
              id: 'string (private identifier, must NOT equal name)',
              name: 'string (display name, e.g., "Quality Gate")',
              mark: 'boolean (true to light up, false to turn off)',
              detail: 'object (optional, additional context)',
            },
            example: { id: 'hd-interactive-modification', name: 'Interactive Modification', mark: true, detail: { reason: 'User review completed' } },
          }, null, 2)
        }

        if (typeof nameValue !== 'string') {
          return JSON.stringify({
            success: false,
            error: `Invalid name parameter. Expected string, got ${nameValue === undefined ? 'undefined' : typeof nameValue}`,
            requiredFields: {
              id: 'string (private identifier, must NOT equal name)',
              name: 'string (display name, e.g., "Quality Gate")',
              mark: 'boolean (true to light up, false to turn off)',
              detail: 'object (optional, additional context)',
            },
            example: { id: 'hd-interactive-modification', name: 'Interactive Modification', mark: true, detail: { reason: 'User review completed' } },
          }, null, 2)
        }

        if (typeValue === nameValue) {
          return JSON.stringify({
            success: false,
            error: `id and name must NOT be identical. id="${typeValue}" is a private identifier used for querying and setting, while name="${nameValue}" is the human-readable display name. They must differ.`,
            hint: 'Use a distinct id like "hd-interactive-modification" with name "Interactive Modification".',
            example: { id: 'hd-interactive-modification', name: 'Interactive Modification', mark: true },
          }, null, 2)
        }

        if (typeof markValue !== 'boolean') {
          return JSON.stringify({
            success: false,
            error: `Invalid mark parameter. Expected boolean, got ${markValue === undefined ? 'undefined' : typeof markValue}`,
            requiredFields: {
              id: 'string (private identifier, must NOT equal name)',
              name: 'string (display name, e.g., "Quality Gate")',
              mark: 'boolean (true to light up, false to turn off)',
              detail: 'object (optional, additional context)',
            },
            example: { id: 'hd-interactive-modification', name: 'Interactive Modification', mark: true, detail: { reason: 'All tasks finished' } },
          }, null, 2)
        }

        const stage = workflowService.getCurrentStage()
        if (!stage) {
          return JSON.stringify({
            success: false,
            error: 'No current stage. Cannot record milestone. Please ensure a workflow stage is active before recording milestones.',
            hint: 'Call hd_workflow_state to check current stage, or hd_workflow_select to initialize a workflow.',
          }, null, 2)
        }

        const detailValue = typeof params.detail === 'object' && params.detail !== null ? params.detail : undefined
        const timestamp = new Date().toISOString()
        workflowService.setStageMilestone({
          stage,
          milestone: {
            type: typeValue,
            name: nameValue,
            mark: markValue,
            detail: detailValue,
          },
        })

        return JSON.stringify({
          success: true,
          stage,
          milestone: {
            id: typeValue,
            name: nameValue,
            timestamp,
            mark: markValue,
            detail: detailValue,
          },
        }, null, 2)
      },
    },
    {
      name: 'hd_force_next_step',
      description: `Force advance to the next step in the workflow, bypassing gate checks. This is a fallback tool used when hd_handover fails or when the user explicitly requests to skip the quality review. Except when explicitly authorized by the user, NEVER use this tool. Call this tool with parameter: {"_": ""}`,
      params: {
        _: {
          type: 'string',
          optional: true,
          description: 'Placeholder parameter with no practical significance',
        },
      },
      execute: async () => {
        const result = workflowService.hdForceNextStep()
        return JSON.stringify(result, null, 2)
      },
    },
  ]
}
