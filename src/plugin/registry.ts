import type {
  AgentConfig,
  AgentPluginFactory,
  AgentPluginRegistration,
  ToolDefinition,
  ToolPluginFactory,
  ToolPluginRegistration,
  WorkflowDefinition,
  WorkflowPluginFactory,
  WorkflowPluginRegistration,
} from '../types'

const agentPlugins = new Map<string, AgentPluginFactory>()
const workflowPlugins = new Map<string, WorkflowPluginFactory>()
const toolPlugins = new Map<string, ToolPluginFactory>()

let bootstrapped = false

export function isPluginBootstrapped(): boolean {
  return bootstrapped
}

export function markBootstrapped(): void {
  bootstrapped = true
}

export function resetBootstrapForTest(): void {
  bootstrapped = false
}

export function registerAgent(name: string, factory: AgentPluginFactory): void {
  agentPlugins.set(name, factory)
}

export function registerAgents(registrations: AgentPluginRegistration[]): void {
  for (const { name, factory } of registrations) {
    registerAgent(name, factory)
  }
}

export function getAgentNames(): string[] {
  return Array.from(agentPlugins.keys())
}

export async function createAgents(model?: string): Promise<Record<string, AgentConfig>> {
  const result: Record<string, AgentConfig> = {}
  for (const [name, factory] of agentPlugins) {
    result[name] = await factory(model)
  }
  return result
}

export function clearAgentsForTest(): void {
  agentPlugins.clear()
}

export function registerWorkflow(factory: WorkflowPluginFactory): void {
  const def = factory()
  if (!def?.id) return
  workflowPlugins.set(def.id, factory)
}

export function registerWorkflows(registrations: WorkflowPluginRegistration[]): void {
  for (const { factory } of registrations) {
    registerWorkflow(factory)
  }
}

export function getWorkflowNames(): string[] {
  return Array.from(workflowPlugins.keys())
}

export function getWorkflow(id: string): WorkflowDefinition | null {
  const factory = workflowPlugins.get(id)
  return factory ? factory() : null
}

export function clearWorkflowsForTest(): void {
  workflowPlugins.clear()
}

export function registerTool(name: string, factory: ToolPluginFactory): void {
  toolPlugins.set(name, factory)
}

export function registerTools(registrations: ToolPluginRegistration[]): void {
  for (const { name, factory } of registrations) {
    registerTool(name, factory)
  }
}

export function getToolNames(): string[] {
  return Array.from(toolPlugins.keys())
}

export async function createTools(): Promise<ToolDefinition[]> {
  const result: ToolDefinition[] = []
  for (const factory of toolPlugins.values()) {
    result.push(await factory())
  }
  return result
}

export function clearToolsForTest(): void {
  toolPlugins.clear()
}

export function clearAllForTest(): void {
  clearAgentsForTest()
  clearWorkflowsForTest()
  clearToolsForTest()
  resetBootstrapForTest()
}

export function registerAgentsFromRecord(agents: Record<string, AgentConfig>): void {
  for (const [name, config] of Object.entries(agents)) {
    registerAgent(name, () => config)
  }
}

export function registerWorkflowsFromRecord(workflows: Record<string, WorkflowDefinition>): void {
  for (const def of Object.values(workflows)) {
    registerWorkflow(() => def)
  }
}

export function registerToolsFromRecord(tools: Record<string, ToolDefinition>): void {
  for (const [name, tool] of Object.entries(tools)) {
    registerTool(name, () => tool)
  }
}
