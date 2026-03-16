export { resolveAgentForMessage } from './agentRouting'
export { transformSystemMessages } from './systemTransformer'
export { replacePlaceholders, type PlaceholderResolver } from './placeholder'
export {
  HD_TOOL_PLACEHOLDERS,
  OPENCODE_TOOL_MAPPING,
  replaceToolPlaceholders,
  createToolTransformer,
  type ToolNameMapping,
  type HdToolPlaceholder,
} from './toolTransform'
export { PromptInjectionRegistry } from './injectionRegistry'
export { stageConfigInjectionProvider } from './injections/stageConfigInjection'
export { stageMilestonesInjectionProvider } from './injections/stageMilestonesInjection'
export {
  createPromptInjectionRegistry,
  DEFAULT_PROMPT_INJECTION_PROVIDER_IDS,
} from './injections/factory'
export { createAgentTransformer } from './opencode/agent-transform'
export { createSystemTransformer } from './opencode/system-transform'
export { createTransformHooks } from './opencode/hooks'
export type {
  PromptTransformWorkflowContext,
  PromptInjectionRequest,
  PromptInjectionProvider,
} from './types'
