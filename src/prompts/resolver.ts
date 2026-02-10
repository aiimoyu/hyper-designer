import type { ToolRegistry } from "./types";

/**
 * Resolves tool placeholders in a prompt string using the provided registry.
 * @param prompt - The prompt string containing {{TOOL:name}} placeholders
 * @param registry - The tool registry mapping placeholder names to replacement text
 * @returns The fully resolved prompt string
 * @throws Error if an unknown tool placeholder is encountered
 */
export function resolvePrompt(prompt: string, registry: ToolRegistry): string {
  const regex = /\{\{TOOL:([a-z_]+)\}\}/g;
  let result = prompt;
  let match: RegExpExecArray | null;

  while (true) {
    match = regex.exec(result);
    if (match === null) break;

    const toolName = match[1];
    const replacement = registry[toolName];

    if (!replacement) {
      throw new Error(`Unknown tool placeholder: {{TOOL:${toolName}}}. Available tools: ${Object.keys(registry).join(', ')}`);
    }

    result = result.replace(match[0], replacement);
  }

  return result;
}