import type { ToolDefinition } from '../../sdk/runtime'
import { workflowService } from '../../sdk/runtime'

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
    {
      name: 'hd_workflow_detail',
      description: 'Get detailed information about a specific workflow, including its stages, their descriptions, and which stages are required. Use this to understand a workflow before selecting it.',
      params: {
        type_id: {
          type: 'string',
          description: "The ID of the workflow to get details for (e.g., 'classic')",
        },
      },
      execute: async params => {
        const typeId = String(params.type_id)
        const detail = workflowService.getWorkflowDetail(typeId)
        if (!detail) {
          return JSON.stringify({ error: `Workflow '${typeId}' not found`, availableWorkflows: workflowService.listWorkflows().map(w => w.id) }, null, 2)
        }
        return JSON.stringify(detail, null, 2)
      },
    },
    {
      name: 'hd_workflow_select',
      description: 'Select and initialize a workflow for the Hyper Designer project. This MUST be called before any workflow operations (hd_handover, etc.). The stages parameter allows selecting which stages to include - use [{ key, selected }] format. Required stages cannot be deselected.',
      params: {
        type_id: {
          type: 'string',
          description: "The ID of the workflow to select (e.g., 'classic')",
        },
        stages: {
          type: 'array',
          optional: true,
          description: "Stage selection array. If omitted, all stages are selected. Example: [{ key: 'IRAnalysis', selected: true }, { key: 'moduleFunctionalDesign', selected: false }]",
        },
      },
      execute: async params => {
        const typeId = String(params.type_id)
        const detail = workflowService.getWorkflowDetail(typeId)
        if (!detail) {
          return JSON.stringify({ success: false, error: `Workflow '${typeId}' not found` }, null, 2)
        }

        const inputStages = Array.isArray(params.stages) ? params.stages : undefined
        const stages = inputStages
          ? inputStages
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map(item => ({
              key: String(item.key),
              selected: Boolean(item.selected),
            }))
          : detail.stages.map(stage => ({ key: stage.key, selected: true }))

        const result = workflowService.selectWorkflow({ typeId, stages })
        return JSON.stringify(result, null, 2)
      },
    },
    {
      name: 'hd_handover',
      description: `Set the handover workflow stage of the Hyper Designer project.
- If stage_name is omitted: automatically selects the next stage (first stage if current is null, next stage otherwise)
- IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.`,
      params: {
        stage_name: {
          type: 'string',
          optional: true,
          description: 'The name of the workflow stage to set as handover. If omitted, automatically selects the next stage.',
        },
      },
      execute: async params => {
        const stageName = typeof params.stage_name === 'string' ? params.stage_name : undefined
        const result = await workflowService.hdScheduleHandover(stageName)
        return JSON.stringify(result, null, 2)
      },
    },
    {
      name: 'hd_record_milestone',
      description: 'Record or overwrite a milestone for the current workflow stage. For gate milestones, detail may include score/comment and isCompleted should reflect pass/fail.',
      params: {
        milestone: {
          type: 'object',
          description: 'The milestone to record',
        },
      },
      execute: async params => {
        const milestoneInput = params.milestone
        if (typeof milestoneInput !== 'object' || milestoneInput === null) {
          return JSON.stringify({ success: false, error: 'Invalid milestone payload.' }, null, 2)
        }

        const milestone = milestoneInput as {
          type?: unknown
          isCompleted?: unknown
          detail?: unknown
        }

        if (typeof milestone.type !== 'string' || typeof milestone.isCompleted !== 'boolean') {
          return JSON.stringify({ success: false, error: 'Invalid milestone payload.' }, null, 2)
        }

        const stage = workflowService.getCurrentStage()
        if (!stage) {
          return JSON.stringify({
            success: false,
            error: 'No current stage. Cannot record milestone.',
          }, null, 2)
        }

        const timestamp = new Date().toISOString()
        workflowService.setStageMilestone({
          stage,
          milestone: {
            type: milestone.type,
            isCompleted: milestone.isCompleted,
            detail: milestone.detail,
          },
        })

        return JSON.stringify({
          success: true,
          stage,
          milestone: {
            type: milestone.type,
            timestamp,
            isCompleted: milestone.isCompleted,
            detail: milestone.detail,
          },
        }, null, 2)
      },
    },
    {
      name: 'hd_force_next_step',
      description: 'Force advance to the next step in the workflow, bypassing gate checks. Use this when gate approval cannot be achieved after multiple attempts. Call this tool with parameter: {"_": ""}',
      params: {
        _: {
          type: 'string',
          optional: true,
          description: '无实际意义的占位参数，调用时传入随机字符串',
        },
      },
      execute: async () => {
        const result = workflowService.hdForceNextStep()
        return JSON.stringify(result, null, 2)
      },
    },
  ]
}
