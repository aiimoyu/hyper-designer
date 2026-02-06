# AGENTS.md - Agentic Coding Guidelines for hyper-designer

## Overview

This document provides comprehensive guidelines for agentic coding assistants working in the hyper-designer repository. The hyper-designer project is an OpenCode plugin that implements specialized agents and workflow management for requirements engineering and system design.

## Build/Lint/Test Commands

### Build Commands

```bash
# No build step required - this is a pure TypeScript plugin
# Files are transpiled on-demand by the OpenCode framework
```

### Linting and Formatting

```bash
# No linting/formatting tools configured yet
# Recommended: Add ESLint and Prettier configuration
```

### Testing Commands

```bash
# No test framework configured yet
# Recommended setup for running tests:

# Run all tests
npm test
# or
yarn test

# Run specific test file
npm test -- src/agents/utils.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run single test (example)
npm test -- --testNamePattern="should create builtin agents"
```

### Recommended Test Setup

The project currently lacks automated testing. When adding tests:

1. **Framework**: Use Jest or Vitest (recommended: Vitest for faster TypeScript support)
2. **Configuration**: Add `vitest.config.ts` or `jest.config.js` in project root
3. **Test Structure**: Place tests in `__tests__/` directories or `*.test.ts` files alongside source
4. **Coverage**: Aim for 80%+ coverage on critical paths

## Code Style Guidelines

### TypeScript/JavaScript Patterns

#### File Structure and Organization

```typescript
// src/agents/types.ts - Interface definitions first
export interface AgentConfig {
  name?: string
  description?: string
  model?: string
  // ...
}

// src/agents/utils.ts - Implementation logic
import type { AgentConfig } from "./types"

/**
 * Factory function with JSDoc documentation
 */
export async function createBuiltinAgents(
  model: string | undefined = process.env.DEFAULT_AGENT_MODEL ?? undefined
): Promise<Record<string, AgentConfig>> {
  return {
    HCollector: createHCollectorAgent(model),
    // ...
  }
}
```

#### Naming Conventions

- **Files**: `camelCase.ts` for implementation, `PascalCase.ts` for types/interfaces
- **Variables/Functions**: `camelCase` (e.g., `createAgent`, `workflowState`)
- **Types/Interfaces**: `PascalCase` (e.g., `AgentConfig`, `WorkflowState`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `WORKFLOW_STATE_PATH`)
- **Directories**: `kebab-case` (e.g., `src/agents/`, `src/workflow/`)

#### Import/Export Patterns

```typescript
// Prefer named imports for types
import type { AgentConfig, AgentMode } from "./types"

// Prefer named imports for functions
import { createHCollectorAgent } from "./HCollector"

// Group imports: types first, then implementations
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
```

#### Documentation Standards

```typescript
/**
 * Comprehensive JSDoc with description, parameters, and return types
 * @param model - The AI model to use for agents
 * @param opts - Optional configuration parameters
 * @returns Promise resolving to agent configurations
 */
export async function createBuiltinAgents(
  model: string | undefined = process.env.DEFAULT_AGENT_MODEL ?? undefined
): Promise<Record<string, AgentConfig>> {
  // Implementation...
}
```

### Error Handling

#### Patterns to Follow

```typescript
// Use try-catch with meaningful fallbacks
function readWorkflowStateFile(): WorkflowState {
  try {
    const data = readFileSync(WORKFLOW_STATE_PATH, "utf-8")
    return JSON.parse(data) as WorkflowState
  } catch (error) {
    // Provide sensible defaults, don't crash
    return {
      workflow: { /* default workflow state */ },
      currentStep: null,
      handoverTo: null,
    }
  }
}

// Validate inputs early
export function setWorkflowStage(stage: keyof Workflow, completed: boolean): WorkflowState {
  if (!stage || typeof completed !== 'boolean') {
    throw new Error(`Invalid parameters: stage=${stage}, completed=${completed}`)
  }
  // ... implementation
}
```

#### Anti-Patterns to Avoid

```typescript
// ❌ Empty catch blocks
try {
  riskyOperation()
} catch (e) {
  // Silent failure - hard to debug
}

// ❌ Generic error throwing
throw new Error('Something went wrong') // Not helpful

// ❌ Type assertions without validation
const config = input as AgentConfig // Unsafe
```

### TypeScript Best Practices

#### Type Safety First

```typescript
// Use strict types, avoid any
interface AgentConfig {
  name?: string
  model: string  // Required field
  temperature?: number
}

// Use discriminated unions for related types
type AgentMode = "primary" | "subagent" | "all"

// Use generics when appropriate
export interface Workflow<T extends Record<string, WorkflowStage>> {
  workflow: T
  currentStep: keyof T | null
}
```

#### Interface Design

```typescript
// Keep interfaces minimal and focused
export interface AgentConfig {
  // Only include fields that are actually used
  name?: string
  description?: string
  model?: string
  // Add fields only when needed - don't over-design
}

// Use type aliases for complex types
export type AgentFactory = ((model: string, opts?: { phases?: string[] }) => AgentConfig) & {
  mode?: AgentMode
}
```

### Code Organization Principles

#### Separation of Concerns

- **Types**: Keep in dedicated `types.ts` files
- **Business Logic**: Pure functions in `utils.ts` or domain-specific files
- **Side Effects**: Isolate file I/O, network calls, and external dependencies
- **Configuration**: Centralize constants and environment variables

#### DRY (Don't Repeat Yourself)

```typescript
// Extract common patterns into utilities
const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json")

function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

// Reuse across functions
function writeWorkflowStateFile(state: WorkflowState): void {
  ensureDirectoryExists(WORKFLOW_STATE_PATH)
  writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(state, null, 2))
}
```

## Workflow and Agent Guidelines

### Agent Creation Pattern

```typescript
// src/agents/HArchitect/index.ts
import { readFileSync } from "fs"
import { join } from "path"

export function createHArchitectAgent(model?: string): AgentConfig {
  // Load prompt from markdown file
  const promptPath = join(__dirname, "identity_constraints.md")
  const prompt = readFileSync(promptPath, "utf-8")

  return {
    name: "HArchitect",
    description: "System Architect agent for requirements engineering workflow",
    model: model ?? "gpt-4",
    prompt,
    mode: "primary",
    temperature: 0.7,
    // ... other config
  }
}
```

### Workflow State Management

```typescript
// Always validate state transitions
export function setWorkflowStage(stage: keyof Workflow, completed: boolean): WorkflowState {
  const currentState = readWorkflowStateFile()

  // Validate transition logic
  if (completed && !canCompleteStage(stage, currentState)) {
    throw new Error(`Cannot complete stage ${stage} - prerequisites not met`)
  }

  const newState = {
    ...currentState,
    workflow: {
      ...currentState.workflow,
      [stage]: { isCompleted: completed }
    }
  }

  writeWorkflowStateFile(newState)
  return newState
}
```

### Skill Integration

```typescript
// src/workflow/hooks/opencode/workflow.ts
export async function createWorkflowHooks(ctx: PluginContext) {
  return {
    event: async (input) => {
      // Load skills dynamically based on workflow state
      const skillContent = await loadSkillForStage(currentStage)
      // Inject into agent prompts
    }
  }
}
```

## File and Directory Conventions

### Directory Structure

```
hyper-designer/
├── src/
│   ├── agents/           # Agent implementations
│   │   ├── HArchitect/
│   │   ├── HCritic/
│   │   └── types.ts      # Shared types
│   ├── workflow/         # Workflow management
│   │   ├── state.ts      # State persistence
│   │   └── hooks/        # Framework integrations
│   └── skills/           # Stage-specific skills
├── opencode/
│   └── .plugins/         # OpenCode integration
└── .hyper-designer/      # Runtime state and documents
```

### File Naming

- **Agent Files**: `H{Capability}.ts` (e.g., `HArchitect.ts`, `HCritic.ts`)
- **Type Files**: `types.ts` in each domain directory
- **Utility Files**: `utils.ts` for shared functions
- **Skill Files**: `{stage-name}.md` in `src/skills/`

## Development Workflow

### When Adding New Agents

1. Create agent directory: `src/agents/HNewAgent/`
2. Implement `index.ts` with factory function
3. Add `identity_constraints.md` with detailed prompt
4. Update `types.ts` to include new agent name
5. Update `utils.ts` to register the agent
6. Update plugin exports in `opencode/.plugins/hyper-designer.ts`

### When Adding New Workflow Stages

1. Update `Workflow` interface in `src/workflow/state.ts`
2. Add stage to workflow tools in plugin
3. Create skill file in `src/skills/`
4. Update hook logic for skill injection
5. Update agent prompts to handle new stage

### When Adding New Skills

1. Create skill markdown file: `src/skills/{stage-name}.md`
2. Follow established skill format with sections:
   - Description and trigger conditions
   - Detailed guidance and templates
   - Quality checklists
   - Common pitfalls and solutions
3. Update skill loading logic in workflow hooks

## Quality Assurance

### Code Review Checklist

- [ ] TypeScript types are strict and accurate
- [ ] Error handling provides meaningful fallbacks
- [ ] Functions have JSDoc documentation
- [ ] Imports are organized (types first, then implementations)
- [ ] Naming follows established conventions
- [ ] No unused imports or variables
- [ ] File I/O operations handle missing directories
- [ ] Agent prompts are comprehensive and clear

### Testing Checklist

- [ ] Unit tests for utility functions
- [ ] Integration tests for workflow state management
- [ ] Agent creation functions return valid configurations
- [ ] Skill loading handles missing files gracefully
- [ ] Workflow transitions validate prerequisites
- [ ] Error conditions return sensible defaults

## Tool and Library Usage

### Allowed Libraries

- **File System**: Node.js `fs` module (synchronous operations only)
- **Path Operations**: Node.js `path` module
- **Environment**: `process.env` for configuration
- **OpenCode Framework**: `@opencode-ai/plugin` and `@opencode-ai/sdk`

### Prohibited Patterns

- **Asynchronous File I/O**: Use synchronous operations for simplicity
- **External HTTP Requests**: Keep agents framework-agnostic
- **Global State**: Prefer explicit parameter passing
- **Complex Dependencies**: Minimize third-party libraries

## Performance Considerations

### Code Efficiency

- **File I/O**: Cache frequently read files (like agent prompts)
- **State Management**: Minimize JSON parsing/serialization
- **Memory Usage**: Clean up temporary files and buffers
- **Bundle Size**: Keep dependencies minimal

### Agent Performance

- **Prompt Size**: Keep agent prompts under 10KB when possible
- **State Transitions**: Validate state before expensive operations
- **Skill Loading**: Load skills on-demand, not upfront
- **Error Recovery**: Fail gracefully without crashing the workflow

## Security Guidelines

### Input Validation

```typescript
// Always validate external inputs
export function setWorkflowHandover(step: string | null): WorkflowState {
  const validSteps: (keyof Workflow)[] = [
    "dataCollection", "IRAnalysis", "scenarioAnalysis",
    "useCaseAnalysis", "functionalRefinement",
    "systemFunctionalDesign", "moduleFunctionalDesign"
  ]

  if (step !== null && !validSteps.includes(step as keyof Workflow)) {
    throw new Error(`Invalid workflow step: ${step}`)
  }
  // ... continue with validated input
}
```

### File System Security

- **Path Traversal**: Use `path.join()` and validate paths
- **Directory Creation**: Create directories safely with `{ recursive: true }`
- **File Permissions**: Don't modify file permissions
- **Temporary Files**: Clean up temporary state files

## Future Enhancements

### Planned Improvements

1. **Testing Infrastructure**: Add Jest/Vitest with comprehensive test suite
2. **Linting**: Add ESLint with TypeScript rules
3. **Formatting**: Add Prettier for consistent code style
4. **Type Checking**: Add `tsconfig.json` for strict TypeScript compilation
5. **CI/CD**: Add GitHub Actions for automated testing and linting
6. **Documentation**: Auto-generate API docs from JSDoc comments

### Migration Notes

- **OpenCode Compatibility**: Keep plugin interface compatible with framework updates
- **Skill Format**: Maintain backward compatibility when updating skill files
- **State Persistence**: Ensure workflow state migrations handle version changes
- **Agent Prompts**: Version agent prompts to track improvements over time

---

This document serves as the comprehensive guide for all agentic coding activities in the hyper-designer project. Follow these guidelines to maintain code quality, consistency, and reliability across the codebase.</content>
<parameter name="filePath">AGENTS.md