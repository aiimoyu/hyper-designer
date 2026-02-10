# Draft: TypeScript Refactoring & Frontend Decoupling

## Requirements (confirmed)
- User wants to review and fix the project's code structure, design patterns, and TypeScript development style
- `src/` should be a generic/universal layer, decoupled from any specific frontend (OpenCode, Claude Code, etc.)
- The project is a plugin with `src/` as the core, and adapters (like `opencode/`) for specific frontends

## Critical Issues Found

### Structural Problems
1. **`indext.ts` (typo)**: Should be `index.ts`. References non-existent `Clarifier` module — dead code with compile errors
2. **`src/index.ts` is empty**: Core package has no exports — unusable as standalone library
3. **No `package.json` / `tsconfig.json`**: No type checking, no dependency management
4. **Massive agent code duplication**: ~60% of each agent file is identical boilerplate (fileURLToPath, loadHDConfig, factory pattern)
5. **Frontend-coupled code in `src/`**: `src/workflow/hooks/opencode/workflow.ts` directly imports OpenCode-specific APIs

### Type System Issues
6. **`AgentOverrideConfig` defined twice**: In `types.ts` AND `config/loader.ts` with different shapes
7. **`HCollectorPhase` defined twice**: In `types.ts` AND `HCollector/index.ts`
8. **`requirementDecomposition` stage inconsistency**: In `Workflow` interface but missing from plugin tool enums

### Code Quality Issues
9. **Debug logger DRY violation**: 4 nearly-identical methods with only level label different
10. **Hardcoded `process.cwd()` paths**: Fragile, framework-dependent

## Technical Decisions
- [CONFIRMED] Add package.json + tsconfig.json — full setup for type checking & IDE support
- [CONFIRMED] Adapter pattern — move OpenCode-specific code out of src/, define abstract interfaces in core, each frontend (opencode/, claude-code/) implements them
- [CONFIRMED] Base factory + config — create `createAgent(config: AgentDefinition)` base function, each agent becomes thin config object
- [CONFIRMED] Add Vitest + basic tests for agent creation, workflow state, config loading

## Research Findings
- Project has NO build step — TypeScript transpiled on-the-fly by OpenCode framework
- Uses `import.meta.url` (ESM) for file path resolution
- 4 agents follow identical pattern: read .md prompts → merge config → return AgentConfig
- Skills are pure .md files loaded dynamically
- Workflow state persisted as JSON in `.hyper-designer/workflow_state.json`

## Open Questions
- (All resolved via user consultation)

## Test Strategy Decision
- **Infrastructure exists**: NO
- **Automated tests**: YES (Tests-after — verify refactoring doesn't break behavior)
- **Framework**: Vitest (best for TypeScript-first projects, fast, built-in type testing)
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

## Scope Boundaries
- INCLUDE: File structure reorganization, code deduplication, type fixes, frontend decoupling
- EXCLUDE: Changes to .md prompt content, new agent functionality
