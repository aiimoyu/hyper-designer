import {
  loadPromptBindings,
  resolvePromptBindingsForMode,
} from '../workflows/core/runtime'
import { replacePlaceholders, type PlaceholderResolver } from './placeholder'
import { OPENCODE_TOOL_MAPPING, replaceToolPlaceholders } from './toolTransform'
import {
  createPromptInjectionRegistry,
} from './injections/factory'
import type { InjectionResult } from './injectionRegistry'
import { HyperDesignerLogger } from '../utils/logger'
import { loadHDConfig } from '../config/loader'
import type { WorkflowDefinition } from '../workflows/core/types'
import type { WorkflowState } from '../workflows/core/state/types'
import type { HDConfig } from '../config/loader'
import type { HDConfig } from '../config/loader'

const WORKFLOW_PROMPT_TOKEN_PATTERN = /\{HYPER_DESIGNER_WORKFLOW_(?!FALLBACK_PROMPT\})[A-Z0-9_]+_PROMPT\}/g

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

function clearUnresolvedWorkflowPromptTokens(systemMessages: string[]): void {
  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = systemMessages[index].replace(WORKFLOW_PROMPT_TOKEN_PATTERN, '')
  }
}

function buildPlaceholderResolvers(
  workflow: WorkflowDefinition | null,
  currentStage: string | null,
): PlaceholderResolver[] {
  const promptBindings = loadPromptBindings({
    definition: workflow ?? undefined,
    stage: currentStage,
  })

  const resolvedBindings = resolvePromptBindingsForMode({
    bindings: promptBindings,
    isFallbackMode: currentStage === null,
  })

  return Object.keys(resolvedBindings).map(token => ({
    token,
    resolve: () => resolvedBindings[token] ?? '',
  }))
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

function appendStageInjections(
  systemMessages: string[],
  workflow: WorkflowDefinition | null,
  state: WorkflowState | null,
  currentStage: string | null,
): void {
  if (!workflow || currentStage === null) {
    return
  }

  const stageDefinition = workflow.stages[currentStage] ?? null
  if (!stageDefinition) {
    return
  }

  const providerIds = stageDefinition.inject
  if (!providerIds || providerIds.length === 0) {
    return
  }

  HyperDesignerLogger.debug('SystemTransform', 'resolving stage injections', {
    currentStage,
    providerIds,
    systemMessageCount: systemMessages.length,
  })

  const registry = createPromptInjectionRegistry()

  const results = registry.run(providerIds, {
    workflow,
    state,
    currentStage,
    stageDefinition,
    systemMessages,
  })

  if (results.length === 0) {
    HyperDesignerLogger.debug('SystemTransform', 'stage injection produced no content', {
      currentStage,
      providerIds,
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
    providerIds,
    resultCount: results.length,
    injectedLength: injectedContent.length,
  })
}

export function transformSystemMessages(
  systemMessages: string[],
  workflow: WorkflowDefinition | null,
  state: WorkflowState | null,
): void {
  const currentStage = getCurrentStageContext(state)
  const beforeLengths = systemMessages.map(item => item.length)
  const placeholderResolvers = buildPlaceholderResolvers(workflow, currentStage)

  HyperDesignerLogger.debug('SystemTransform', 'placeholder resolvers prepared', {
    currentStage,
    resolverCount: placeholderResolvers.length,
  })

  replacePlaceholders(systemMessages, placeholderResolvers)

  if (currentStage === null) {
    clearUnresolvedWorkflowPromptTokens(systemMessages)
  }

  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = replaceToolPlaceholders(systemMessages[index], OPENCODE_TOOL_MAPPING)
  }

  appendStageInjections(systemMessages, workflow, state, currentStage)

  HyperDesignerLogger.debug('SystemTransform', 'system transform completed', {
    currentStage,
    messageCountBefore: beforeLengths.length,
    messageCountAfter: systemMessages.length,
    messageLengthsBefore: beforeLengths,
    messageLengthsAfter: systemMessages.map(item => item.length),
  })

}
