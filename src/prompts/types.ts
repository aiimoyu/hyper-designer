export type ToolRegistry = Record<string, string>;

export interface PromptResolverConfig {
  toolRegistry: ToolRegistry;
}