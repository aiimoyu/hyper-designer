# Deep Decoupling: Frontend Tool Abstraction + Workflow Abstraction

## TL;DR

> **Quick Summary**: Decouple hyper-designer in two dimensions — (1) extract all tool-specific syntax from agent/workflow/skill `.md` files into replaceable `{{TOOL:name}}` placeholders resolved at runtime per frontend, and (2) abstract the workflow system so multiple workflow types (traditional, future custom) coexist as TypeScript modules selected via config.
>
> **Deliverables**:
> - Prompt template engine with `{{TOOL:name}}` placeholder resolution
> - Tool registry per frontend (OpenCode initially, extensible)
> - All `.md` prompt files converted to use placeholders (agents + workflow prompts)
> - `WorkflowDefinition` interface and workflow module system
> - "Traditional" workflow extracted to `src/workflows/traditional/`
> - Dynamic workflow loading, state management, and handover driven by active workflow
> - Config extension: `hd-config.json` gains `workflow` field (default: `"traditional"`)
> - Updated tests (existing 41 pass + new tests for resolver and workflow abstraction)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 5 → Task 7 → Task 8 → Task 9

---

## Context

### Original Request

用户希望框架更加解耦：
1. 工具使用提示词需要抽象化（不同前端如OpenCode/Claude Code工具语法不同）
2. 工作流需要抽象化（可能有多种工作流，通过config选择）

### Interview Summary

**Key Discussions**:
- Placeholder markers `{{TOOL:name}}`: User confirmed this approach for tool abstraction in .md files
- TypeScript modules per workflow: User wants each workflow as a .ts module, config only specifies which workflow name to use
- Backward-compatible config: Add `workflow` field to existing `hd-config.json`, default to `"traditional"`
- Previous refactor (ts-refactor-decouple) completed: src/ is framework-agnostic, 41 Vitest tests pass

**Research Findings**:
- Tool coupling exists in: 4 agent identity `.md` files, 2 agent interview_mode `.md` files, 8 workflow prompt `.md` files
- Specific tool patterns: `task({...})`, `question({...})`, `todowrite([...])`, `set_hd_workflow_handover("...")`, `task(subagent_type="explore")`, `task(subagent_type="librarian")`, `delegate_task(subagent_type="HCritic", ...)`, `Glob`, `LS`, `Write`, `Edit`, `webfetch/websearch`
- Workflow coupling: `Workflow` interface hardcodes 8 stages, `HANDOVER_CONFIG` hardcodes agent assignments, `WORKFLOW_STEPS` hardcodes stage order, `loadPromptForStage()` hardcodes stage-to-file mapping
- Skills (20 `.md` files under `src/skills/`) are primarily domain knowledge with minimal tool coupling — EXCLUDED from placeholder conversion (scope decision)

### Metis Review

**Identified Gaps** (addressed):
- Skills scope: EXCLUDED from placeholder conversion (domain knowledge, not tool instructions). Skills that mention `delegate_task` are workflow prompts, not skills themselves.
- Workflow state migration: Default state created from active workflow definition. Switching workflows resets state (new workflow = new project).
- Tool registry location: TypeScript const in `src/prompts/toolRegistries/opencode.ts` — one file per frontend
- Workflow discovery: Explicit registry in `src/workflows/registry.ts` mapping names to module imports
- Missing placeholder = fail-fast error at agent creation time (not silent)
- Placeholders are static single-line replacements only (multi-line tool blocks are the REPLACEMENT content, not the placeholder)

---

## Work Objectives

### Core Objective
Make agent prompts frontend-agnostic via `{{TOOL:name}}` placeholders, and make the workflow system pluggable via TypeScript workflow modules selected by config.

### Concrete Deliverables
- `src/prompts/resolver.ts` — PromptResolver that finds and replaces `{{TOOL:*}}` placeholders
- `src/prompts/types.ts` — ToolRegistry type definitions
- `src/prompts/toolRegistries/opencode.ts` — OpenCode tool syntax registry
- All agent `.md` files converted to use `{{TOOL:*}}` placeholders (6 files)
- All workflow prompt `.md` files converted to use `{{TOOL:*}}` placeholders (8 files)
- `src/workflows/types.ts` — `WorkflowDefinition` interface
- `src/workflows/traditional/index.ts` — Traditional workflow module
- `src/workflows/traditional/prompts/*.md` — Moved workflow prompt files
- `src/workflows/registry.ts` — Workflow registry
- Updated `src/workflow/state.ts` — Generic workflow state driven by `WorkflowDefinition`
- Updated `src/workflow/handover.ts` — Handover config from workflow definition
- Updated `src/agents/factory.ts` — Calls PromptResolver
- Updated `hd-config.json` and schema — `workflow` field
- Updated `opencode/hooks/workflow.ts` — Uses dynamic workflow
- New Vitest tests for PromptResolver, workflow modules, integration

### Definition of Done
- [x] `npm test` (or `bun run test`) — all existing 41 tests pass + new tests pass
- [x] `grep -rn 'task({' src/agents/*/*.md` returns 0 matches (no hardcoded tool syntax in agents)
- [x] `grep -rn 'delegate_task(' src/workflows/traditional/prompts/*.md` returns 0 matches
- [x] `grep -rn '{{TOOL:' src/agents/*/*.md` returns >0 matches (placeholders exist)
- [x] New workflow can be added by creating a new directory under `src/workflows/` without modifying core code

### Must Have
- All agent `.md` files use `{{TOOL:*}}` placeholders instead of hardcoded tool syntax
- All workflow prompt `.md` files use `{{TOOL:*}}` placeholders
- PromptResolver fails fast with clear error when a placeholder has no registry entry
- `WorkflowDefinition` interface captures: stages, ordering, agent assignments, prompt files
- Traditional workflow fully extracted to its own module
- `hd-config.json` supports `workflow` field, defaults to `"traditional"`
- Backward compatibility: existing configs without `workflow` field work (default traditional)
- All 41 existing tests pass unchanged

### Must NOT Have (Guardrails)
- ❌ DO NOT convert skill `.md` files to use placeholders (skills are domain knowledge, out of scope)
- ❌ DO NOT create new workflow types beyond "traditional" (future work)
- ❌ DO NOT change agent behavior or domain logic in `.md` files
- ❌ DO NOT add new features (UI, analytics, validation beyond what's specified)
- ❌ DO NOT modify `.hyper-designer/workflow_state.json` format in breaking ways
- ❌ DO NOT add runtime dependencies (devDependencies only)
- ❌ DO NOT use path aliases in tsconfig.json
- ❌ DO NOT add handlebars/mustache or other template engine dependencies — use simple string replacement
- ❌ DO NOT make skills frontend-specific (they remain pure domain knowledge)
- ❌ DO NOT refactor unrelated code (adapter implementations, debug logger, etc.)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Vitest from previous refactor)
- **Automated tests**: YES (Tests-after — verify each component after implementation)
- **Framework**: Vitest (`npm test`)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| TypeScript modules | Bash (`npm test`) | Run test suites, assert pass |
| `.md` file conversions | Bash (`grep`) | Search for hardcoded vs placeholder patterns |
| Config changes | Bash (`node -e "..."`) | Load and validate config |
| Integration | Bash (`npm test`) | End-to-end test suites |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: PromptResolver + ToolRegistry (no dependencies)
├── Task 4: WorkflowDefinition interface + types (no dependencies)
└── Task 6: Config extension (no dependencies)

Wave 2 (After Wave 1):
├── Task 2: Convert agent .md files to placeholders (depends: 1)
├── Task 3: Convert workflow prompt .md files to placeholders (depends: 1)
├── Task 5: Extract traditional workflow module (depends: 4)
└── Task 7: Genericize workflow state.ts (depends: 4, 5)

Wave 3 (After Wave 2):
├── Task 8: Update agent factory to use PromptResolver (depends: 1, 2, 3)
├── Task 9: Update handover + OpenCode hooks (depends: 5, 7)
└── Task 10: Integration tests + regression (depends: all)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 8 | 4, 6 |
| 2 | 1 | 8 | 3, 5, 7 |
| 3 | 1 | 8 | 2, 5, 7 |
| 4 | None | 5, 7 | 1, 6 |
| 5 | 4 | 7, 9 | 2, 3 |
| 6 | None | 10 | 1, 4 |
| 7 | 4, 5 | 9 | 2, 3 |
| 8 | 1, 2, 3 | 10 | 9 |
| 9 | 5, 7 | 10 | 8 |
| 10 | All | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 4, 6 | 3× `task(category="quick")` in parallel |
| 2 | 2, 3, 5, 7 | 4× `task(category="unspecified-high")` in parallel |
| 3 | 8, 9, 10 | 2× `task(category="quick")` + 1× `task(category="unspecified-high")` |

---

## TODOs

- [x] 1. Create PromptResolver and Tool Registry System

  **What to do**:
  - Create `src/prompts/types.ts` with:
    - `ToolRegistry` type: `Record<string, string>` mapping tool placeholder names to replacement text
    - `PromptResolverConfig` interface: `{ toolRegistry: ToolRegistry }`
  - Create `src/prompts/resolver.ts` with:
    - `resolvePrompt(prompt: string, registry: ToolRegistry): string` function
    - Regex pattern: `/\{\{TOOL:([a-z_]+)\}\}/g`
    - For each match: look up the tool name in the registry
    - If found: replace with registry value
    - If NOT found: throw `Error("Unknown tool placeholder: {{TOOL:${name}}}. Available tools: ${Object.keys(registry).join(', ')}")`
    - Return fully resolved prompt string
  - Create `src/prompts/toolRegistries/opencode.ts` with OpenCode-specific tool syntax:
    - Export `OPENCODE_TOOL_REGISTRY: ToolRegistry` containing all tool replacement strings
    - Tool entries (based on analysis of all agent .md files):
      - `ask_user` → The `question({questions: [{...}]})` syntax block with format example
      - `create_todos` → The `todowrite([{id, content, status, priority}])` syntax
      - `delegate_review` → The `task({category: "quick", load_skills: [], run_in_background: false, description: "...", prompt: "..."})` syntax for HCritic delegation
      - `delegate_explore` → The `task({subagent_type: "explore", ...})` syntax
      - `delegate_librarian` → The `task({subagent_type: "librarian", ...})` syntax
      - `workflow_handover` → The `set_hd_workflow_handover("阶段名")` syntax
      - `workflow_get_state` → The `get_hd_workflow_state` syntax
      - `delegate_critic_review` → The `delegate_task(subagent_type="HCritic", load_skills=[], ...)` syntax used in workflow prompt files
  - Update `src/index.ts` to export `resolvePrompt` and `OPENCODE_TOOL_REGISTRY`

  **Must NOT do**:
  - ❌ Do NOT add handlebars/mustache dependencies
  - ❌ Do NOT support multi-line placeholder syntax (placeholders are single-line `{{TOOL:name}}`)
  - ❌ Do NOT support parameterized placeholders (the replacement text is static per frontend)
  - ❌ Do NOT modify any existing files except `src/index.ts` (adding exports)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, focused TypeScript module creation with clear interface
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Type system design for ToolRegistry and PromptResolver

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 4, 6)
  - **Blocks**: Tasks 2, 3, 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/agents/factory.ts:44-53` — Current prompt loading pattern (where PromptResolver will be integrated later in Task 8)
  - `src/adapters/types.ts` — Existing adapter type pattern to follow for interface design

  **API/Type References**:
  - `src/agents/types.ts` — Existing type patterns (AgentConfig, AgentMode) to follow for naming conventions

  **Tool coupling analysis** (what needs registry entries — scan these to build the registry):
  - `src/agents/HArchitect/identity_constraints.md:96-109` — `question({...})` syntax (→ `ask_user`)
  - `src/agents/HArchitect/identity_constraints.md:203-219` — `task({category: "quick", ...})` for HCritic (→ `delegate_review`)
  - `src/agents/HArchitect/identity_constraints.md:143` — `set_hd_workflow_handover(...)` (→ `workflow_handover`)
  - `src/agents/HCollector/identity_constraints.md:118-130` — `question({...})` syntax (→ `ask_user`)
  - `src/agents/HCollector/identity_constraints.md:152-164` — `task({category: "quick", ...})` for librarian (→ `delegate_librarian`)
  - `src/agents/HCollector/identity_constraints.md:262-270` — `task({subagent_type: "explore", ...})` (→ `delegate_explore`)
  - `src/agents/HCollector/identity_constraints.md:317-325` — `task({subagent_type: "librarian", ...})` (→ `delegate_librarian`)
  - `src/workflow/prompts/dataCollection.md:20` — `delegate_task(subagent_type="HCritic", ...)` (→ `delegate_critic_review`)
  - `src/workflow/prompts/IRAnalysis.md:15` — `delegate_task(subagent_type="HCritic", ...)` (→ `delegate_critic_review`)

  **Acceptance Criteria**:

  - [ ] File `src/prompts/types.ts` exists with `ToolRegistry` type exported
  - [ ] File `src/prompts/resolver.ts` exists with `resolvePrompt()` function exported
  - [ ] File `src/prompts/toolRegistries/opencode.ts` exists with `OPENCODE_TOOL_REGISTRY` exported
  - [ ] `src/index.ts` exports `resolvePrompt` and `OPENCODE_TOOL_REGISTRY`
  - [ ] `npm test` — existing 41 tests still pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: PromptResolver replaces known placeholders
    Tool: Bash (npm test)
    Preconditions: Test file created at src/__tests__/prompts/resolver.test.ts
    Steps:
      1. Write test: resolvePrompt("Use {{TOOL:ask_user}} to confirm", registry) → contains "question("
      2. Write test: resolvePrompt("No placeholders here", registry) → returns unchanged
      3. Write test: resolvePrompt("{{TOOL:unknown_tool}}", registry) → throws Error with "Unknown tool placeholder"
      4. Run: npm test src/__tests__/prompts/resolver.test.ts
    Expected Result: All 3+ tests pass
    Evidence: Terminal output captured

  Scenario: OPENCODE_TOOL_REGISTRY has all required entries
    Tool: Bash (npm test)
    Preconditions: Test file at src/__tests__/prompts/toolRegistries/opencode.test.ts
    Steps:
      1. Write test: registry has keys "ask_user", "create_todos", "delegate_review", "delegate_explore", "delegate_librarian", "workflow_handover", "workflow_get_state", "delegate_critic_review"
      2. Write test: each value is non-empty string
      3. Run: npm test src/__tests__/prompts/toolRegistries/opencode.test.ts
    Expected Result: All tests pass
    Evidence: Terminal output captured

  Scenario: Existing tests unaffected
    Tool: Bash (npm test)
    Preconditions: No existing test files modified
    Steps:
      1. Run: npm test
    Expected Result: 41 tests pass (no regressions)
    Evidence: Terminal output shows "41 tests passed"
  ```

  **Commit**: YES
  - Message: `feat(prompts): add PromptResolver and OpenCode tool registry`
  - Files: `src/prompts/types.ts`, `src/prompts/resolver.ts`, `src/prompts/toolRegistries/opencode.ts`, `src/index.ts`, `src/__tests__/prompts/resolver.test.ts`, `src/__tests__/prompts/toolRegistries/opencode.test.ts`
  - Pre-commit: `npm test`

---

- [x] 2. Convert Agent `.md` Files to Use `{{TOOL:*}}` Placeholders

  **What to do**:
  - Convert all tool-coupled syntax in the following 6 agent `.md` files to `{{TOOL:*}}` placeholders:
    1. `src/agents/HArchitect/identity_constraints.md` (323 lines)
    2. `src/agents/HArchitect/interview_mode.md` (765 lines)
    3. `src/agents/HCollector/identity_constraints.md` (549 lines)
    4. `src/agents/HCollector/interview_mode.md`
    5. `src/agents/HEngineer/identity_constraints.md`
    6. `src/agents/HEngineer/interview_mode.md`
    7. `src/agents/HCritic/identity_constraints.md`
  - Conversion rules:
    - `question({...})` code blocks → `{{TOOL:ask_user}}`
    - `todowrite([...])` references → `{{TOOL:create_todos}}`
    - `task({category: "quick", ...})` for HCritic → `{{TOOL:delegate_review}}`
    - `task({subagent_type: "explore", ...})` → `{{TOOL:delegate_explore}}`
    - `task({subagent_type: "librarian", ...})` → `{{TOOL:delegate_librarian}}`
    - `set_hd_workflow_handover("...")` → `{{TOOL:workflow_handover}}`
    - `get_hd_workflow_state` → `{{TOOL:workflow_get_state}}`
  - **IMPORTANT**: Each `{{TOOL:name}}` placeholder replaces the ENTIRE code block including the surrounding backticks. The replacement text in the registry includes the code block formatting.
  - **IMPORTANT**: Preserve ALL non-tool content exactly as-is (Chinese text, domain logic, workflow descriptions, directory structures, tables)
  - **IMPORTANT**: Some `.md` files reference tools by name in prose (e.g., "使用Question工具确认"). These prose references should ALSO use placeholders where they describe HOW to use the tool. Simple name mentions ("Question工具") can stay as-is — only the syntax examples and code blocks need conversion.

  **Must NOT do**:
  - ❌ Do NOT change any domain logic, workflow descriptions, or behavioral rules
  - ❌ Do NOT modify the file structure or section headings
  - ❌ Do NOT add new content or remove existing content (beyond the tool syntax replacement)
  - ❌ Do NOT touch HCritic's `.md` file if it has no tool syntax (verify first)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Careful text editing across 6-7 large files, needs precision to preserve Chinese text and domain logic
  - **Skills**: []
    - No special skills needed — this is careful find-and-replace editing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1 (need to know exact placeholder names from tool registry)

  **References**:

  **Pattern References**:
  - `src/prompts/toolRegistries/opencode.ts` (from Task 1) — The exact placeholder names to use and what they resolve to
  - `src/prompts/resolver.ts` (from Task 1) — The `{{TOOL:name}}` regex pattern

  **Files to Convert** (read ALL before editing):
  - `src/agents/HArchitect/identity_constraints.md` — Lines 96-109 (question syntax), 143 (workflow_handover), 203-219 (task for HCritic), 262-270 (explore)
  - `src/agents/HArchitect/interview_mode.md` — Full file, check for question/task/todowrite patterns
  - `src/agents/HCollector/identity_constraints.md` — Lines 118-130 (question), 152-164 (librarian task), 236-238 (workflow_handover), 262-270 (explore task), 317-325 (librarian task), 516-523 (tool strategy section)
  - `src/agents/HCollector/interview_mode.md` — Check for tool patterns
  - `src/agents/HEngineer/identity_constraints.md` — Check for tool patterns
  - `src/agents/HEngineer/interview_mode.md` — Check for tool patterns
  - `src/agents/HCritic/identity_constraints.md` — Check for tool patterns (may have none)

  **Acceptance Criteria**:

  - [ ] `grep -rn 'task({' src/agents/*/*.md | grep -v '{{TOOL'` returns 0 matches
  - [ ] `grep -rn 'question({' src/agents/*/*.md | grep -v '{{TOOL'` returns 0 matches
  - [ ] `grep -rn 'todowrite(' src/agents/*/*.md | grep -v '{{TOOL'` returns 0 matches
  - [ ] `grep -rn 'set_hd_workflow_handover' src/agents/*/*.md | grep -v '{{TOOL'` returns 0 matches
  - [ ] `grep -rn '{{TOOL:' src/agents/*/*.md` returns >0 matches (placeholders exist)
  - [ ] No Chinese text modified (domain content preserved)
  - [ ] `npm test` — existing 41 tests still pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: No hardcoded tool syntax remains in agent .md files
    Tool: Bash (grep)
    Preconditions: All agent .md files edited
    Steps:
      1. grep -rn 'task({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → assert 0
      2. grep -rn 'question({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → assert 0
      3. grep -rn 'todowrite(' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → assert 0
      4. grep -rn 'set_hd_workflow_handover(' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → assert 0
      5. grep -rn 'delegate_task(' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → assert 0
    Expected Result: All counts are 0
    Evidence: Terminal output captured

  Scenario: Placeholders are present in converted files
    Tool: Bash (grep)
    Preconditions: Files edited
    Steps:
      1. grep -c '{{TOOL:ask_user}}' src/agents/HArchitect/identity_constraints.md → assert >= 1
      2. grep -c '{{TOOL:delegate_review}}' src/agents/HArchitect/identity_constraints.md → assert >= 1
      3. grep -c '{{TOOL:workflow_handover}}' src/agents/HArchitect/identity_constraints.md → assert >= 1
      4. grep -c '{{TOOL:' src/agents/HCollector/identity_constraints.md → assert >= 3
    Expected Result: All assertions pass
    Evidence: Terminal output captured

  Scenario: Existing tests unaffected
    Tool: Bash (npm test)
    Steps:
      1. Run: npm test
    Expected Result: 41 tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `refactor(agents): convert agent prompts to {{TOOL:*}} placeholders`
  - Files: `src/agents/HArchitect/*.md`, `src/agents/HCollector/*.md`, `src/agents/HEngineer/*.md`, `src/agents/HCritic/*.md`
  - Pre-commit: `npm test`

---

- [x] 3. Convert Workflow Prompt `.md` Files to Use `{{TOOL:*}}` Placeholders

  **What to do**:
  - Convert tool-coupled syntax in the 8 workflow prompt files:
    1. `src/workflow/prompts/dataCollection.md`
    2. `src/workflow/prompts/IRAnalysis.md`
    3. `src/workflow/prompts/scenarioAnalysis.md`
    4. `src/workflow/prompts/useCaseAnalysis.md`
    5. `src/workflow/prompts/functionalRefinement.md`
    6. `src/workflow/prompts/requirementDecomposition.md`
    7. `src/workflow/prompts/systemFunctionalDesign.md`
    8. `src/workflow/prompts/moduleFunctionalDesign.md`
  - Main pattern to convert: `delegate_task(subagent_type="HCritic", load_skills=[], ...)` → `{{TOOL:delegate_critic_review}}`
  - Check each file for any other tool-specific syntax and convert

  **Must NOT do**:
  - ❌ Do NOT move these files yet (that happens in Task 5)
  - ❌ Do NOT change domain content or stage descriptions
  - ❌ Do NOT modify the "必须使用 Skill" references (those are domain, not tool)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 8 small files (~20 lines each), straightforward find-and-replace
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1 (need placeholder names)

  **References**:

  **Files to Convert** (read ALL):
  - `src/workflow/prompts/dataCollection.md:20` — `delegate_task(subagent_type="HCritic", ...)` → `{{TOOL:delegate_critic_review}}`
  - `src/workflow/prompts/IRAnalysis.md:15` — Same pattern
  - `src/workflow/prompts/scenarioAnalysis.md:15` — Same pattern
  - `src/workflow/prompts/useCaseAnalysis.md` — Check for pattern
  - `src/workflow/prompts/functionalRefinement.md:14` — Same pattern
  - `src/workflow/prompts/requirementDecomposition.md` — Check for pattern
  - `src/workflow/prompts/systemFunctionalDesign.md` — Check for pattern
  - `src/workflow/prompts/moduleFunctionalDesign.md` — Check for pattern

  **Acceptance Criteria**:

  - [ ] `grep -rn 'delegate_task(' src/workflow/prompts/*.md | grep -v '{{TOOL'` returns 0 matches
  - [ ] `grep -rn '{{TOOL:' src/workflow/prompts/*.md` returns >0 matches
  - [ ] `npm test` — 41 tests still pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: No hardcoded delegate_task in workflow prompts
    Tool: Bash (grep)
    Steps:
      1. grep -rn 'delegate_task(' src/workflow/prompts/*.md | grep -v '{{TOOL' | wc -l → assert 0
      2. grep -c '{{TOOL:delegate_critic_review}}' src/workflow/prompts/dataCollection.md → assert >= 1
      3. grep -c '{{TOOL:delegate_critic_review}}' src/workflow/prompts/IRAnalysis.md → assert >= 1
    Expected Result: All assertions pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `refactor(workflow): convert workflow prompts to {{TOOL:*}} placeholders`
  - Files: `src/workflow/prompts/*.md`
  - Pre-commit: `npm test`

---

- [x] 4. Define WorkflowDefinition Interface and Workflow Types

  **What to do**:
  - Create `src/workflows/types.ts` with:
    ```typescript
    export interface WorkflowStageDefinition {
      /** Display name for this stage */
      name: string
      /** Description of what this stage does */
      description: string
      /** Which agent handles this stage */
      agent: string
      /** Skill to load for this stage (skill name, not path) */
      skill?: string
      /** Prompt file path relative to the workflow directory */
      promptFile: string
      /** Handover prompt generator */
      getHandoverPrompt: (currentStep: string | null, nextStep: string) => string
    }

    export interface WorkflowDefinition {
      /** Unique workflow identifier */
      id: string
      /** Human-readable name */
      name: string
      /** Description */
      description: string
      /** Ordered list of stage keys */
      stageOrder: string[]
      /** Stage definitions keyed by stage name */
      stages: Record<string, WorkflowStageDefinition>
    }
    ```
  - Create `src/workflows/registry.ts` with:
    - `getWorkflowDefinition(workflowId: string): WorkflowDefinition` — Returns workflow by ID
    - `getAvailableWorkflows(): string[]` — Lists available workflow IDs
    - Internal registry using dynamic import or direct import for known workflows
    - Throws clear error for unknown workflow IDs
  - Update `src/index.ts` to export workflow types and registry

  **Must NOT do**:
  - ❌ Do NOT implement the traditional workflow here (that's Task 5)
  - ❌ Do NOT modify existing workflow state code yet (that's Task 7)
  - ❌ Do NOT add filesystem scanning for workflow discovery (use explicit registry)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Interface definition and simple registry, small focused work
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Interface design, type exports

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 6)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/adapters/types.ts` — Existing interface design pattern (HandoverConfig, SessionPromptSender)
  - `src/workflow/handover.ts:1-6` — Current HandoverConfig shape to capture in WorkflowStageDefinition
  - `src/workflow/state.ts:30-39` — Current WORKFLOW_STEPS array to capture in stageOrder

  **API/Type References**:
  - `src/workflow/state.ts:4-6` — Current WorkflowStage interface
  - `src/workflow/state.ts:8-17` — Current Workflow interface (8 hardcoded stages)

  **Acceptance Criteria**:

  - [ ] File `src/workflows/types.ts` exists with `WorkflowDefinition` and `WorkflowStageDefinition` exported
  - [ ] File `src/workflows/registry.ts` exists with `getWorkflowDefinition()` and `getAvailableWorkflows()` exported
  - [ ] Types compile without errors: `npx tsc --noEmit src/workflows/types.ts` (or equivalent check)
  - [ ] `npm test` — 41 tests still pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: WorkflowDefinition types compile and export correctly
    Tool: Bash (npm test)
    Preconditions: Test file at src/__tests__/workflows/types.test.ts
    Steps:
      1. Write test: WorkflowDefinition can be constructed with valid data
      2. Write test: getWorkflowDefinition("traditional") returns a WorkflowDefinition (after Task 5 adds it)
      3. Write test: getWorkflowDefinition("nonexistent") throws Error
      4. Write test: getAvailableWorkflows() returns string array
      5. Run: npm test src/__tests__/workflows/
    Expected Result: Tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(workflows): add WorkflowDefinition interface and workflow registry`
  - Files: `src/workflows/types.ts`, `src/workflows/registry.ts`, `src/index.ts`, `src/__tests__/workflows/types.test.ts`
  - Pre-commit: `npm test`

---

- [x] 5. Extract Traditional Workflow to Module

  **What to do**:
  - Create `src/workflows/traditional/index.ts` exporting a `WorkflowDefinition`:
    - `id: "traditional"`
    - `name: "Traditional Requirements Engineering"`
    - `stageOrder`: `["dataCollection", "IRAnalysis", "scenarioAnalysis", "useCaseAnalysis", "functionalRefinement", "requirementDecomposition", "systemFunctionalDesign", "moduleFunctionalDesign"]`
    - `stages`: Record with all 8 stages, each containing:
      - `agent`: From current `HANDOVER_CONFIG` (HCollector for dataCollection, HArchitect for IR/scenario/useCase/functional, HEngineer for requirementDecomposition/system/module)
      - `skill`: The skill name referenced in current workflow prompts (e.g., "ir-analysis" for IRAnalysis)
      - `promptFile`: The relative path to the prompt .md file
      - `getHandoverPrompt`: Migrated from current `HANDOVER_CONFIG[stage].getPrompt`
  - Copy workflow prompt `.md` files to `src/workflows/traditional/prompts/`:
    - Copy (not move) all 8 files from `src/workflow/prompts/` to `src/workflows/traditional/prompts/`
    - Keep originals in place for now (Task 7 will update references, Task 9 will clean up)
  - Register "traditional" in `src/workflows/registry.ts`

  **Must NOT do**:
  - ❌ Do NOT delete original `src/workflow/prompts/` files yet (backward compatibility during migration)
  - ❌ Do NOT modify `src/workflow/state.ts` yet (Task 7)
  - ❌ Do NOT modify `src/workflow/handover.ts` yet (Task 9)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Careful extraction from multiple source files, needs to preserve all handover prompts accurately
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Module structure, type conformance

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 7)
  - **Blocks**: Tasks 7, 9
  - **Blocked By**: Task 4 (needs WorkflowDefinition interface)

  **References**:

  **Pattern References**:
  - `src/workflow/handover.ts:1-65` — ALL handover config to migrate (agent assignments + getPrompt functions for all 8 stages)
  - `src/workflow/state.ts:30-39` — WORKFLOW_STEPS array (stage ordering)

  **API/Type References**:
  - `src/workflows/types.ts` (from Task 4) — WorkflowDefinition interface to implement

  **Files to Read and Extract From**:
  - `src/workflow/handover.ts` — All 8 stage configs with Chinese handover prompts
  - `src/workflow/prompts/*.md` — All 8 prompt files (already converted to placeholders in Task 3)
  - `src/workflow/state.ts:30-39` — Stage ordering

  **Acceptance Criteria**:

  - [ ] File `src/workflows/traditional/index.ts` exists and exports `WorkflowDefinition`
  - [ ] Directory `src/workflows/traditional/prompts/` contains all 8 `.md` files
  - [ ] `getWorkflowDefinition("traditional")` returns valid `WorkflowDefinition` with 8 stages
  - [ ] Each stage has: agent, promptFile, getHandoverPrompt
  - [ ] Stage order matches current `WORKFLOW_STEPS` array exactly
  - [ ] `npm test` — 41 tests still pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Traditional workflow module exports complete definition
    Tool: Bash (npm test)
    Preconditions: Test file at src/__tests__/workflows/traditional.test.ts
    Steps:
      1. Write test: traditional workflow has id "traditional"
      2. Write test: stageOrder has exactly 8 entries
      3. Write test: stageOrder[0] === "dataCollection", stageOrder[7] === "moduleFunctionalDesign"
      4. Write test: each stage in stageOrder exists in stages Record
      5. Write test: dataCollection.agent === "HCollector"
      6. Write test: IRAnalysis.agent === "HArchitect"
      7. Write test: requirementDecomposition.agent === "HEngineer"
      8. Write test: each stage.getHandoverPrompt(null, stageName) returns non-empty string
      9. Run: npm test src/__tests__/workflows/traditional.test.ts
    Expected Result: All tests pass
    Evidence: Terminal output captured

  Scenario: Prompt files exist in traditional workflow directory
    Tool: Bash (ls)
    Steps:
      1. ls src/workflows/traditional/prompts/ → assert 8 .md files present
      2. Compare filenames with src/workflow/prompts/ → assert same names
    Expected Result: All 8 files present with matching names
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(workflows): extract traditional workflow to dedicated module`
  - Files: `src/workflows/traditional/index.ts`, `src/workflows/traditional/prompts/*.md`, `src/workflows/registry.ts`
  - Pre-commit: `npm test`

---

- [x] 6. Extend Config Schema with Workflow Field

  **What to do**:
  - Update `schemas/hd-config.schema.json`:
    - Add `workflow` property: `{ "type": "string", "description": "Workflow type to use", "default": "traditional" }`
  - Update `src/config/loader.ts`:
    - Add `workflow` field to config type: `workflow?: string`
    - Default value: `"traditional"`
    - `loadHDConfig()` returns config with `workflow` field (defaults to "traditional" if not specified)
  - Update `hd-config.json` — add `"workflow": "traditional"` field
  - Update tests in `src/__tests__/config/loader.test.ts`:
    - Test that config without `workflow` field defaults to `"traditional"`
    - Test that config with `workflow: "custom"` returns "custom"

  **Must NOT do**:
  - ❌ Do NOT remove any existing config fields
  - ❌ Do NOT change config file search paths
  - ❌ Do NOT validate workflow name against registry here (that's integration, Task 9)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small config change, straightforward
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Type extension

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: Task 10
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/config/loader.ts` — Current config loading logic, `loadHDConfig()` function
  - `schemas/hd-config.schema.json` — Current JSON schema structure

  **API/Type References**:
  - `src/config/loader.ts` — `HDConfig` type and `DEFAULT_AGENT_CONFIGS`

  **Test References**:
  - `src/__tests__/config/loader.test.ts` — Existing test patterns to extend

  **Acceptance Criteria**:

  - [ ] `schemas/hd-config.schema.json` has `workflow` property with default `"traditional"`
  - [ ] `loadHDConfig()` returns `{ workflow: "traditional", agents: {...} }` when no workflow specified
  - [ ] `hd-config.json` includes `"workflow": "traditional"`
  - [ ] `npm test src/__tests__/config/loader.test.ts` passes with new tests

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Config defaults workflow to "traditional"
    Tool: Bash (npm test)
    Steps:
      1. npm test src/__tests__/config/loader.test.ts
    Expected Result: Tests pass including new workflow default test
    Evidence: Terminal output captured

  Scenario: hd-config.json is valid against schema
    Tool: Bash
    Steps:
      1. Read hd-config.json → assert "workflow" field exists
      2. Assert value is "traditional"
    Expected Result: Field present and correct
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(config): add workflow field to config schema (default: "traditional")`
  - Files: `schemas/hd-config.schema.json`, `src/config/loader.ts`, `hd-config.json`, `src/__tests__/config/loader.test.ts`
  - Pre-commit: `npm test`

---

- [x] 7. Genericize Workflow State Management

  **What to do**:
  - Update `src/workflow/state.ts`:
    - Remove hardcoded `Workflow` interface (8 specific stages)
    - Remove hardcoded `WORKFLOW_STEPS` array
    - Add `initializeWorkflowState(definition: WorkflowDefinition): WorkflowState` function that creates default state from a workflow definition
    - Make `WorkflowState.workflow` a `Record<string, WorkflowStage>` instead of the hardcoded `Workflow` type
    - `getWorkflowState()` → needs to accept or resolve the active `WorkflowDefinition` to create default state
    - Update `setWorkflowHandover()` to use `definition.stageOrder` instead of hardcoded `WORKFLOW_STEPS`
    - Update `executeWorkflowHandover()` similarly
    - Keep `setWorkflowStage()` and `setWorkflowCurrent()` generic (they already work with string keys)
    - Export `getStageOrder(definition: WorkflowDefinition): string[]` helper for code that needs the ordering
  - Update `src/__tests__/workflow/state.test.ts`:
    - Tests should still pass with the traditional workflow definition injected
    - Add tests for generic workflow state with different workflow definitions

  **Must NOT do**:
  - ❌ Do NOT change the JSON file format (`.hyper-designer/workflow_state.json`) — the schema stays the same, just the TypeScript types become generic
  - ❌ Do NOT break backward compatibility for reading existing state files
  - ❌ Do NOT remove `WORKFLOW_STEPS` export immediately if other files reference it — deprecate with a getter from the active workflow

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core state management refactoring, needs careful type changes and test updates
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Generic type refactoring, maintaining backward compatibility

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 4, 5 (needs WorkflowDefinition and traditional module)

  **References**:

  **Pattern References**:
  - `src/workflow/state.ts:1-192` — ENTIRE file is being refactored (read fully)

  **API/Type References**:
  - `src/workflows/types.ts` (from Task 4) — WorkflowDefinition interface
  - `src/workflows/traditional/index.ts` (from Task 5) — Traditional workflow for default

  **Test References**:
  - `src/__tests__/workflow/state.test.ts` — Existing tests that must continue to pass

  **Usage References** (find who calls these):
  - `src/workflow/state.ts:WORKFLOW_STEPS` — Used in handover validation logic
  - `opencode/hooks/workflow.ts` — Calls `getWorkflowState()` and `executeWorkflowHandover()`
  - `src/workflow/handover.ts` — Imports `Workflow` type

  **Acceptance Criteria**:

  - [ ] `Workflow` interface is no longer hardcoded to 8 stages
  - [ ] `WorkflowState.workflow` is `Record<string, WorkflowStage>`
  - [ ] `setWorkflowHandover()` uses workflow definition's stageOrder, not hardcoded array
  - [ ] Existing state files still load correctly
  - [ ] `npm test` — all workflow state tests pass (updated to inject traditional definition)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Generic workflow state works with traditional definition
    Tool: Bash (npm test)
    Steps:
      1. npm test src/__tests__/workflow/state.test.ts
    Expected Result: All existing tests pass (adapted to inject WorkflowDefinition)
    Evidence: Terminal output captured

  Scenario: Workflow state rejects unknown stages
    Tool: Bash (npm test)
    Preconditions: New test added
    Steps:
      1. Test: setWorkflowStage("nonExistentStage", true) → throws Error
      2. Run: npm test src/__tests__/workflow/state.test.ts
    Expected Result: Error thrown for invalid stage
    Evidence: Terminal output captured

  Scenario: Handover validation uses dynamic stage order
    Tool: Bash (npm test)
    Preconditions: New test added
    Steps:
      1. Test: Create custom WorkflowDefinition with 3 stages
      2. Test: setWorkflowHandover from stage 1 to stage 3 → throws (skip not allowed)
      3. Test: setWorkflowHandover from stage 1 to stage 2 → succeeds
      4. Run: npm test
    Expected Result: All tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `refactor(workflow): genericize state management for dynamic workflow definitions`
  - Files: `src/workflow/state.ts`, `src/__tests__/workflow/state.test.ts`
  - Pre-commit: `npm test`

---

- [x] 8. Update Agent Factory to Integrate PromptResolver

  **What to do**:
  - Update `src/agents/factory.ts`:
    - Import `resolvePrompt` from `../prompts/resolver`
    - Import `OPENCODE_TOOL_REGISTRY` from `../prompts/toolRegistries/opencode` (temporary default — in future, frontend adapter will provide the registry)
    - After concatenating prompt files (line 45-53), call `resolvePrompt(prompt, toolRegistry)` before returning
    - Add optional `toolRegistry?: ToolRegistry` parameter to `createAgent()` signature (defaults to `OPENCODE_TOOL_REGISTRY` for backward compatibility)
  - Update `src/__tests__/agents/factory.test.ts`:
    - Existing tests should still pass (default registry auto-resolves)
    - Add test: createAgent with `.md` containing `{{TOOL:ask_user}}` resolves to question syntax
    - Add test: createAgent with `.md` containing `{{TOOL:unknown}}` throws error
  - **IMPORTANT**: This task MUST run AFTER Tasks 1, 2, and 3 complete (factory needs both the resolver AND the converted .md files)

  **Must NOT do**:
  - ❌ Do NOT change agent behavior — prompt content after resolution must match what it was before conversion
  - ❌ Do NOT hardcode OpenCode as the only option — accept registry as parameter
  - ❌ Do NOT modify agent definition files (index.ts) — only factory.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, focused change to one file + test updates
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Function signature extension, type imports

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `src/agents/factory.ts:36-78` — Current `createAgent()` function (entire implementation)
  - `src/prompts/resolver.ts` (from Task 1) — `resolvePrompt()` function signature

  **API/Type References**:
  - `src/prompts/types.ts` (from Task 1) — `ToolRegistry` type
  - `src/prompts/toolRegistries/opencode.ts` (from Task 1) — `OPENCODE_TOOL_REGISTRY`

  **Test References**:
  - `src/__tests__/agents/factory.test.ts` — Existing factory tests to preserve

  **Acceptance Criteria**:

  - [ ] `createAgent()` accepts optional `toolRegistry` parameter
  - [ ] Default registry is `OPENCODE_TOOL_REGISTRY`
  - [ ] Prompts returned by `createAgent()` contain no `{{TOOL:*}}` placeholders (all resolved)
  - [ ] `npm test src/__tests__/agents/factory.test.ts` — all tests pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Factory resolves placeholders in agent prompts
    Tool: Bash (npm test)
    Steps:
      1. npm test src/__tests__/agents/factory.test.ts
    Expected Result: All tests pass including new resolution tests
    Evidence: Terminal output captured

  Scenario: Resolved prompts contain no raw placeholders
    Tool: Bash (npm test)
    Preconditions: New test added
    Steps:
      1. Test: Create agent with factory → prompt string does NOT match /\{\{TOOL:/
      2. Test: Create agent with factory → prompt string contains "question(" (resolved)
      3. Run: npm test
    Expected Result: Tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(factory): integrate PromptResolver into agent creation pipeline`
  - Files: `src/agents/factory.ts`, `src/__tests__/agents/factory.test.ts`
  - Pre-commit: `npm test`

---

- [x] 9. Update Handover, Prompt Loading, and OpenCode Hooks for Dynamic Workflows

  **What to do**:
  - Update `src/workflow/handover.ts`:
    - Remove static `HANDOVER_CONFIG` constant
    - Export `getHandoverConfig(definition: WorkflowDefinition): Record<string, HandoverConfig>` that builds handover config from a workflow definition
    - Or: Remove this file entirely if handover is now driven directly from `WorkflowDefinition.stages[stage].getHandoverPrompt` and `WorkflowDefinition.stages[stage].agent`
  - Update `src/workflow/prompts.ts`:
    - Remove hardcoded `promptMap` and `PROMPTS_DIR`
    - `loadPromptForStage(stage, definition: WorkflowDefinition): string` reads prompt file from the workflow module's directory using `definition.stages[stage].promptFile`
    - Apply `resolvePrompt()` to loaded content before returning
  - Update `opencode/hooks/workflow.ts`:
    - Import `getWorkflowDefinition` from workflow registry
    - Import `loadHDConfig` to get the active workflow name
    - On `session.idle` event: Use workflow definition's stage config to determine handover agent and prompt
    - On `experimental.chat.system.transform`: Use workflow definition to load correct stage prompt
  - Delete old `src/workflow/prompts/` directory (files now live in `src/workflows/traditional/prompts/`)
  - Update `src/index.ts` exports as needed

  **Must NOT do**:
  - ❌ Do NOT break the OpenCode hook API contract (same event names, same behavior)
  - ❌ Do NOT remove the `executeWorkflowHandover()` function (still needed by hooks)
  - ❌ Do NOT add Claude Code adapter in this task (future work)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple interconnected files, needs to understand hook system and workflow integration
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Module imports, async patterns, hook API

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 5, 7

  **References**:

  **Pattern References**:
  - `opencode/hooks/workflow.ts:1-58` — ENTIRE file (read fully, understand hook lifecycle)
  - `src/workflow/handover.ts:1-65` — ENTIRE file (being refactored/removed)
  - `src/workflow/prompts.ts:1-30` — ENTIRE file (being refactored)

  **API/Type References**:
  - `src/workflows/types.ts` (from Task 4) — WorkflowDefinition.stages[stage].agent, .getHandoverPrompt, .promptFile
  - `src/workflows/registry.ts` (from Task 4) — getWorkflowDefinition()
  - `src/config/loader.ts` (from Task 6) — loadHDConfig().workflow
  - `src/prompts/resolver.ts` (from Task 1) — resolvePrompt() for applying to loaded prompts

  **External References**:
  - OpenCode plugin API: `PluginInput`, `ctx.client.session.prompt()`, event types

  **Acceptance Criteria**:

  - [ ] `HANDOVER_CONFIG` static constant no longer exists (or is derived from workflow definition)
  - [ ] `loadPromptForStage()` accepts workflow definition and loads from workflow module directory
  - [ ] OpenCode hooks use workflow definition from config to determine agent and prompt
  - [ ] Old `src/workflow/prompts/` directory deleted (files in `src/workflows/traditional/prompts/`)
  - [ ] `npm test` — all tests pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Handover uses workflow definition
    Tool: Bash (npm test)
    Preconditions: Test file exists
    Steps:
      1. Test: getHandoverConfig with traditional definition returns config for all 8 stages
      2. Test: Each stage config has agent and getPrompt function
      3. Run: npm test
    Expected Result: Tests pass
    Evidence: Terminal output captured

  Scenario: Prompt loading resolves from workflow module directory
    Tool: Bash (npm test)
    Steps:
      1. Test: loadPromptForStage("dataCollection", traditionalDefinition) returns non-empty string
      2. Test: loaded prompt contains no {{TOOL:*}} placeholders (resolved)
      3. Run: npm test
    Expected Result: Tests pass
    Evidence: Terminal output captured

  Scenario: Old prompt directory cleaned up
    Tool: Bash (ls)
    Steps:
      1. ls src/workflow/prompts/ → should fail (directory deleted)
      2. ls src/workflows/traditional/prompts/ → should show 8 .md files
    Expected Result: Old dir gone, new dir has all files
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `refactor(workflow): dynamic handover and prompt loading from workflow definitions`
  - Files: `src/workflow/handover.ts`, `src/workflow/prompts.ts`, `opencode/hooks/workflow.ts`, `src/index.ts`
  - Pre-commit: `npm test`

---

- [x] 10. Integration Tests and Final Regression Verification

  **What to do**:
  - Create integration test file `src/__tests__/integration/decoupling.test.ts`:
    - Test: Full pipeline — load config → get workflow → create agent → verify resolved prompt
    - Test: Agent prompt contains NO `{{TOOL:*}}` placeholders after creation
    - Test: Agent prompt DOES contain OpenCode tool syntax (question, task, etc.)
    - Test: Workflow state lifecycle with traditional workflow definition
    - Test: Handover from dataCollection to IRAnalysis works end-to-end
    - Test: loadPromptForStage returns resolved content for each stage
    - Test: Config with missing `workflow` field defaults to "traditional"
  - Run full test suite: `npm test` — ALL tests must pass (original 41 + new tests)
  - Verify cleanup:
    - No hardcoded tool syntax in agent `.md` files
    - No hardcoded tool syntax in workflow prompt `.md` files
    - Old `src/workflow/prompts/` directory deleted
    - `HANDOVER_CONFIG` no longer static
    - `WORKFLOW_STEPS` no longer hardcoded

  **Must NOT do**:
  - ❌ Do NOT add Claude Code adapter tests (no Claude Code adapter exists yet)
  - ❌ Do NOT test skill loading (skills unchanged, out of scope)
  - ❌ Do NOT add performance benchmarks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration testing requires understanding all components together
  - **Skills**: [`typescript-expert`]
    - `typescript-expert`: Test architecture, Vitest patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final task)
  - **Blocked By**: All previous tasks (1-9)

  **References**:

  **All Previous Tasks' Outputs**:
  - `src/prompts/resolver.ts` (Task 1)
  - `src/prompts/toolRegistries/opencode.ts` (Task 1)
  - Agent `.md` files (Task 2)
  - Workflow prompt `.md` files (Task 3)
  - `src/workflows/types.ts` (Task 4)
  - `src/workflows/traditional/index.ts` (Task 5)
  - `src/config/loader.ts` (Task 6)
  - `src/workflow/state.ts` (Task 7)
  - `src/agents/factory.ts` (Task 8)
  - `opencode/hooks/workflow.ts` (Task 9)

  **Test References**:
  - `src/__tests__/agents/factory.test.ts` — Agent creation test patterns
  - `src/__tests__/workflow/state.test.ts` — Workflow state test patterns
  - `src/__tests__/config/loader.test.ts` — Config test patterns

  **Acceptance Criteria**:

  - [ ] `npm test` — ALL tests pass (original 41 + all new tests)
  - [ ] `grep -rn 'task({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l` → 0
  - [ ] `grep -rn 'question({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l` → 0
  - [ ] `grep -rn 'delegate_task(' src/workflows/traditional/prompts/*.md | grep -v '{{TOOL' | wc -l` → 0
  - [ ] `grep -rn '{{TOOL:' src/agents/*/*.md | wc -l` → >0 (placeholders exist)
  - [ ] `ls src/workflow/prompts/ 2>/dev/null | wc -l` → 0 (old dir removed)
  - [ ] Integration test file exists and passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full test suite passes
    Tool: Bash (npm test)
    Steps:
      1. Run: npm test
      2. Assert: 0 failures
      3. Assert: test count >= 41 (original) + new tests
    Expected Result: All tests pass
    Evidence: Terminal output captured

  Scenario: No hardcoded tool syntax remains anywhere
    Tool: Bash (grep)
    Steps:
      1. grep -rn 'task({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → 0
      2. grep -rn 'question({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → 0
      3. grep -rn 'delegate_task(' src/workflows/traditional/prompts/*.md | grep -v '{{TOOL' | wc -l → 0
      4. grep -rn 'set_hd_workflow_handover(' src/agents/*/*.md | grep -v '{{TOOL' | wc -l → 0
    Expected Result: All counts 0
    Evidence: Terminal output captured

  Scenario: Agent creation produces resolved prompts
    Tool: Bash (npm test)
    Steps:
      1. Run: npm test src/__tests__/integration/decoupling.test.ts
      2. Assert: Agent prompt has no {{TOOL:*}} patterns
      3. Assert: Agent prompt has OpenCode tool syntax
    Expected Result: Integration tests pass
    Evidence: Terminal output captured

  Scenario: Config backward compatibility
    Tool: Bash (npm test)
    Steps:
      1. Test: loadHDConfig with no workflow field → returns "traditional"
      2. Test: getWorkflowDefinition("traditional") → returns valid definition
      3. Run: npm test
    Expected Result: Tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `test(integration): add decoupling integration tests and verify full regression`
  - Files: `src/__tests__/integration/decoupling.test.ts`
  - Pre-commit: `npm test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(prompts): add PromptResolver and OpenCode tool registry` | src/prompts/*, tests | `npm test` |
| 2 | `refactor(agents): convert agent prompts to {{TOOL:*}} placeholders` | src/agents/*/*.md | `npm test` |
| 3 | `refactor(workflow): convert workflow prompts to {{TOOL:*}} placeholders` | src/workflow/prompts/*.md | `npm test` |
| 4 | `feat(workflows): add WorkflowDefinition interface and workflow registry` | src/workflows/*, tests | `npm test` |
| 5 | `feat(workflows): extract traditional workflow to dedicated module` | src/workflows/traditional/*, tests | `npm test` |
| 6 | `feat(config): add workflow field to config schema` | schema, config, loader, tests | `npm test` |
| 7 | `refactor(workflow): genericize state management for dynamic workflows` | src/workflow/state.ts, tests | `npm test` |
| 8 | `feat(factory): integrate PromptResolver into agent creation pipeline` | src/agents/factory.ts, tests | `npm test` |
| 9 | `refactor(workflow): dynamic handover and prompt loading from workflow definitions` | src/workflow/*, opencode/hooks/*, src/index.ts | `npm test` |
| 10 | `test(integration): add decoupling integration tests and verify full regression` | tests | `npm test` |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass (original 41 + new)
npm test

# No hardcoded tool syntax in agent prompts
grep -rn 'task({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l  # Expected: 0
grep -rn 'question({' src/agents/*/*.md | grep -v '{{TOOL' | wc -l  # Expected: 0

# No hardcoded delegate_task in workflow prompts
grep -rn 'delegate_task(' src/workflows/traditional/prompts/*.md | grep -v '{{TOOL' | wc -l  # Expected: 0

# Placeholders exist in agent files
grep -rn '{{TOOL:' src/agents/*/*.md | wc -l  # Expected: >0

# Old workflow prompts directory removed
ls src/workflow/prompts/ 2>/dev/null | wc -l  # Expected: 0

# Config has workflow field
node -e "console.log(JSON.parse(require('fs').readFileSync('hd-config.json','utf8')).workflow)"  # Expected: "traditional"
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass (`npm test`)
- [x] Agent prompts use `{{TOOL:*}}` placeholders
- [x] Workflow is configurable via `hd-config.json`
- [x] Traditional workflow extracted to `src/workflows/traditional/`
- [x] No backward compatibility breaks for existing users
