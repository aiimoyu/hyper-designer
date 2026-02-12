# AGENTS.md - hyper-designer Coding Guidelines

## Project Overview

TypeScript/Node.js project implementing specialized agents and workflow management for requirements engineering. Uses ES modules with strict TypeScript configuration.

## Build, Lint, Test Commands

```bash
# Type checking (no emit)
npm run typecheck

# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run src/__tests__/framework/agents/factory.test.ts

# Run tests matching a pattern
npx vitest run -t "createAgent"
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022 with ESNext modules
- Strict mode enabled with `strict: true`
- Unused locals/parameters must be removed (`noUnusedLocals`, `noUnusedParameters`)
- Exact optional property types enforced (`exactOptionalPropertyTypes`)
- Force consistent casing in file names

### Imports
- Use ES module syntax (`import`/`export`)
- Type imports should use `import type { X } from "..."`
- Group imports: built-ins → external deps → internal modules → type imports
- Use path aliases relative to `src/` for internal imports

### Formatting
- No strict semicolon enforcement (mixed usage acceptable)
- 2-space indentation
- Prefer single quotes for strings
- Trailing commas in multi-line objects/arrays

### Naming Conventions
- **Types/Interfaces**: PascalCase (e.g., `AgentConfig`, `WorkflowState`)
- **Functions/Variables**: camelCase (e.g., `createAgent`, `workflowState`)
- **Constants**: UPPER_SNAKE_CASE for module-level constants (e.g., `WORKFLOW_STATE_PATH`)
- **Files**: camelCase.ts or PascalCase.ts (match primary export)
- **Test files**: `*.test.ts` suffix

### Types
- Explicit return types on exported functions
- Use `interface` for object shapes (preferred over `type`)
- Use `type` for unions, intersections, and utility types
- Define optionality explicitly: `prop?: Type` vs `prop: Type | undefined`
- Leverage TypeScript's strict null checks

### Error Handling
- Always narrow errors: `error instanceof Error ? error : new Error(String(error))`
- Use the logger utility: `HyperDesignerLogger` for consistent logging
- Never swallow errors silently - at minimum log them
- In strict mode (`HD_STRICT_ERRORS=1`), errors are thrown after logging

### Functions
- Use named exports (avoid default exports)
- Document with JSDoc comments including:
  - Brief description
  - `@param` tags with types
  - `@returns` description
- Keep functions focused and single-purpose
- Prefer pure functions; isolate side effects

### Testing
- Use Vitest with `describe`, `it`, `expect`
- Tests located in `src/__tests__/` mirroring source structure
- Group tests: `framework/` for unit tests, `instances/` for integration
- Use `beforeEach`/`afterEach` for test setup/cleanup
- Test environment configured in `vitest.config.ts` with setup file at `src/__tests__/setup.ts`

### Documentation
- File-level JSDoc describing module purpose
- Function-level JSDoc for public APIs
- Inline comments in Chinese for business logic (maintain consistency with existing code)
- English for technical/algorithmic comments

### Project Structure
```
src/
  agents/          # Agent definitions and factory
  workflows/       # Workflow engine (core/, plugins/, hooks/)
  config/          # Configuration loading
  utils/           # Shared utilities (logger)
  __tests__/       # Test suites
    framework/     # Unit tests
    instances/     # Integration tests
```

### Logging
- Use `HyperDesignerLogger` (static methods: `debug`, `info`, `warn`, `error`)
- Include module name as first parameter
- Pass context object as last parameter for structured logging
- Log files written to `.hyper-designer/logs/` (not stdout)

### Configuration
- Project config: `.hyper-designer/hd-config.json`
- Global config: `~/.config/opencode/hyper-designer/hd-config.json`
- Environment variables: `HD_STRICT_ERRORS`, `HYPER_DESIGNER_LOG_LEVEL`

## Notes for AI Agents

- Respect existing bilingual comment patterns (Chinese for domain logic)
- Maintain strict TypeScript compliance - no `any` types
- Follow the established error handling pattern with logger
- Keep agent factory pattern when adding new agents
- Use the workflow state management system for persistence
