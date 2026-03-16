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

  const registry = createPromptInjectionRegistry()

  const chunks = registry.run(providerIds, {
    workflow,
    state,
    currentStage,
    stageDefinition,
    systemMessages,
  })

  if (chunks.length === 0) {
    return
  }

  systemMessages.push(chunks.join('\n\n'))
}

export function transformSystemMessages(
  systemMessages: string[],
  workflow: WorkflowDefinition | null,
  state: WorkflowState | null,
): void {
  const currentStage = getCurrentStageContext(state)
  const placeholderResolvers = buildPlaceholderResolvers(workflow, currentStage)

  replacePlaceholders(systemMessages, placeholderResolvers)

  if (currentStage === null) {
    clearUnresolvedWorkflowPromptTokens(systemMessages)
  }

  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = replaceToolPlaceholders(systemMessages[index], OPENCODE_TOOL_MAPPING)
  }

  appendStageInjections(systemMessages, workflow, state, currentStage)

}
