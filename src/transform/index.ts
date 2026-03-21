export { resolveNodeConfig, type NodeRuntimeConfig } from './agentRouting'
export { resolveAgentConfig, type AgentRuntimeConfig } from '../workflows/core/agentConfig'
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
export { createAgentTransformer } from '../platformBridge/platform/opencode/transform/agent-transform'
export { createUsingHyperDesignerTransformer } from '../platformBridge/platform/opencode/transform/using-hyperdesigner-transform'
export { createSystemTransformer } from '../platformBridge/platform/opencode/transform/system-transform'
export { createTransformHooks } from '../platformBridge/platform/opencode/transform/hooks'
export type {
  PromptTransformWorkflowContext,
  PromptInjectionRequest,
  PromptInjectionProvider,
} from './types'
