# AGENTS.md - Hyper-Designer Plugin

## Overview

This is a TypeScript plugin for OpenCode that provides agent orchestration capabilities. The plugin implements dynamic agent creation, prompt assembly, and command registration for the OpenCode ecosystem.

## Build/Lint/Test Commands

### Development Setup

Since this is an OpenCode plugin (not a standalone application), there are no traditional build commands. The plugin is loaded dynamically by OpenCode.

### Testing

No formal test suite exists yet. For manual testing:
- Load the plugin via symlink: `ln -s /path/to/hyper-designer/opencode/.plugins/hyper-designer.ts ~/.config/encode/.plugins/`
- Test agent creation and command execution through OpenCode interface

### Linting & Type Checking

Use TypeScript compiler for type checking:
```bash
tsc --noEmit --skipLibCheck
```

## Code Style Guidelines

### TypeScript Conventions

#### Imports
- Use `import type` for type-only imports to avoid runtime overhead
- Group imports: types first, then runtime imports
- One import per line for clarity

```typescript
import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { createAgents } from "./agents";
import { createCommands } from "./commands";
```

#### Types & Interfaces
- Use `interface` for object shapes that may be extended
- Use `type` for unions, primitives, and complex compositions
- Optional properties use `?:` consistently
- Generic constraints should be minimal and permissive

```typescript
export interface AgentConfig {
  name?: string
  description?: string
  model?: string
  variant?: string
  mode?: AgentMode
  temperature?: number
}

export type AgentMode = "primary" | "subagent" | "all"
```

#### Naming Conventions
- **Types/Interfaces**: PascalCase (`AgentConfig`, `AgentFactory`)
- **Variables/Functions**: camelCase (`createAgent`, `buildPrompt`)
- **Constants**: UPPER_SNAKE_CASE for exported constants
- **Enums**: PascalCase for type, UPPER_SNAKE_CASE for values

```typescript
const MODE: AgentMode = "subagent"
export const SCOUT_SYSTEM_PROMPT = buildScoutPrompt(["full"])
```

#### Type Assertions
- Avoid `as any` - use proper typing instead
- Use `as const` for literal type assertions
- Prefer type guards over type assertions when possible

```typescript
const MODE = "subagent" as const  // Good
// Avoid: const MODE = "subagent" as any
```

### Documentation

#### JSDoc Comments
- Use JSDoc for all exported functions and complex logic
- Include `@param` and `@returns` for function documentation
- Keep descriptions concise but informative

```typescript
/**
 * Factory function to create Scout agent configuration
 *
 * @param model - The model to use for this agent
 * @param phases - Optional array of phases to include (default: full)
 */
export function createScoutAgent(
  model: string,
  phases: ScoutPhase[] = ["full"]
): AgentConfig
```

#### Code Comments
- Use `//` for implementation notes
- Use `/* */` for multi-line explanations
- Comment complex business logic, not obvious operations

### Error Handling

#### Error Patterns
- Prefer early returns over nested conditionals
- Use descriptive error messages
- Avoid try/catch unless external operations are involved

```typescript
export function validateConfig(config: any): AgentConfig {
  if (!config.model) {
    throw new Error("Agent model is required")
  }
  // ... validation logic
  return config as AgentConfig
}
```

#### Null Safety
- Use optional chaining (`?.`) for safe property access
- Use nullish coalescing (`??`) for default values
- Explicitly handle undefined cases

```typescript
const model = config.model ?? "anthropic/claude-sonnet-4-5"
const temperature = config.temperature ?? 0.7
```

### File Organization

#### Module Structure
- One primary export per file (factory function or main class)
- Related types in `types.ts`
- Utility functions in `utils.ts`
- Keep files focused and single-responsibility

#### Export Patterns
- Use named exports for multiple related items
- Default export for the main factory/config function
- Re-export types from implementation files

```typescript
// types.ts
export interface AgentConfig { ... }
export type AgentMode = ...

// index.ts
export { createAgent } from "./agent"
export type { AgentConfig, AgentMode } from "./types"
```

### Agent Design Patterns

#### Factory Pattern
- Use factory functions for agent creation
- Factories accept model and options parameters
- Return complete `AgentConfig` objects

```typescript
export function createScoutAgent(
  model: string,
  phases: ScoutPhase[] = ["full"]
): AgentConfig {
  return {
    description: "...",
    mode: "subagent",
    model,
    prompt: buildScoutPrompt(phases),
    // ... other config
  }
}
```

#### Metadata Integration
- Include prompt metadata for delegation decisions
- Define clear trigger conditions and use cases
- Specify cost and category for resource management

```typescript
export const SCOUT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  useWhen: ["New project requirements", "System design needed"],
  avoidWhen: ["Simple bug fixes", "Clear specifications exist"],
}
```

#### Permission Model
- Explicitly define tool permissions
- Use granular allow/deny for security
- Document permission rationale

```typescript
export const SCOUT_PERMISSION = {
  edit: "allow" as const,      // Can write design docs
  bash: "deny" as const,       // No system access
  webfetch: "allow" as const,  // Can research online
}
```

### Code Quality Standards

#### Complexity Limits
- Functions should be < 50 lines
- Files should be < 200 lines
- Break complex logic into smaller functions

#### Performance Considerations
- Minimize runtime type checks
- Use lazy initialization for expensive operations
- Cache repeated computations where beneficial

#### Testing Readiness
- Design code to be easily testable
- Avoid tight coupling between modules
- Use dependency injection patterns

### Integration Guidelines

#### OpenCode Plugin Contract
- Implement the `Plugin` interface correctly
- Register agents, commands, and step runners
- Handle plugin lifecycle properly

```typescript
const MyOpencodePlugin: Plugin = async (ctx: PluginInput) => {
  // Initialize components
  const agents = createAgents({ ctx })
  ctx.registerAgents(agents)

  // Setup commands and runners
  const commands = createCommands({ ctx })
  ctx.registerCommands(commands)
}
```

#### Environment Variables
- Use `process.env` for configuration
- Provide sensible defaults
- Document required environment variables

```typescript
const defaultModel = process.env.DEFAULT_AGENT_MODEL ?? "anthropic/claude-sonnet-4-5"
```

This style guide ensures consistent, maintainable code across the hyper-designer plugin. Follow these patterns when contributing to maintain code quality and readability.