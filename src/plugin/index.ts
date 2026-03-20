import type {
  AgentConfig,
  AgentPluginRegistration,
  ToolPluginRegistration,
  WorkflowDefinition,
  WorkflowPluginRegistration,
} from '../sdk/contracts'
import { existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import * as glob from 'glob'

const HYPER_DESIGNER_PLUGIN_BRAND = '___hyperDesignerPluginBrand'
const DEFAULT_PLUGIN_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))

export interface HyperDesignerPluginContext {
  path?: string
}

export interface HyperDesignerPluginHooks {
  agent?: (
    agents: Record<string, AgentConfig>,
  ) => Record<string, AgentConfig> | Promise<Record<string, AgentConfig>>
  workflow?: (
    workflows: Record<string, WorkflowDefinition>,
  ) => Record<string, WorkflowDefinition> | Promise<Record<string, WorkflowDefinition>>
  tool?: (
    tools: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>
}

export type HyperDesignerPluginFactory = (
  ctx?: HyperDesignerPluginContext,
) => HyperDesignerPluginHooks | Promise<HyperDesignerPluginHooks>

interface BrandedHyperDesignerPluginFactory extends HyperDesignerPluginFactory {
  [HYPER_DESIGNER_PLUGIN_BRAND]: true
}

export interface HyperDesignerPluginRegistrations {
  agent: Record<string, AgentConfig>
  workflow: Record<string, WorkflowDefinition>
  tool: Record<string, unknown>
}

export interface BuildPluginRegistrationsOptions {
  plugins: HyperDesignerPluginFactory[]
  ctx?: HyperDesignerPluginContext
}

export interface PluginDirectoryLoadOptions {
  directory: string
  pattern?: string
}

export interface DefaultPluginLoadOptions {
  rootDirectory?: string
  builtinDirectory?: string
  userDirectory?: string
}

function isPluginFactory(
  input: HyperDesignerPluginFactory | HyperDesignerPluginHooks,
): input is HyperDesignerPluginFactory {
  return typeof input === 'function'
}

export function defineHyperDesignerPlugin(
  input: HyperDesignerPluginFactory | HyperDesignerPluginHooks,
): HyperDesignerPluginFactory {
  const factory: HyperDesignerPluginFactory = isPluginFactory(input)
    ? input
    : async () => input
  const brandedFactory = factory as BrandedHyperDesignerPluginFactory
  brandedFactory[HYPER_DESIGNER_PLUGIN_BRAND] = true
  return brandedFactory
}

export function isHyperDesignerPluginFactory(
  value: unknown,
): value is HyperDesignerPluginFactory {
  if (typeof value !== 'function') {
    return false
  }
  const brandedValue = value as Partial<BrandedHyperDesignerPluginFactory>
  return brandedValue[HYPER_DESIGNER_PLUGIN_BRAND] === true
}

export async function loadPluginsFromDirectory(
  options: PluginDirectoryLoadOptions,
): Promise<HyperDesignerPluginFactory[]> {
  const absoluteDirectory = resolve(options.directory)
  if (!existsSync(absoluteDirectory)) {
    return []
  }

  const pattern = options.pattern ?? '**/*.ts'
  const files = glob
    .sync(pattern, {
      cwd: absoluteDirectory,
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    })
    .filter(filePath => !filePath.includes('/hooks/'))
    .filter(filePath => !filePath.includes('\\hooks\\'))
    .filter(filePath => !filePath.endsWith('.d.ts'))
    .sort((left, right) => left.localeCompare(right))

  const plugins: HyperDesignerPluginFactory[] = []
  for (const filePath of files) {
    const moduleExports: unknown = await import(pathToFileURL(filePath).href)
    const record = moduleExports as Record<string, unknown>
    for (const exportedValue of Object.values(record)) {
      if (isHyperDesignerPluginFactory(exportedValue)) {
        const pluginDirectory = dirname(filePath)
        const pluginFactory: HyperDesignerPluginFactory = async ctx => exportedValue({
          ...(ctx ?? {}),
          path: pluginDirectory,
        })
        const brandedFactory = pluginFactory as BrandedHyperDesignerPluginFactory
        brandedFactory[HYPER_DESIGNER_PLUGIN_BRAND] = true
        plugins.push(brandedFactory)
      }
    }
  }

  return plugins
}

export async function loadDefaultPluginPipeline(
  options: DefaultPluginLoadOptions = {},
): Promise<HyperDesignerPluginFactory[]> {
  const rootDirectory = resolve(options.rootDirectory ?? DEFAULT_PLUGIN_ROOT)
  const builtinDirectory = resolve(
    rootDirectory,
    options.builtinDirectory ?? 'src/builtin',
  )
  const userDirectory = resolve(
    rootDirectory,
    options.userDirectory ?? 'plugins',
  )

  const builtinPlugins = await loadPluginsFromDirectory({
    directory: builtinDirectory,
    pattern: '**/plugin.ts',
  })
  const userPlugins = await loadPluginsFromDirectory({
    directory: userDirectory,
  })

  return [...builtinPlugins, ...userPlugins]
}

export async function buildPluginRegistrations(
  pluginsOrOptions: HyperDesignerPluginFactory[] | BuildPluginRegistrationsOptions,
): Promise<HyperDesignerPluginRegistrations> {
  const options = Array.isArray(pluginsOrOptions)
    ? { plugins: pluginsOrOptions }
    : pluginsOrOptions

  let agents: Record<string, AgentConfig> = {}
  let workflows: Record<string, WorkflowDefinition> = {}
  let tools: Record<string, unknown> = {}

  for (const plugin of options.plugins) {
    const hooks = await plugin(options.ctx)
    if (hooks.agent) {
      agents = await hooks.agent(agents)
    }
    if (hooks.workflow) {
      workflows = await hooks.workflow(workflows)
    }
    if (hooks.tool) {
      tools = await hooks.tool(tools)
    }
  }

  return {
    agent: agents,
    workflow: workflows,
    tool: tools,
  }
}

export function toAgentPluginRegistrations(
  agents: Record<string, AgentConfig>,
): AgentPluginRegistration[] {
  return Object.entries(agents).map(([name, config]) => ({
    name,
    factory: () => config,
  }))
}

export function toWorkflowPluginRegistrations(
  workflows: Record<string, WorkflowDefinition>,
): WorkflowPluginRegistration[] {
  return Object.values(workflows).map(definition => ({
    factory: () => definition,
  }))
}

export function toToolPluginRegistrations(
  tools: Record<string, unknown>,
): ToolPluginRegistration[] {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    factory: () => ({
      [name]: tool,
    }),
  }))
}
