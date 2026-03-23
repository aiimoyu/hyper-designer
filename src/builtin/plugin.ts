import { BUILTIN_AGENT_PLUGINS } from './agents'
import { BUILTIN_TOOL_PLUGINS } from './tools'
import { BUILTIN_WORKFLOW_PLUGINS } from './workflows'
import type { AgentConfig, PluginContext, ToolDefinition, WorkflowDefinition } from '../types'
import { definePlugin } from '../plugin'
import { resolve } from 'path'

async function buildBuiltinAgents(): Promise<Record<string, AgentConfig>> {
  const agents: Record<string, AgentConfig> = {}
  for (const registration of BUILTIN_AGENT_PLUGINS) {
    agents[registration.name] = await registration.factory()
  }
  return agents
}

function buildBuiltinWorkflows(ctx: PluginContext | undefined): Record<string, WorkflowDefinition> {
  const workflows: Record<string, WorkflowDefinition> = {}
  const basePath = ctx?.path
  for (const registration of BUILTIN_WORKFLOW_PLUGINS) {
    const definition = registration.factory()
    if (basePath) {
      if (definition.id === 'classic') {
        definition.promptBasePath = resolve(basePath, 'workflows', 'classic')
      } else if (definition.id === 'lite-designer') {
        definition.promptBasePath = resolve(basePath, 'workflows', 'lite')
      } else if (definition.id === 'projectAnalysis') {
        definition.promptBasePath = resolve(basePath, 'workflows', 'projectAnalysis')
      }
    }
    workflows[definition.id] = definition
  }
  return workflows
}

async function buildBuiltinTools(): Promise<Record<string, ToolDefinition>> {
  const tools: Record<string, ToolDefinition> = {}
  for (const registration of BUILTIN_TOOL_PLUGINS) {
    const created = await registration.factory()
    tools[created.name] = created
  }
  return tools
}

export const BUILTIN_PLUGIN = definePlugin(async ctx => ({
  agent: async agents => ({
    ...(agents ?? {}),
    ...(await buildBuiltinAgents()),
  }),
  workflow: async workflows => ({
    ...(workflows ?? {}),
    ...buildBuiltinWorkflows(ctx),
  }),
  tool: async tools => ({
    ...(tools ?? {}),
    ...(await buildBuiltinTools()),
  }),
}))
