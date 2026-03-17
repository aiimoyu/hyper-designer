import type { WorkflowDefinition } from '../workflows/core/types'
import type { WorkflowState } from '../workflows/core/state/types'
import {
  loadPromptBindings,
  resolvePromptBindingsForMode,
} from '../workflows/core/runtime'
import { replacePlaceholders, type PlaceholderResolver } from './placeholder'
import { OPENCODE_TOOL_MAPPING, replaceToolPlaceholders } from './toolTransform'
import {
  createPromptInjectionRegistry,
} from './injections/factory'
import { HyperDesignerLogger } from '../utils/logger'

const WORKFLOW_PROMPT_TOKEN_PATTERN = /\{HYPER_DESIGNER_WORKFLOW_(?!FALLBACK_PROMPT\})[A-Z0-9_]+_PROMPT\}/g

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

  const chunks = registry.run(providerIds, {
    workflow,
    state,
    currentStage,
    stageDefinition,
    systemMessages,
  })

  if (chunks.length === 0) {
    HyperDesignerLogger.debug('SystemTransform', 'stage injection produced no content', {
      currentStage,
      providerIds,
    })
    return
  }

  const injectedContent = chunks.join('\n\n')
  systemMessages.push(injectedContent)
  HyperDesignerLogger.debug('SystemTransform', 'stage injection appended', {
    currentStage,
    providerIds,
    chunkCount: chunks.length,
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
