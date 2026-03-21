import { tool } from '@opencode-ai/plugin'

import { workflowService } from '../core/service/WorkflowService'

export function createHdTools() {
  return {
    hd_workflow_state: tool({
      description: 'Get the current workflow state of the Hyper Designer project. Returns uninitialized status if no workflow has been selected. Call this tool with parameter: {"_": ""}',
      args: {
        _: tool.schema.string().optional().describe('Optional placeholder parameter - pass empty string or omit'),
      },
      async execute(_params: { _?: string }, _context) {
        const result = workflowService.hdGetWorkflowState()
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_workflow_list: tool({
      description: 'List all available workflows that can be selected for the Hyper Designer project. Use this to see what workflows are available before calling hd_workflow_select. Call this tool with parameter: {"_": ""}',
      args: { _: tool.schema.string().optional().describe('Optional placeholder parameter - pass empty string or omit') },
      async execute(_params: { _?: string }, _context) {
        const workflows = workflowService.listWorkflows()
        return JSON.stringify({ workflows }, null, 2)
      },
    }),
    hd_workflow_detail: tool({
      description: 'Get detailed information about a specific workflow, including its stages, their descriptions, and which stages are required. Use this to understand a workflow before selecting it.',
      args: {
        type_id: tool.schema.string().describe('The ID of the workflow to get details for (e.g., \'classic\')'),
      },
      async execute(params: { type_id: string }) {
        const detail = workflowService.getWorkflowDetail(params.type_id)
        if (!detail) {
          return JSON.stringify({ error: `Workflow '${params.type_id}' not found`, availableWorkflows: workflowService.listWorkflows().map(w => w.id) }, null, 2)
        }
        return JSON.stringify(detail, null, 2)
      },
    }),
    hd_workflow_select: tool({
      description: 'Select and initialize a workflow for the Hyper Designer project. This MUST be called before any workflow operations (hd_handover, etc.). The stages parameter allows selecting which stages to include - use [{ key, selected }] format. Required stages cannot be deselected.',
      args: {
        type_id: tool.schema.string().describe('The ID of the workflow to select (e.g., \'classic\')'),
        stages: tool.schema.array(tool.schema.object({ key: tool.schema.string(), selected: tool.schema.boolean() })).optional().describe('Stage selection array. If omitted, all stages are selected. Example: [{ key: \'IRAnalysis\', selected: true }, { key: \'moduleFunctionalDesign\', selected: false }]'),
      },
      async execute(params: { type_id: string; stages?: Array<{ key: string; selected: boolean }> }) {
        const detail = workflowService.getWorkflowDetail(params.type_id)
        if (!detail) {
          return JSON.stringify({ success: false, error: `Workflow '${params.type_id}' not found` }, null, 2)
        }

        const stages = params.stages ?? detail.stages.map(stage => ({ key: stage.key, selected: true }))
        const result = workflowService.selectWorkflow({ typeId: params.type_id, stages })
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_handover: tool({
      description: `Set the handover workflow stage of the Hyper Designer project.
- If stage_name is omitted: automatically selects the next stage (first stage if current is null, next stage otherwise)
- IMPORTANT: After calling this tool, you MUST STOP all work and return immediately. Do NOT continue with any tasks, do NOT call other tools. The actual handover will be processed by system hooks when the session enters idle state.`,
      args: {
        stage_name: tool.schema.string().optional().describe('The name of the workflow stage to set as handover. If omitted, automatically selects the next stage.'),
      },
      async execute(params: { stage_name?: string }) {
        const result = await workflowService.hdScheduleHandover(params.stage_name)
        return JSON.stringify(result, null, 2)
      },
    }),
    hd_record_milestone: tool({
      description: 'Record or overwrite a milestone for the current workflow stage. For gate milestones, detail may include score/comment and isCompleted should reflect pass/fail.',
      args: {
        milestone: tool.schema.object({
          type: tool.schema.string().describe('The milestone type/key to record'),
          isCompleted: tool.schema.boolean().describe('Whether this milestone item is completed'),
          detail: tool.schema.object({}).describe('Milestone detail payload, e.g. gate: { score, comment }'),
        }).describe('The milestone to record'),
      },
      async execute(params: { milestone: { type: string; isCompleted: boolean; detail: unknown } }) {
        const { milestone } = params
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
          milestone,
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
    }),
    hd_force_next_step: tool({
      description: 'Force advance to the next step in the workflow, bypassing gate checks. Use this when gate approval cannot be achieved after multiple attempts. Call this tool with parameter: {"_": ""}',
      args: { _: tool.schema.string().optional().describe('无实际意义的占位参数，调用时传入随机字符串') },
      async execute(_: { _: string }) {
        const result = workflowService.hdForceNextStep()
        return JSON.stringify(result, null, 2)
      },
    }),
  }
}
