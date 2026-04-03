import type {
  AgentConfig,
  CommandDefinition,
  PluginContext,
  PluginFactory,
  PluginRegistrations,
  ToolDefinition,
  WorkflowDefinition,
} from '../types'
import { existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { pathToFileURL } from 'url'
import * as glob from 'glob'

const BRAND = Symbol('plugin')

interface Branded extends PluginFactory {
  [BRAND]: true
}

export interface LoadOptions {
  directory: string
  pattern?: string
}

export interface PipelineOptions {
  rootDirectory?: string
  builtinDirectory?: string
  userDirectory?: string
}

function isFactory(input: PluginFactory | Record<string, unknown>): input is PluginFactory {
  return typeof input === 'function'
}

export function definePlugin(input: PluginFactory | Record<string, unknown>): PluginFactory {
  const factory: PluginFactory = isFactory(input) ? input : async () => input
  const branded = factory as Branded
  branded[BRAND] = true
  return branded
}

export function isPluginFactory(value: unknown): value is PluginFactory {
  if (typeof value !== 'function') return false
  return (value as Partial<Branded>)[BRAND] === true
}

export async function loadPlugins(opts: LoadOptions): Promise<PluginFactory[]> {
  const dir = resolve(opts.directory)
  if (!existsSync(dir)) return []

  const pattern = opts.pattern ?? '**/*.ts'
  const files = glob
    .sync(pattern, {
      cwd: dir,
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    })
    .filter(f => !f.includes('/hooks/'))
    .filter(f => !f.endsWith('.d.ts'))
    .sort()

  const plugins: PluginFactory[] = []
  for (const file of files) {
    const mod: unknown = await import(pathToFileURL(file).href)
    for (const value of Object.values(mod as Record<string, unknown>)) {
      if (isPluginFactory(value)) {
        const dir = dirname(file)
        const factory: PluginFactory = async ctx => value({ ...(ctx ?? {}), path: dir })
        const branded = factory as Branded
        branded[BRAND] = true
        plugins.push(branded)
      }
    }
  }
  return plugins
}

export async function loadDefaultPlugins(opts: PipelineOptions = {}): Promise<PluginFactory[]> {
  const root = resolve(opts.rootDirectory ?? process.cwd())
  const builtin = resolve(root, opts.builtinDirectory ?? 'src/builtin')
  const user = resolve(root, opts.userDirectory ?? 'plugins')

  const builtinPlugins = await loadPlugins({ directory: builtin, pattern: '**/plugin.ts' })
  const userPlugins = await loadPlugins({ directory: user })
  return [...builtinPlugins, ...userPlugins]
}

export async function buildRegistrations(
  input: PluginFactory[] | { plugins: PluginFactory[]; ctx?: PluginContext },
): Promise<PluginRegistrations> {
  const { plugins, ctx } = Array.isArray(input) ? { plugins: input, ctx: undefined } : input

  let agents: Record<string, AgentConfig> = {}
  let workflows: Record<string, WorkflowDefinition> = {}
  let tools: Record<string, ToolDefinition> = {}
  let commands: Record<string, CommandDefinition> = {}

  for (const plugin of plugins) {
    const hooks = await plugin(ctx)
    if (hooks.agent) agents = await hooks.agent(agents)
    if (hooks.workflow) workflows = await hooks.workflow(workflows)
    if (hooks.tool) tools = await hooks.tool(tools)
    if (hooks.command) commands = await hooks.command(commands)
  }

  return { agent: agents, workflow: workflows, tool: tools, command: commands }
}
