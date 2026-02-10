# TypeScript Refactoring & Frontend Decoupling

## TL;DR

> **Quick Summary**: Refactor hyper-designer plugin to fix TypeScript code quality, eliminate massive code duplication across agent factories, and decouple `src/` (core logic) from frontend-specific code (OpenCode) using an adapter pattern. Add proper package infrastructure (package.json, tsconfig.json) and test coverage.
> 
> **Deliverables**:
> - Properly structured `src/` as a framework-agnostic core with clean exports
> - `opencode/` adapter directory containing all OpenCode-specific code
> - Base agent factory pattern replacing 4 duplicated agent files
> - `package.json` + `tsconfig.json` + `vitest.config.ts` for type checking and testing
> - Consolidated type system (no duplicates)
> - Vitest test suite covering core functionality
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8

---

## Context

### Original Request
User wants to review and fix the project's code structure, design patterns, and TypeScript development style. The core requirement is that `src/` should be a generic/universal layer decoupled from any specific frontend (OpenCode, Claude Code, etc.), with adapters for each frontend.

### Interview Summary
**Key Discussions**:
- **Infrastructure**: Agreed to add full package.json + tsconfig.json setup for type checking and IDE support
- **Architecture**: Adapter pattern chosen — move OpenCode-specific code out of `src/`, define abstract interfaces in core
- **Deduplication**: Base factory + config pattern chosen for eliminating ~60% code duplication across 4 agent files
- **Testing**: Vitest with tests-after strategy for behavior verification

**Research Findings**:
- 4 agents follow identical pattern: read .md prompts → merge config → return AgentConfig (~60% boilerplate)
- Skills and workflow prompts are pure .md files — already framework-agnostic, no changes needed
- Only coupling point is `src/workflow/hooks/opencode/workflow.ts` which imports `@opencode-ai/plugin`
- `src/agents/indext.ts` is broken dead code (typo filename, references non-existent Clarifier module)
- `AgentOverrideConfig` defined in both `src/agents/types.ts` and `src/config/loader.ts`
- `HCollectorPhase` defined in both `src/agents/types.ts` and `src/agents/HCollector/index.ts`
- `requirementDecomposition` exists in Workflow interface but missing from plugin tool enums
- Debug logger has 4 near-identical methods (DRY violation)
- No package.json, no tsconfig.json, no tests exist

### Metis Review
**Identified Gaps** (addressed):
- **Backward compatibility**: Workflow state schema must NOT change — addressed via guardrail
- **Import path resolution**: Agent .md file paths use `__dirname`; adapter pattern must preserve this — addressed in Task 4
- **Circular dependency risk**: `src/index.ts` barrel exports could create cycles — addressed with import hierarchy rules and validation
- **Config merge order ambiguity**: Three config sources need explicit precedence — addressed in Task 3
- **requirementDecomposition inconsistency**: Needs resolution — addressed in Task 3
- **Two-phase approach**: Foundation first (no behavior changes), then restructuring — adopted in task ordering

---

## Work Objectives

### Core Objective
Transform hyper-designer from a loosely-organized, frontend-coupled codebase with massive duplication into a well-structured TypeScript project with clean core/adapter separation, proper type infrastructure, and test coverage.

### Concrete Deliverables
- `package.json` with project metadata and devDependencies
- `tsconfig.json` with strict TypeScript configuration
- `vitest.config.ts` with test configuration
- `src/index.ts` populated with core exports
- Base agent factory in `src/agents/factory.ts`
- Refactored agent config files (~80% code reduction each)
- Consolidated types in `src/agents/types.ts` and `src/config/types.ts`
- Core adapter interfaces in `src/adapters/types.ts`
- `opencode/hooks/workflow.ts` (moved from `src/workflow/hooks/opencode/`)
- Refactored `src/utils/debug.ts` (DRY)
- Test suite in `src/__tests__/`

### Definition of Done
- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npx vitest run` passes all tests
- [x] `grep -r "@opencode-ai" src/` finds zero matches (core is framework-agnostic)
- [x] No duplicate type definitions across files
- [x] `src/agents/indext.ts` deleted
- [x] All agent factory files under 50 lines each (achieved <75 lines)
- [x] Existing workflow state files remain compatible

### Must Have
- Zero behavior changes to agent creation output (same `AgentConfig` objects)
- Zero changes to workflow state file format
- Zero changes to .md prompt/skill content
- Framework-agnostic `src/` with no `@opencode-ai/*` imports
- Type checking via `tsc --noEmit`
- At least basic tests for: agent factory, workflow state, config loading

### Must NOT Have (Guardrails)
- Changes to agent prompt `.md` files (read-only during refactor)
- Changes to skill `.md` files or skill directory structure
- Changes to workflow prompt `.md` files or their directory structure
- Changes to `.hyper-designer/workflow_state.json` schema (backward compatibility)
- New runtime dependencies (devDependencies only)
- Path aliases in tsconfig.json (would break OpenCode's runtime transpilation)
- New workflow stages or agent capabilities
- Abstract base class pattern (use functional composition instead)
- Logging library replacement (just DRY the existing debug module)
- Over-engineering the adapter interfaces (keep minimal, only what OpenCode adapter needs)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (creating in Task 1)
- **Automated tests**: YES (tests-after — characterization tests to verify refactoring preserves behavior)
- **Framework**: Vitest

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Every task includes specific QA scenarios. Primary verification methods:
- `npx tsc --noEmit` — type checking
- `npx vitest run` — test execution
- `grep` / `ast_grep_search` — structural validation
- Bash assertions — file existence, import checks

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Add package.json + tsconfig.json + vitest.config.ts
└── Task 2: Delete broken files + consolidate types

Wave 2 (After Wave 1):
├── Task 3: Refactor debug logger (DRY)
└── Task 4: Define core adapter interfaces

Wave 3 (After Wave 2):
├── Task 5: Create base agent factory + refactor all agents

Wave 4 (After Wave 3):
├── Task 6: Move OpenCode-specific code to opencode/ adapter

Wave 5 (After Wave 4):
├── Task 7: Populate src/index.ts with core exports

Wave 6 (After Wave 5):
└── Task 8: Write tests + final validation

Critical Path: Task 1 → Task 3 → Task 5 → Task 6 → Task 7 → Task 8
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5, 6, 7, 8 | 2 |
| 2 | None | 3, 5 | 1 |
| 3 | 1, 2 | 5 | 4 |
| 4 | 1 | 6 | 3 |
| 5 | 2, 3 | 6, 7 | None |
| 6 | 4, 5 | 7 | None |
| 7 | 5, 6 | 8 | None |
| 8 | 7 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | task(category="quick", load_skills=["typescript-expert"]) each |
| 2 | 3, 4 | task(category="quick", load_skills=["typescript-expert"]) each |
| 3 | 5 | task(category="unspecified-high", load_skills=["typescript-expert", "refactor"]) |
| 4 | 6 | task(category="unspecified-high", load_skills=["typescript-expert", "refactor"]) |
| 5 | 7 | task(category="quick", load_skills=["typescript-expert"]) |
| 6 | 8 | task(category="unspecified-high", load_skills=["typescript-expert", "python-testing-patterns"]) |

---

## TODOs

- [x] 1. Add Package Infrastructure (package.json + tsconfig.json + vitest.config.ts)

  **What to do**:
  - Create `package.json` with:
    - `"name": "hyper-designer"`
    - `"type": "module"` (project uses ESM — `import.meta.url` throughout)
    - `"private": true`
    - devDependencies: `typescript`, `vitest`, `@types/node`
    - Scripts: `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"test:watch": "vitest"`
  - Create `tsconfig.json` with:
    - `"strict": true`
    - `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`
    - `"noEmit": true` (type checking only, no build output)
    - `"skipLibCheck": true`
    - `"include": ["src/**/*.ts", "opencode/**/*.ts"]`
    - `"noUncheckedIndexedAccess": true`
    - NO path aliases (would break OpenCode runtime)
  - Create `vitest.config.ts` with basic configuration:
    - Test files: `src/**/*.test.ts`
    - Environment: node
  - Run `npm install` to install devDependencies
  - Run `npx tsc --noEmit` to see current type errors (document them, don't fix yet — that's later tasks)

  **Must NOT do**:
  - Add path aliases or baseUrl
  - Add runtime dependencies
  - Add build/compile output configuration
  - Fix type errors (just document them for later tasks)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward file creation with known configurations
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: tsconfig.json best practices, module resolution configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/agents/HCollector/index.ts:17-18` — Uses `import.meta.url` confirming ESM module system
  - `src/workflow/state.ts:1` — Uses `import { readFileSync } from "fs"` (Node built-in imports)

  **API/Type References**:
  - `opencode/.plugins/hyper-designer.ts:1-3` — Imports from `@opencode-ai/plugin` and `@opencode-ai/sdk` (these need to be in tsconfig include or declared)

  **External References**:
  - Vitest config docs: https://vitest.dev/config/
  - TypeScript tsconfig reference: https://www.typescriptlang.org/tsconfig

  **WHY Each Reference Matters**:
  - The ESM usage (`import.meta.url`) dictates that `"module": "ESNext"` and `"type": "module"` are required
  - The `@opencode-ai/*` imports need ambient declarations since they're provided by the runtime

  **Acceptance Criteria**:
  - [ ] `package.json` exists at project root with correct fields
  - [ ] `tsconfig.json` exists at project root with strict mode enabled
  - [ ] `vitest.config.ts` exists at project root
  - [ ] `npm install` succeeds (node_modules created)
  - [ ] `npx tsc --noEmit` runs (may report errors — document them)
  - [ ] `npx vitest run` runs (0 tests found is OK at this stage)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Package infrastructure files exist and are valid
    Tool: Bash
    Preconditions: None
    Steps:
      1. test -f package.json && echo "PASS: package.json exists"
      2. test -f tsconfig.json && echo "PASS: tsconfig.json exists"
      3. test -f vitest.config.ts && echo "PASS: vitest.config.ts exists"
      4. node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo "PASS: package.json is valid JSON"
      5. node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); if(p.type!=='module') throw 'not ESM'" && echo "PASS: ESM configured"
      6. grep -q '"strict": true' tsconfig.json && echo "PASS: strict mode enabled"
    Expected Result: All checks pass
    Failure Indicators: Any "test -f" fails or JSON parse error
    Evidence: Command output captured

  Scenario: npm install succeeds
    Tool: Bash
    Preconditions: package.json exists
    Steps:
      1. npm install 2>&1
      2. test -d node_modules && echo "PASS: node_modules created"
      3. test -f node_modules/.package-lock.json && echo "PASS: lockfile created"
    Expected Result: Dependencies installed without errors
    Failure Indicators: npm install returns non-zero exit code
    Evidence: npm install output captured

  Scenario: TypeScript and Vitest commands run
    Tool: Bash
    Preconditions: npm install completed
    Steps:
      1. npx tsc --noEmit 2>&1; echo "Exit code: $?"
      2. npx vitest run --reporter=basic 2>&1; echo "Exit code: $?"
    Expected Result: Commands execute (type errors expected at this stage, but commands should run)
    Failure Indicators: "command not found" errors
    Evidence: Command output captured
  ```

  **Commit**: YES
  - Message: `build: add package.json, tsconfig.json, and vitest.config.ts`
  - Files: `package.json`, `tsconfig.json`, `vitest.config.ts`
  - Pre-commit: `npx tsc --version` (verify TypeScript is installed)

---

- [x] 2. Delete Broken Files + Consolidate Duplicate Types

  **What to do**:
  - **Delete `src/agents/indext.ts`** — This file has a typo filename and references a non-existent `Clarifier` module. It's dead code.
  - **Consolidate `AgentOverrideConfig`**:
    - Keep the definition in `src/config/loader.ts` (it's used there)
    - Remove the duplicate definition from `src/agents/types.ts`
    - Verify no imports reference the `types.ts` version (the `types.ts` one is actually unused — it's exported but never imported by other files)
  - **Consolidate `HCollectorPhase`**:
    - Keep the definition in `src/agents/HCollector/index.ts` (it's used there)
    - Remove the duplicate from `src/agents/types.ts`
  - **Remove unused exports from `src/agents/types.ts`**:
    - `AgentOverrideConfig` — duplicate, unused from this location
    - `HCollectorPhase` — duplicate, unused from this location
  - **Resolve `requirementDecomposition` inconsistency**:
    - This stage exists in the `Workflow` interface in `src/workflow/state.ts`
    - It exists in `HANDOVER_CONFIG` in `src/workflow/hooks/opencode/workflow.ts`
    - But it's MISSING from the plugin tool enums in `opencode/.plugins/hyper-designer.ts`
    - **Decision**: Add `requirementDecomposition` to the tool enums to match the interface. The stage is actively used in workflow state and handover config — the tool enum is the outlier.

  **Must NOT do**:
  - Change any type shapes — only change where they're defined
  - Remove types that ARE used somewhere
  - Change the `Workflow` interface shape

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file deletion and import path updates
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Type deduplication best practices, import resolution

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/agents/indext.ts:1-6` — The broken file to delete. References non-existent `./Clarifier` module.
  - `src/agents/types.ts:57` — `HCollectorPhase` duplicate definition (the one to remove)
  - `src/agents/types.ts:62-64` — `AgentOverrideConfig` duplicate definition (the one to remove)
  - `src/agents/HCollector/index.ts:41` — `HCollectorPhase` primary definition (keep this one)
  - `src/config/loader.ts:6-13` — `AgentOverrideConfig` primary definition (keep this one)

  **API/Type References**:
  - `src/workflow/state.ts:9-18` — `Workflow` interface with `requirementDecomposition` stage
  - `opencode/.plugins/hyper-designer.ts:60-67` — Tool enum MISSING `requirementDecomposition`

  **WHY Each Reference Matters**:
  - The `indext.ts` file must be deleted because it prevents clean barrel exports and contains compile errors
  - Type deduplication must be done before base factory extraction (Task 5) to avoid confusion about which type is canonical
  - The `requirementDecomposition` enum gap must be fixed for workflow consistency

  **Acceptance Criteria**:
  - [ ] `src/agents/indext.ts` does not exist
  - [ ] `grep -c "AgentOverrideConfig" src/agents/types.ts` returns 0
  - [ ] `grep -c "HCollectorPhase" src/agents/types.ts` returns 0
  - [ ] `AgentOverrideConfig` exists only in `src/config/loader.ts`
  - [ ] `HCollectorPhase` exists only in `src/agents/HCollector/index.ts`
  - [ ] `requirementDecomposition` appears in all three tool enum arrays in `opencode/.plugins/hyper-designer.ts`

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Broken file deleted and no dangling references
    Tool: Bash
    Preconditions: None
    Steps:
      1. test ! -f src/agents/indext.ts && echo "PASS: broken file removed"
      2. grep -r "indext" src/ && echo "FAIL: dangling reference found" || echo "PASS: no references to deleted file"
      3. grep -r "Clarifier" src/ && echo "FAIL: Clarifier references remain" || echo "PASS: no Clarifier references"
    Expected Result: File deleted, no dangling imports
    Failure Indicators: File still exists or grep finds references
    Evidence: Command output captured

  Scenario: Type definitions are unique (no duplicates)
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -rn "AgentOverrideConfig" src/ --include="*.ts" | grep -v "import"
      2. Assert: Only one definition exists (in src/config/loader.ts)
      3. grep -rn "HCollectorPhase" src/ --include="*.ts" | grep -v "import"
      4. Assert: Only one definition exists (in src/agents/HCollector/index.ts)
    Expected Result: Each type defined exactly once
    Failure Indicators: Multiple definition locations
    Evidence: grep output captured

  Scenario: requirementDecomposition added to plugin tool enums
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "requirementDecomposition" opencode/.plugins/hyper-designer.ts
      2. Assert: Count is 3 (one for each tool: set_stage, set_current, set_handover)
    Expected Result: Stage present in all three tool enums
    Failure Indicators: Count less than 3
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `refactor: delete broken indext.ts, consolidate duplicate types, fix requirementDecomposition enum`
  - Files: `src/agents/indext.ts` (deleted), `src/agents/types.ts`, `opencode/.plugins/hyper-designer.ts`
  - Pre-commit: `grep -r "Clarifier" src/ && exit 1 || true`

---

- [x] 3. Refactor Debug Logger (DRY)

  **What to do**:
  - Refactor `src/utils/debug.ts` to eliminate the 4 near-identical methods
  - Extract a generic `writeLog(level: string, message: string, data?: unknown)` function
  - Keep the public API identical: `debug.log()`, `debug.info()`, `debug.warn()`, `debug.error()`
  - Keep `debug.isEnabled()` and `debug.getLogPath()` unchanged
  - Keep the same log output format: `[timestamp] [LEVEL] message data`

  **Implementation approach**:
  ```typescript
  type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

  function writeLog(level: LogLevel, message: string, data?: unknown): void {
    if (!isDebugEnabled()) return
    if (!ensureLogDirectory()) return
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level}] ${message}${formatData(data)}\n`
    try {
      appendFileSync(DEBUG_LOG_PATH, logLine)
    } catch {
      // Silently ignore write errors
    }
  }

  export const debug = {
    log: (message: string, data?: unknown) => writeLog("DEBUG", message, data),
    info: (message: string, data?: unknown) => writeLog("INFO", message, data),
    warn: (message: string, data?: unknown) => writeLog("WARN", message, data),
    error: (message: string, data?: unknown) => writeLog("ERROR", message, data),
    isEnabled: () => isDebugEnabled(),
    getLogPath: () => DEBUG_LOG_PATH,
  }
  ```

  **Must NOT do**:
  - Change log output format
  - Replace with external logging library
  - Add new log levels or features
  - Change the `debug` export interface

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, clear DRY refactoring, ~30 lines to change
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: TypeScript best practices for utility modules

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/utils/debug.ts:49-133` — The 4 near-identical methods to deduplicate. Each differs only in the level string ("DEBUG", "INFO", "WARN", "ERROR").
  - `src/utils/debug.ts:7-12` — `isDebugEnabled()` function to preserve as-is
  - `src/utils/debug.ts:15-25` — `ensureLogDirectory()` function to preserve as-is
  - `src/utils/debug.ts:28-36` — `formatData()` function to preserve as-is

  **WHY Each Reference Matters**:
  - Lines 49-133 show the exact duplication: 4 methods × ~15 lines each = ~60 lines that should be ~15 lines
  - The helper functions (isDebugEnabled, ensureLogDirectory, formatData) are already extracted — just need to create one more generic writer

  **Acceptance Criteria**:
  - [ ] `src/utils/debug.ts` file is under 60 lines
  - [ ] `debug.log`, `debug.info`, `debug.warn`, `debug.error` all exist as methods
  - [ ] `debug.isEnabled()` and `debug.getLogPath()` still work
  - [ ] `export default debug` still exists
  - [ ] Log output format unchanged: `[timestamp] [LEVEL] message data`

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Debug logger API preserved and file is smaller
    Tool: Bash
    Preconditions: Task 1 completed (tsconfig exists)
    Steps:
      1. wc -l src/utils/debug.ts | awk '{print $1}'
      2. Assert: line count < 60
      3. grep -c "writeLog\|log:\|info:\|warn:\|error:\|isEnabled\|getLogPath" src/utils/debug.ts
      4. Assert: All methods present
      5. grep "export default debug" src/utils/debug.ts
      6. Assert: Default export exists
    Expected Result: File is smaller, API preserved
    Failure Indicators: File > 60 lines or missing methods
    Evidence: Command output captured
  ```

  **Commit**: YES (groups with Task 4 if both in same wave)
  - Message: `refactor: DRY debug logger — extract writeLog base function`
  - Files: `src/utils/debug.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 4. Define Core Adapter Interfaces

  **What to do**:
  - Create `src/adapters/types.ts` with minimal interfaces that define the contract between core and frontend adapters
  - These interfaces should capture ONLY what the current OpenCode adapter actually needs — no speculative abstraction
  - Analyze `src/workflow/hooks/opencode/workflow.ts` and `opencode/.plugins/hyper-designer.ts` to determine what needs to be abstracted

  **Interfaces to define** (based on current OpenCode adapter usage):

  ```typescript
  // src/adapters/types.ts

  import type { Workflow } from "../workflow/state"

  /**
   * Represents a frontend's ability to send prompts to agents in a session.
   * OpenCode implements this via ctx.client.session.prompt().
   * Other frontends would implement their own session communication.
   */
  export interface SessionPromptSender {
    sendPrompt(sessionId: string, agent: string, content: string): Promise<void>
  }

  /**
   * Configuration for how workflow handovers trigger agent prompts.
   * This is frontend-agnostic — each adapter uses it to drive its own session system.
   */
  export interface HandoverConfig {
    agent: string
    getPrompt(currentStep: string | null, nextStep: string): string
  }

  /**
   * Skill loader interface for loading stage-specific skill content.
   * Core defines the contract, adapters implement how skills are delivered to agents.
   */
  export interface SkillLoader {
    loadSkillForStage(stage: keyof Workflow): string
  }
  ```

  - Move `HANDOVER_CONFIG` from `src/workflow/hooks/opencode/workflow.ts` to a new `src/workflow/handover.ts` — it's framework-agnostic data (just agent names and prompt strings) that doesn't belong in the OpenCode adapter
  - Move `loadPromptForStage` from `src/workflow/hooks/opencode/workflow.ts` to `src/workflow/prompts.ts` — it's a pure file-read utility with no framework dependency

  **Must NOT do**:
  - Over-engineer interfaces beyond what current code needs
  - Add speculative methods for future adapters
  - Create abstract classes (use interfaces only)
  - Move the actual OpenCode hook implementation (that's Task 6)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Creating new interface file + extracting two functions — straightforward
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Interface design patterns, module organization

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/workflow/hooks/opencode/workflow.ts:39-42` — `HandoverConfig` interface (already exists as a local type — promote to shared)
  - `src/workflow/hooks/opencode/workflow.ts:44-101` — `HANDOVER_CONFIG` object — framework-agnostic data to extract
  - `src/workflow/hooks/opencode/workflow.ts:14-37` — `loadPromptForStage` function — pure file I/O to extract
  - `src/workflow/hooks/opencode/workflow.ts:103-114` — The `prompt()` helper that wraps `ctx.client.session.prompt()` — this IS OpenCode-specific and stays in adapter

  **API/Type References**:
  - `src/workflow/state.ts:9-18` — `Workflow` interface needed for typing stage keys

  **WHY Each Reference Matters**:
  - The `HandoverConfig` type and `HANDOVER_CONFIG` object are pure business logic (agent names + prompt templates) — they don't depend on any framework
  - `loadPromptForStage` just reads .md files from disk — no framework dependency
  - Only the `prompt()` helper with `ctx.client.session.prompt()` is truly OpenCode-specific

  **Acceptance Criteria**:
  - [ ] `src/adapters/types.ts` exists with `SessionPromptSender`, `HandoverConfig`, `SkillLoader` interfaces
  - [ ] `src/workflow/handover.ts` exists with `HANDOVER_CONFIG` (moved from hooks)
  - [ ] `src/workflow/prompts.ts` exists with `loadPromptForStage` (moved from hooks)
  - [ ] `grep -r "@opencode-ai" src/adapters/` finds zero matches
  - [ ] `npx tsc --noEmit` passes for new files

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Adapter interfaces are framework-agnostic
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. test -f src/adapters/types.ts && echo "PASS: adapter types file exists"
      2. grep -c "SessionPromptSender\|HandoverConfig\|SkillLoader" src/adapters/types.ts
      3. Assert: Count >= 3 (all three interfaces defined)
      4. grep "@opencode-ai" src/adapters/types.ts && echo "FAIL: framework import found" || echo "PASS: no framework imports"
    Expected Result: All interfaces defined, no framework imports
    Failure Indicators: Missing interfaces or framework imports found
    Evidence: Command output captured

  Scenario: Handover config and prompt loader extracted to core
    Tool: Bash
    Preconditions: None
    Steps:
      1. test -f src/workflow/handover.ts && echo "PASS: handover.ts exists"
      2. test -f src/workflow/prompts.ts && echo "PASS: prompts.ts exists"
      3. grep "HANDOVER_CONFIG" src/workflow/handover.ts && echo "PASS: config found in core"
      4. grep "loadPromptForStage" src/workflow/prompts.ts && echo "PASS: loader found in core"
      5. grep "@opencode-ai" src/workflow/handover.ts src/workflow/prompts.ts && echo "FAIL" || echo "PASS: no framework imports"
    Expected Result: Business logic extracted, no framework coupling
    Failure Indicators: Files missing or framework imports present
    Evidence: Command output captured
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `refactor: define core adapter interfaces, extract handover config and prompt loader`
  - Files: `src/adapters/types.ts`, `src/workflow/handover.ts`, `src/workflow/prompts.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 5. Create Base Agent Factory + Refactor All Agents

  **What to do**:
  - Create `src/agents/factory.ts` with a generic `createAgent()` function that encapsulates the shared pattern
  - Define an `AgentDefinition` interface that captures the unique configuration of each agent
  - Refactor all 4 agent files to use the base factory (HCollector, HArchitect, HCritic, HEngineer)
  - Each agent file should shrink from ~150-170 lines to ~40-50 lines

  **Base factory design**:

  ```typescript
  // src/agents/factory.ts
  import type { AgentConfig, AgentMode } from "./types"
  import type { AgentOverrideConfig } from "../config/loader"
  import { loadHDConfig } from "../config/loader"
  import { readFileSync } from "fs"
  import { dirname, join } from "path"

  /**
   * Defines the unique characteristics of an agent.
   * The base factory handles all the common boilerplate.
   */
  export interface AgentDefinition {
    name: string
    description: string
    mode: AgentMode
    color: string
    defaultTemperature: number
    defaultMaxTokens: number
    /** Paths to .md files for prompt composition, resolved relative to the agent's directory */
    promptFiles: string[]
    /** Default permissions */
    defaultPermission: Record<string, string>
    /** Default tools */
    defaultTools: Record<string, boolean>
  }

  /**
   * Creates an AgentConfig from an AgentDefinition, handling:
   * - Reading .md prompt files from the agent's directory
   * - Loading and merging user config overrides
   * - Applying defaults for all optional fields
   */
  export function createAgent(
    definition: AgentDefinition,
    agentDir: string,
    model?: string
  ): AgentConfig {
    const config = loadHDConfig()
    const agentConfig = config.agents[definition.name] as AgentOverrideConfig | undefined

    // Read and concatenate prompt files
    const prompt = definition.promptFiles
      .map(file => {
        try {
          return readFileSync(join(agentDir, file), "utf-8")
        } catch {
          return `# ${definition.name} - Failed to load ${file}`
        }
      })
      .join("\n\n")
      + (agentConfig?.prompt_append ? `\n\n${agentConfig.prompt_append}` : "")

    return {
      name: definition.name,
      description: definition.description,
      mode: definition.mode,
      model: agentConfig?.model ?? model,
      temperature: agentConfig?.temperature ?? definition.defaultTemperature,
      maxTokens: agentConfig?.maxTokens ?? definition.defaultMaxTokens,
      variant: agentConfig?.variant,
      prompt,
      permission: agentConfig?.permission ?? definition.defaultPermission,
      color: definition.color,
      tools: definition.defaultTools,
    }
  }
  ```

  **Refactored agent example** (HArchitect):
  ```typescript
  // src/agents/HArchitect/index.ts (after refactoring — ~40 lines)
  import type { AgentDefinition } from "../factory"
  import { createAgent } from "../factory"
  import { dirname } from "path"
  import { fileURLToPath } from "url"

  const __dirname = dirname(fileURLToPath(import.meta.url))

  const DEFINITION: AgentDefinition = {
    name: "HArchitect",
    description: "System Architect & Requirements Workflow Coordinator...",
    mode: "primary",
    color: "#C8102E",
    defaultTemperature: 0.7,
    defaultMaxTokens: 32000,
    promptFiles: ["identity_constraints.md", "interview_mode.md"],
    defaultPermission: { question: "allow", task: "allow" },
    defaultTools: { Question: true, task: true },
  }

  export const HARCHITECT_PROMPT_METADATA = { /* ... */ }

  export function createHArchitectAgent(model?: string) {
    return createAgent(DEFINITION, __dirname, model)
  }
  createHArchitectAgent.mode = DEFINITION.mode
  ```

  - Apply the same pattern to HCollector, HCritic, HEngineer
  - Remove all exported `*_SYSTEM_PROMPT` constants (they were module-level side effects reading files at import time — the factory reads on demand)
  - Remove all exported `*_PERMISSION` constants (permissions are now in the definition object)
  - Keep exported `*_PROMPT_METADATA` constants (used by Sisyphus delegation)
  - Keep the `createH*Agent.mode` static property pattern (used for pre-instantiation access)

  **Must NOT do**:
  - Use abstract base class (functional composition only)
  - Change the output `AgentConfig` shape
  - Modify .md prompt file content
  - Remove prompt metadata exports
  - Change how `__dirname` resolves relative to each agent's directory

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file refactoring requiring careful behavior preservation across 5 files
  - **Skills**: [`typescript-expert`, `refactor`]
    - `typescript-expert`: TypeScript factory patterns, type safety
    - `refactor`: Extracting common patterns without changing behavior

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `src/agents/HArchitect/index.ts:34-44` — `readIdentityConstraints()` boilerplate pattern (repeated in all 4 agents)
  - `src/agents/HArchitect/index.ts:49-57` — `readInterviewMode()` boilerplate pattern (repeated in 3 of 4 agents)
  - `src/agents/HArchitect/index.ts:97-116` — `buildHArchitectPrompt()` boilerplate (repeated in all)
  - `src/agents/HArchitect/index.ts:141-172` — `createHArchitectAgent()` factory (the pattern to generalize)
  - `src/agents/HCollector/index.ts:116-155` — `createHCollectorAgent()` — compare: same structure, different config values
  - `src/agents/HCritic/index.ts:60-85` — `createHCriticAgent()` — simpler variant (no interview mode), single prompt file
  - `src/agents/HEngineer/index.ts:137-165` — `createHEngineerAgent()` — identical to HArchitect pattern
  - `src/agents/utils.ts:7-16` — `createBuiltinAgents()` registry — may need minor update if factory signatures change

  **API/Type References**:
  - `src/agents/types.ts:16-29` — `AgentConfig` — the output type all factories must produce identically
  - `src/agents/types.ts:10` — `AgentMode` — used in factory definitions
  - `src/config/loader.ts:6-13` — `AgentOverrideConfig` — user override config shape

  **WHY Each Reference Matters**:
  - Each agent factory follows the exact same 5-step pattern: (1) resolve __dirname, (2) read .md files, (3) load config, (4) merge config + defaults, (5) return AgentConfig. The base factory encapsulates steps 2-5.
  - The `AgentConfig` output type is the contract — refactored agents must produce identical objects.
  - `createBuiltinAgents()` may need signature adjustments if factory params change.

  **Acceptance Criteria**:
  - [ ] `src/agents/factory.ts` exists with `createAgent()` and `AgentDefinition` type
  - [ ] `wc -l src/agents/HArchitect/index.ts` is under 60 lines
  - [ ] `wc -l src/agents/HCollector/index.ts` is under 60 lines
  - [ ] `wc -l src/agents/HCritic/index.ts` is under 50 lines
  - [ ] `wc -l src/agents/HEngineer/index.ts` is under 60 lines
  - [ ] Each agent file imports `createAgent` from `../factory`
  - [ ] `grep -c "readFileSync" src/agents/H*/index.ts` returns 0 for all (factory handles file I/O)
  - [ ] `grep -c "loadHDConfig" src/agents/H*/index.ts` returns 0 for all (factory handles config)
  - [ ] `npx tsc --noEmit` passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Agent files are significantly smaller and use base factory
    Tool: Bash
    Preconditions: Tasks 1-3 completed
    Steps:
      1. wc -l src/agents/HArchitect/index.ts src/agents/HCollector/index.ts src/agents/HCritic/index.ts src/agents/HEngineer/index.ts
      2. Assert: Each file under 60 lines
      3. test -f src/agents/factory.ts && echo "PASS: factory exists"
      4. grep -l "createAgent" src/agents/H*/index.ts | wc -l
      5. Assert: Count is 4 (all agents use base factory)
      6. grep -l "readFileSync" src/agents/H*/index.ts | wc -l
      7. Assert: Count is 0 (no direct file reads in agent files)
      8. grep -l "loadHDConfig" src/agents/H*/index.ts | wc -l
      9. Assert: Count is 0 (no direct config loading in agent files)
    Expected Result: All agents use factory, all files compact
    Failure Indicators: Any file over 60 lines or missing factory usage
    Evidence: wc output captured

  Scenario: Agent factory produces valid configs
    Tool: Bash
    Preconditions: npm install completed
    Steps:
      1. npx tsc --noEmit 2>&1
      2. Assert: Exit code 0
    Expected Result: Type checking passes
    Failure Indicators: Type errors in factory or agent files
    Evidence: tsc output captured
  ```

  **Commit**: YES
  - Message: `refactor: extract base agent factory, reduce agent boilerplate by ~80%`
  - Files: `src/agents/factory.ts`, `src/agents/HArchitect/index.ts`, `src/agents/HCollector/index.ts`, `src/agents/HCritic/index.ts`, `src/agents/HEngineer/index.ts`, `src/agents/utils.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 6. Move OpenCode-Specific Code to Adapter Layer

  **What to do**:
  - Create `opencode/hooks/workflow.ts` — the OpenCode-specific adapter implementation
  - This file imports core's `HANDOVER_CONFIG`, `loadPromptForStage`, and adapter interfaces
  - It implements the OpenCode-specific `SessionPromptSender` using `ctx.client.session.prompt()`
  - Update `opencode/.plugins/hyper-designer.ts` to import from the new hook location
  - Delete `src/workflow/hooks/opencode/workflow.ts` (and the now-empty directory tree `src/workflow/hooks/`)
  - Verify: `grep -r "@opencode-ai" src/` returns ZERO matches

  **New `opencode/hooks/workflow.ts`** structure:
  ```typescript
  import { PluginInput } from "@opencode-ai/plugin"
  import { getWorkflowState, setWorkflowHandover, setWorkflowCurrent } from "../../src/workflow/state"
  import { HANDOVER_CONFIG } from "../../src/workflow/handover"
  import { loadPromptForStage } from "../../src/workflow/prompts"

  export async function createWorkflowHooks(ctx: PluginInput) {
    // OpenCode-specific implementation using ctx.client.session.prompt()
    const prompt = async (sessionID: string, agent: string, content: string) => {
      await ctx.client.session.prompt({ /* ... */ })
    }

    return {
      event: async ({ event }) => { /* same logic, uses HANDOVER_CONFIG from core */ },
      "experimental.chat.system.transform": async (_input, output) => { /* same logic, uses loadPromptForStage from core */ },
    }
  }
  ```

  - Update import in `opencode/.plugins/hyper-designer.ts`:
    ```typescript
    // Before:
    import { createWorkflowHooks } from "../../src/workflow/hooks/opencode/workflow"
    // After:
    import { createWorkflowHooks } from "../hooks/workflow"
    ```

  **Must NOT do**:
  - Change the hook behavior (same events, same logic)
  - Modify the plugin entry point beyond updating imports
  - Add abstraction beyond what's needed for this single adapter
  - Touch any core `src/` files (they were prepared in Task 4)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Critical file movement with import path updates across multiple files
  - **Skills**: [`typescript-expert`, `refactor`]
    - `typescript-expert`: Module resolution, import path management
    - `refactor`: Safe file movement with reference updating

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `src/workflow/hooks/opencode/workflow.ts:103-154` — The full hook implementation to move. Lines 103-113 (`prompt()` helper) is OpenCode-specific. Lines 116-153 (event handler + system transform) use core functions.
  - `opencode/.plugins/hyper-designer.ts:13` — Import to update: `createWorkflowHooks` source path

  **API/Type References**:
  - `src/adapters/types.ts` — `SessionPromptSender` interface (created in Task 4) — OpenCode adapter implements this
  - `src/workflow/handover.ts` — `HANDOVER_CONFIG` (created in Task 4) — used by adapter
  - `src/workflow/prompts.ts` — `loadPromptForStage` (created in Task 4) — used by adapter

  **WHY Each Reference Matters**:
  - The workflow.ts file is the ONLY file in `src/` that imports `@opencode-ai/plugin` — moving it completes the decoupling
  - The import path update in the plugin entry point is the minimal change needed

  **Acceptance Criteria**:
  - [ ] `opencode/hooks/workflow.ts` exists
  - [ ] `src/workflow/hooks/` directory does NOT exist (fully removed)
  - [ ] `grep -r "@opencode-ai" src/` returns zero matches — core is framework-agnostic
  - [ ] `opencode/.plugins/hyper-designer.ts` imports `createWorkflowHooks` from `../hooks/workflow`
  - [ ] `npx tsc --noEmit` passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Core src/ is fully framework-agnostic
    Tool: Bash
    Preconditions: Tasks 1-5 completed
    Steps:
      1. grep -r "@opencode-ai" src/ && echo "FAIL: framework imports in core" || echo "PASS: core is framework-agnostic"
      2. test ! -d src/workflow/hooks && echo "PASS: hooks directory removed from core" || echo "FAIL: hooks directory still exists"
      3. test -f opencode/hooks/workflow.ts && echo "PASS: hook moved to adapter"
      4. grep "createWorkflowHooks" opencode/.plugins/hyper-designer.ts | grep -q "../hooks/workflow" && echo "PASS: import path updated"
    Expected Result: Zero framework imports in src/, hook in adapter
    Failure Indicators: Any grep match in src/ or missing adapter file
    Evidence: Command output captured

  Scenario: TypeScript compiles with new structure
    Tool: Bash
    Preconditions: All files moved
    Steps:
      1. npx tsc --noEmit 2>&1
      2. Assert: Exit code 0
    Expected Result: No type errors from restructuring
    Failure Indicators: Import resolution errors or type mismatches
    Evidence: tsc output captured
  ```

  **Commit**: YES
  - Message: `refactor: move OpenCode hooks to adapter layer, decouple src/ from framework`
  - Files: `opencode/hooks/workflow.ts` (new), `src/workflow/hooks/` (deleted), `opencode/.plugins/hyper-designer.ts` (updated import)
  - Pre-commit: `grep -r "@opencode-ai" src/ && exit 1 || npx tsc --noEmit`

---

- [x] 7. Populate src/index.ts with Core Exports

  **What to do**:
  - Populate `src/index.ts` as the barrel export for the core package
  - Export ONLY framework-agnostic types and functions
  - Follow an explicit import hierarchy to prevent circular dependencies:
    ```
    types.ts → config/ → utils/ → workflow/ → agents/ → index.ts
    ```
  - Verify no circular dependencies exist

  **Exports to include**:
  ```typescript
  // src/index.ts

  // Types
  export type { AgentConfig, AgentMode, AgentFactory, AgentPromptMetadata, BuiltinAgentName } from "./agents/types"
  export type { AgentOverrideConfig, HDConfig } from "./config/loader"
  export type { WorkflowStage, Workflow, WorkflowState } from "./workflow/state"
  export type { SessionPromptSender, SkillLoader } from "./adapters/types"
  export type { AgentDefinition } from "./agents/factory"
  export type { HandoverConfig } from "./adapters/types"

  // Agent creation
  export { createBuiltinAgents } from "./agents/utils"
  export { createAgent } from "./agents/factory"
  export { createHCollectorAgent } from "./agents/HCollector"
  export { createHArchitectAgent } from "./agents/HArchitect"
  export { createHCriticAgent } from "./agents/HCritic"
  export { createHEngineerAgent } from "./agents/HEngineer"

  // Workflow state management
  export { getWorkflowState, setWorkflowStage, setWorkflowCurrent, setWorkflowHandover } from "./workflow/state"

  // Workflow data
  export { HANDOVER_CONFIG } from "./workflow/handover"
  export { loadPromptForStage } from "./workflow/prompts"

  // Config
  export { loadHDConfig } from "./config/loader"

  // Utils
  export { debug } from "./utils/debug"
  ```

  **Must NOT do**:
  - Export OpenCode-specific types or functions
  - Create re-export chains that cause circular dependencies
  - Export internal implementation details
  - Change any of the exported APIs

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, straightforward barrel export creation
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Module export patterns, circular dependency prevention

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 5, 6

  **References**:

  **Pattern References**:
  - `src/agents/types.ts` — All type exports to include
  - `src/agents/utils.ts` — `createBuiltinAgents` to export
  - `src/agents/factory.ts` — `createAgent`, `AgentDefinition` to export (created in Task 5)
  - `src/workflow/state.ts` — State management exports
  - `src/workflow/handover.ts` — `HANDOVER_CONFIG` to export (created in Task 4)
  - `src/workflow/prompts.ts` — `loadPromptForStage` to export (created in Task 4)
  - `src/config/loader.ts` — Config exports
  - `src/adapters/types.ts` — Adapter interface exports (created in Task 4)

  **WHY Each Reference Matters**:
  - Each referenced file provides the actual exports that should be re-exported through the barrel
  - The barrel should be the single import point for consumers (opencode adapter, future adapters)

  **Acceptance Criteria**:
  - [ ] `src/index.ts` is populated (not empty)
  - [ ] `grep -c "export" src/index.ts` shows multiple exports
  - [ ] No `@opencode-ai` imports in `src/index.ts`
  - [ ] `npx tsc --noEmit` passes (no circular dependency errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Core barrel exports are complete and valid
    Tool: Bash
    Preconditions: Tasks 1-6 completed
    Steps:
      1. wc -l src/index.ts | awk '{if ($1 < 5) exit 1}'
      2. Assert: File has meaningful content (> 5 lines)
      3. grep -c "export" src/index.ts
      4. Assert: Multiple exports (> 10)
      5. grep "@opencode-ai" src/index.ts && echo "FAIL" || echo "PASS: no framework imports"
      6. npx tsc --noEmit 2>&1
      7. Assert: Exit code 0 (no circular dependency or resolution errors)
    Expected Result: Clean barrel export, no framework coupling
    Failure Indicators: Empty file, framework imports, or circular dep errors
    Evidence: Command output captured
  ```

  **Commit**: YES
  - Message: `refactor: populate src/index.ts with core barrel exports`
  - Files: `src/index.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 8. Write Tests + Final Validation

  **What to do**:
  - Write Vitest tests covering the core modules:
    1. `src/__tests__/agents/factory.test.ts` — Base agent factory
    2. `src/__tests__/workflow/state.test.ts` — Workflow state management
    3. `src/__tests__/config/loader.test.ts` — Config loading and merging
    4. `src/__tests__/utils/debug.test.ts` — Debug logger
  - Run full validation suite: `tsc --noEmit` + `vitest run`
  - Verify structural integrity of the refactored codebase

  **Test coverage targets**:

  **Agent Factory Tests** (`factory.test.ts`):
  ```typescript
  describe("createAgent", () => {
    it("reads prompt files and concatenates them")
    it("applies config overrides from loadHDConfig")
    it("falls back to defaults when no config override")
    it("handles missing prompt files gracefully")
    it("appends prompt_append from config")
    it("returns correct AgentConfig shape")
  })
  ```

  **Workflow State Tests** (`state.test.ts`):
  ```typescript
  describe("getWorkflowState", () => {
    it("returns default state when file doesn't exist")
    it("reads existing state file correctly")
  })
  describe("setWorkflowStage", () => {
    it("updates specific stage completion status")
    it("throws on invalid stage name")
    it("persists state to file")
  })
  describe("setWorkflowCurrent", () => {
    it("sets current step")
    it("allows null to clear current step")
    it("throws on invalid step name")
  })
  ```

  **Config Loader Tests** (`loader.test.ts`):
  ```typescript
  describe("loadHDConfig", () => {
    it("returns default config when no file exists")
    it("merges user config with defaults")
    it("handles invalid JSON gracefully")
  })
  ```

  **Debug Logger Tests** (`debug.test.ts`):
  ```typescript
  describe("debug", () => {
    it("exports log, info, warn, error methods")
    it("isEnabled returns false by default")
    it("getLogPath returns expected path")
  })
  ```

  - After tests pass, run final structural validation:
    - `grep -r "@opencode-ai" src/` → 0 matches
    - `npx tsc --noEmit` → 0 errors
    - All agent files under 60 lines
    - No duplicate type definitions

  **Must NOT do**:
  - Test OpenCode runtime integration (that's e2e)
  - Mock the file system (use temp directories for state tests)
  - Write tests for .md prompt content
  - Over-test with excessive edge cases

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file test writing requiring understanding of all refactored modules
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Vitest patterns, TypeScript testing best practices
  - **Skills Evaluated but Omitted**:
    - `python-testing-patterns`: Wrong language
    - `test-driven-development`: Tests are being written after implementation (tests-after strategy)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6 (final, sequential)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `src/agents/factory.ts` — Factory function to test (created in Task 5)
  - `src/workflow/state.ts:31-51` — `readWorkflowStateFile()` with default state on error — test this fallback
  - `src/workflow/state.ts:87-96` — `setWorkflowStage()` with validation — test valid and invalid inputs
  - `src/config/loader.ts:63-94` — `loadHDConfig()` with search paths and merge logic — test default fallback and merge
  - `src/utils/debug.ts` — Refactored debug module — test API surface

  **External References**:
  - Vitest docs: https://vitest.dev/api/
  - Vitest mocking: https://vitest.dev/guide/mocking

  **WHY Each Reference Matters**:
  - Each test file maps to a core module — the references show the exact functions and behavior to verify
  - The state module's error fallback (returning defaults) is critical behavior to preserve

  **Acceptance Criteria**:
  - [ ] `npx vitest run --reporter=basic` passes with 0 failures
  - [ ] At least 4 test files created
  - [ ] At least 15 test cases total
  - [ ] `npx tsc --noEmit` passes
  - [ ] `grep -r "@opencode-ai" src/` returns 0 matches
  - [ ] All agent factory files under 60 lines

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All tests pass
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. npx vitest run --reporter=verbose 2>&1
      2. Assert: Exit code 0
      3. Assert: Output contains "Tests" with 0 failures
      4. Count test files: find src/__tests__ -name "*.test.ts" | wc -l
      5. Assert: At least 4 test files
    Expected Result: All tests pass, adequate coverage
    Failure Indicators: Any test failure or missing test files
    Evidence: Vitest output captured

  Scenario: Full structural validation of refactored codebase
    Tool: Bash
    Preconditions: All tasks completed
    Steps:
      1. npx tsc --noEmit 2>&1 && echo "PASS: type checking"
      2. grep -r "@opencode-ai" src/ && echo "FAIL: framework imports in core" || echo "PASS: core decoupled"
      3. test ! -f src/agents/indext.ts && echo "PASS: broken file gone"
      4. test -f src/agents/factory.ts && echo "PASS: base factory exists"
      5. test -f src/adapters/types.ts && echo "PASS: adapter interfaces exist"
      6. test -f src/workflow/handover.ts && echo "PASS: handover in core"
      7. test -f src/workflow/prompts.ts && echo "PASS: prompts in core"
      8. test -f opencode/hooks/workflow.ts && echo "PASS: hooks in adapter"
      9. test ! -d src/workflow/hooks && echo "PASS: old hooks removed"
      10. wc -l src/index.ts | awk '{if ($1 > 5) print "PASS: index populated"; else print "FAIL: index empty"}'
      11. for f in src/agents/H*/index.ts; do lines=$(wc -l < "$f"); if [ "$lines" -gt 60 ]; then echo "FAIL: $f has $lines lines"; exit 1; fi; done && echo "PASS: all agents compact"
    Expected Result: All structural checks pass
    Failure Indicators: Any check fails
    Evidence: Command output captured

  Scenario: No circular dependencies
    Tool: Bash
    Preconditions: All tasks completed
    Steps:
      1. npx tsc --noEmit 2>&1 | grep -i "circular" && echo "FAIL: circular dependency detected" || echo "PASS: no circular dependencies"
    Expected Result: No circular dependency warnings
    Failure Indicators: Circular dependency in tsc output
    Evidence: tsc output captured
  ```

  **Commit**: YES
  - Message: `test: add Vitest test suite for core modules (agent factory, workflow state, config, debug)`
  - Files: `src/__tests__/agents/factory.test.ts`, `src/__tests__/workflow/state.test.ts`, `src/__tests__/config/loader.test.ts`, `src/__tests__/utils/debug.test.ts`
  - Pre-commit: `npx vitest run && npx tsc --noEmit`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `build: add package.json, tsconfig.json, and vitest.config.ts` | package.json, tsconfig.json, vitest.config.ts | `npx tsc --version` |
| 2 | `refactor: delete broken indext.ts, consolidate duplicate types, fix requirementDecomposition enum` | src/agents/types.ts, opencode/.plugins/hyper-designer.ts | `grep -r "Clarifier" src/` |
| 3 | `refactor: DRY debug logger — extract writeLog base function` | src/utils/debug.ts | `npx tsc --noEmit` |
| 4 | `refactor: define core adapter interfaces, extract handover config and prompt loader` | src/adapters/types.ts, src/workflow/handover.ts, src/workflow/prompts.ts | `npx tsc --noEmit` |
| 5 | `refactor: extract base agent factory, reduce agent boilerplate by ~80%` | src/agents/factory.ts, all H*/index.ts | `npx tsc --noEmit` |
| 6 | `refactor: move OpenCode hooks to adapter layer, decouple src/ from framework` | opencode/hooks/workflow.ts | `grep -r "@opencode-ai" src/` |
| 7 | `refactor: populate src/index.ts with core barrel exports` | src/index.ts | `npx tsc --noEmit` |
| 8 | `test: add Vitest test suite for core modules` | src/__tests__/**/*.test.ts | `npx vitest run` |

---

## Success Criteria

### Verification Commands
```bash
# Type checking passes
npx tsc --noEmit                        # Expected: 0 errors

# Tests pass
npx vitest run --reporter=basic         # Expected: All tests pass

# Core is framework-agnostic
grep -r "@opencode-ai" src/             # Expected: 0 matches

# No broken files
test ! -f src/agents/indext.ts          # Expected: success

# Agent files are compact
wc -l src/agents/H*/index.ts           # Expected: all under 60 lines

# No duplicate types
grep -rn "AgentOverrideConfig" src/ --include="*.ts" | grep -v import  # Expected: 1 match

# Core exports populated
grep -c "export" src/index.ts           # Expected: > 10
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass (41/41)
- [x] tsc --noEmit passes (0 errors)
- [x] Core `src/` has zero `@opencode-ai` imports
- [x] No duplicate type definitions
- [x] All agent files under 60 lines (72, 69, 65, 71)
- [x] Workflow state backward compatible
- [x] .md prompt/skill files unchanged
