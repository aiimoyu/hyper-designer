import {
  loadPromptBindings,
  resolvePromptBindingsForMode,
} from '../workflows/runtime'
import { replacePlaceholders, type PlaceholderResolver } from './placeholder'
import { replaceToolPlaceholders, type ToolNameMapping } from './toolTransform'
import {
  createPromptInjectionRegistry,
} from './injections/factory'
import type { InjectionResult } from './injectionRegistry'
import { HyperDesignerLogger } from '../utils/logger'
import { loadHDConfig } from '../config/loader'
import type { WorkflowDefinition } from '../workflows/types'
import type { WorkflowState } from '../workflows/state/types'
import type { HDConfig } from '../config/loader'

const WORKFLOW_PROMPT_TOKEN_PATTERN = /\{HYPER_DESIGNER_WORKFLOW_(?!FALLBACK_PROMPT\})[A-Z0-9_]+_PROMPT\}/g
const SKILL_BLOCK_PATTERN = /<skill>[\s\S]*?<\/skill>/g
const SKILL_NAME_PATTERN = /<name>([\s\S]*?)<\/name>/
const USING_HYPER_DESIGNER_PATTERN = /<using-hyper-designer>/

export const HYPER_DESIGNER_SYSTEM_PROMPT = `<using-hyper-designer>
You are currently running within the Hyper Designer plugin environment. Please prioritize calling the specialized tools provided by Hyper Designer to complete tasks. Your behavioral guidelines should primarily adhere to the architectural specifications defined in the Agent system prompt.
</using-hyper-designer>`

/**
 * 内建需要屏蔽的 skill 列表（精确且区分大小写）
 * 业务侧可在此维护默认屏蔽项
 */
export const DEFAULT_BLOCKED_SKILLS: string[] = ["using-superpowers"]

export function resolveBlockedSkills(config: HDConfig | null): string[] {
  const configured = config?.transform?.blockedSkills ?? []
  const merged = [...DEFAULT_BLOCKED_SKILLS, ...configured]
  return Array.from(new Set(merged))
}

export function getBlockedSkillsFromConfig(): string[] {
  const config = loadHDConfig()
  return resolveBlockedSkills(config)
}

export function hasUsingHyperDesignerTag(systemMessages: string[]): boolean {
  return systemMessages.some(msg => USING_HYPER_DESIGNER_PATTERN.test(msg))
}

export function appendUsingHyperDesignerSystemPrompt(existingSystem: string | undefined): string {
  if (existingSystem) {
    return `${existingSystem}\n\n${HYPER_DESIGNER_SYSTEM_PROMPT}`
  }
  return HYPER_DESIGNER_SYSTEM_PROMPT
}

function stripBlockedSkills(text: string, blockedSkills: Set<string>): string {
  if (blockedSkills.size === 0) {
    return text
  }

  return text.replace(SKILL_BLOCK_PATTERN, match => {
    const nameMatch = match.match(SKILL_NAME_PATTERN)
    const skillName = nameMatch?.[1]?.trim() ?? ''
    if (blockedSkills.has(skillName)) {
      return ''
    }
    return match
  })
}

export function filterBlockedSkillsInSystemMessages(systemMessages: string[], blockedSkills: Set<string>): void {
  if (blockedSkills.size === 0) {
    return
  }

  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = stripBlockedSkills(systemMessages[index], blockedSkills)
  }
}

export function mergeSystemMessages(systemMessages: string[]): void {
  if (systemMessages.length <= 1) {
    return
  }

  systemMessages[0] = systemMessages.join('\n\n')
  systemMessages.splice(1)
}

function clearUnresolvedWorkflowPromptTokens(systemMessages: string[]): void {
  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = systemMessages[index].replace(WORKFLOW_PROMPT_TOKEN_PATTERN, '')
  }
}

function buildPlaceholderResolvers(
  workflow: WorkflowDefinition | null,
  currentStage: string | null,
): { resolvers: PlaceholderResolver[]; isFallbackMode: boolean } {
  const hasActiveStage = workflow !== null
    && currentStage !== null
    && workflow.stages[currentStage] !== undefined
  const stageForBindings = hasActiveStage ? currentStage : null
  const promptBindings = loadPromptBindings({
    definition: workflow ?? undefined,
    stage: stageForBindings,
  })

  const resolvedBindings = resolvePromptBindingsForMode({
    bindings: promptBindings,
    isFallbackMode: !hasActiveStage,
  })

  return {
    isFallbackMode: !hasActiveStage,
    resolvers: Object.keys(resolvedBindings).map(token => ({
    token,
    resolve: () => resolvedBindings[token] ?? '',
    })),
  }
}

function getCurrentStageContext(state: WorkflowState | null): string | null {
  return state?.current?.name ?? null
}

function formatInjectionResults(results: InjectionResult[]): string {
  const innerTags = results.map(result => {
    return `<${result.providerId}>\n${result.content}\n</${result.providerId}>`
  }).join('\n')

  return [
    '下面是 hyper-designer 插件提供的一些额外信息：',
    '<hyper-designer-info>',
    innerTags,
    '</hyper-designer-info>',
  ].join('\n')
}

async function appendStageInjections(
  systemMessages: string[],
  workflow: WorkflowDefinition | null,
  state: WorkflowState | null,
  currentStage: string | null,
): Promise<void> {
  if (!workflow || currentStage === null) {
    return
  }

  const stageDefinition = workflow.stages[currentStage] ?? null
  if (!stageDefinition) {
    return
  }

  const injectionConfigs = stageDefinition.inject
  if (!injectionConfigs || injectionConfigs.length === 0) {
    return
  }

  HyperDesignerLogger.debug('SystemTransform', 'resolving stage injections', {
    currentStage,
    providerIds: injectionConfigs.map(c => c.provider),
    systemMessageCount: systemMessages.length,
  })

  const registry = createPromptInjectionRegistry()

  const results = await registry.run(injectionConfigs, {
    workflow,
    state,
    currentStage,
    stageDefinition,
    systemMessages,
  })

  if (results.length === 0) {
    HyperDesignerLogger.debug('SystemTransform', 'stage injection produced no content', {
      currentStage,
      providerIds: injectionConfigs.map(c => c.provider),
    })
    return
  }

  const injectedContent = formatInjectionResults(results)
  if (systemMessages.length > 0) {
    systemMessages[0] = `${systemMessages[0]}\n\n${injectedContent}`
  } else {
    systemMessages.push(injectedContent)
  }
  HyperDesignerLogger.debug('SystemTransform', 'stage injection appended', {
    currentStage,
    providerIds: injectionConfigs.map(c => c.provider),
    resultCount: results.length,
    injectedLength: injectedContent.length,
  })
}

export async function transformSystemMessages(
  systemMessages: string[],
  workflow: WorkflowDefinition | null,
  state: WorkflowState | null,
  toolMapping?: ToolNameMapping,
): Promise<void> {
  const currentStage = getCurrentStageContext(state)
  const beforeLengths = systemMessages.map(item => item.length)
  const { resolvers: placeholderResolvers, isFallbackMode } = buildPlaceholderResolvers(workflow, currentStage)

  HyperDesignerLogger.debug('SystemTransform', 'placeholder resolvers prepared', {
    currentStage,
    resolverCount: placeholderResolvers.length,
  })

  replacePlaceholders(systemMessages, placeholderResolvers)

  if (isFallbackMode) {
    clearUnresolvedWorkflowPromptTokens(systemMessages)
  }

  if (toolMapping) {
    for (let index = 0; index < systemMessages.length; index += 1) {
      systemMessages[index] = replaceToolPlaceholders(systemMessages[index], toolMapping)
    }
  }

  await appendStageInjections(systemMessages, workflow, state, currentStage)

  HyperDesignerLogger.debug('SystemTransform', 'system transform completed', {
    currentStage,
    messageCountBefore: beforeLengths.length,
    messageCountAfter: systemMessages.length,
    messageLengthsBefore: beforeLengths,
    messageLengthsAfter: systemMessages.map(item => item.length),
  })
}

export function createSystemTransformer(options: {
  getWorkflow: () => WorkflowDefinition | null
  getState: () => WorkflowState | null
  toolMapping?: ToolNameMapping
  shouldTransform?: (systemMessages: string[]) => boolean
  getBlockedSkills?: () => string[]
}) {
  const blockedSkills = new Set((options.getBlockedSkills ?? getBlockedSkillsFromConfig)())

  return async (_input: unknown, output: { system: string[] }) => {
    if (options.shouldTransform && !options.shouldTransform(output.system)) {
      HyperDesignerLogger.debug('SystemTransform', 'skipping transform by precondition')
      return
    }

    const beforeLength = output.system.length
    const workflow = options.getWorkflow()
    const workflowState = options.getState()
    await transformSystemMessages(output.system, workflow, workflowState, options.toolMapping)
    filterBlockedSkillsInSystemMessages(output.system, blockedSkills)
    if (output.system.length > beforeLength) {
      mergeSystemMessages(output.system)
    }
  }
}
