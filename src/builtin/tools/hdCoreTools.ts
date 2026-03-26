import type { ToolDefinition } from '../../types'
import { workflowService } from '../../workflows/service'

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
      description: 'Select and initialize a workflow for the Hyper Designer project. This MUST be called before any workflow operations. Required stages cannot be deselected.',
      params: {
        type_id: {
          type: 'string',
          description: "The workflow ID to select (e.g., 'classic', 'lite-designer')",
        },
        stages: {
          type: 'array',
          optional: true,
          description: 'Stage selection array. If omitted, all stages are selected.',
          items: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Stage key (e.g., "IRAnalysis")',
              },
              selected: {
                type: 'boolean',
                description: 'Whether to include this stage',
              },
            },
          },
        },
      },
      execute: async params => {
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
- PREFERRED: Pass stage_name explicitly for clarity and reliability
- If stage_name is omitted: automatically selects the next stage (first stage if current is null, next stage otherwise)
- IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.`,
      params: {
        stage_name: {
          type: 'string',
          optional: true,
          description: 'The name of the workflow stage to set as handover. PREFERRED to pass explicitly. If omitted, automatically selects the next stage.',
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
      description: 'Record or overwrite a milestone for the current workflow stage. Multiple calls with the same type will overwrite the previous milestone.',
      params: {
        type: {
          type: 'string',
          description: 'Milestone type identifier',
        },
        mark: {
          type: 'boolean',
          description: 'Mark the milestone as lit (true) or unlit (false)',
        },
        detail: {
          type: 'object',
          optional: true,
          description: 'Additional details as key-value pairs. Structure is flexible and can contain any properties.',
        },
      },
      execute: async params => {
        const typeValue = params.type
        const markValue = params.mark

        if (typeof typeValue !== 'string') {
          return JSON.stringify({
            success: false,
            error: `Invalid type parameter. Expected string, got ${typeValue === undefined ? 'undefined' : typeof typeValue}`,
            requiredFields: {
              type: 'string (the name of milestone)',
              mark: 'boolean (true to light up, false to turn off)',
              detail: 'object (optional, any key-value pairs)',
            },
            example: { type: 'example-milestone', mark: true, detail: { message: 'Example milestone passed' } },
          }, null, 2)
        }

        if (typeof markValue !== 'boolean') {
          return JSON.stringify({
            success: false,
            error: `Invalid mark parameter. Expected boolean, got ${markValue === undefined ? 'undefined' : typeof markValue}`,
            requiredFields: {
              type: 'string (the name of milestone)',
              mark: 'boolean (true to light up, false to turn off)',
              detail: 'object (optional, any key-value pairs)',
            },
            example: { type: 'example-milestone', mark: true, detail: { message: 'Example milestone passed' } },
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
            mark: markValue,
            detail: detailValue,
          },
        })

        return JSON.stringify({
          success: true,
          stage,
          milestone: {
            type: typeValue,
            timestamp,
            mark: markValue,
            detail: detailValue,
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
