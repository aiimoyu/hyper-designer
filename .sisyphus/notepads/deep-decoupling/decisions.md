# Decisions - deep-decoupling

Architectural choices made during implementation.

## [2026-02-10T11:48:40Z] Session Started
- Decision points tracked here

---

## [2026-02-10T20:07:46Z] Task 7: State Management Genericization Decisions

**Decision: Use Record<string, WorkflowStage> instead of discriminated union**
- Rationale: Maximum flexibility for dynamic workflows
- Alternative considered: Type union of known workflows (too rigid)
- Trade-off: Lose compile-time stage name checking, gain runtime flexibility
- Justification: Plugin needs to support user-defined workflows loaded at runtime

**Decision: Require WorkflowDefinition parameter for validation functions**
- Affected functions: `setWorkflowHandover()`, `executeWorkflowHandover()`
- Rationale: Stage order validation requires workflow definition
- Alternative considered: Store active workflow in state file (coupling)
- Trade-off: More parameters vs. implicit global state
- Justification: Explicit dependencies > hidden state, follows functional programming principles

**Decision: Make WorkflowDefinition optional for getWorkflowState()**
- Rationale: Allow reading existing state without knowing workflow structure
- Alternative considered: Always require definition (breaking change)
- Trade-off: Flexibility vs. explicitness
- Justification: Backward compatibility essential, enables gradual migration

**Decision: Keep LEGACY_WORKFLOW_STAGES for backward compatibility**
- Rationale: Existing state files without workflow metadata still need to load
- Marked as `@deprecated` to signal future removal
- Alternative considered: Migration script to update all state files
- Trade-off: Technical debt vs. smooth migration
- Justification: Zero-downtime upgrades more important than clean code

**Decision: Export executeWorkflowHandover and new helper functions**
- Functions: `executeWorkflowHandover`, `initializeWorkflowState`, `getStageOrder`
- Rationale: These are now part of the public API for workflow management
- Previous oversight: `executeWorkflowHandover` was used internally but not exported
- Justification: Consumers need these functions when managing workflow state with custom definitions

**Decision: Change function signatures to accept string instead of keyof Workflow**
- Affected: `setWorkflowStage()`, `setWorkflowCurrent()`
- Rationale: No longer have fixed Workflow type with known keys
- Alternative considered: Generic constraints (complex, minimal benefit)
- Trade-off: Lose TypeScript autocomplete, gain flexibility
- Justification: Runtime validation sufficient, stage names come from definition

**Decision: Test with full WorkflowDefinition mocks instead of minimal stubs**
- Rationale: Catch interface mismatches early
- Alternative considered: Minimal test fixtures (faster to write)
- Trade-off: More verbose tests vs. higher confidence
- Justification: Type safety worth the extra test code, catches more bugs

**Decision: State file schema unchanged (JSON format stays the same)**
- Rationale: Backward compatibility paramount
- Schema: `{ workflow: Record<string, {isCompleted: boolean}>, currentStep, handoverTo }`
- Alternative considered: Add workflow metadata to state file
- Trade-off: Simplicity vs. self-describing state
- Justification: Keep state file simple, workflow definition lives in code

**Decision: Stage order validation uses indexOf() lookups**
- Rationale: Simple, clear, matches previous implementation
- Alternative considered: Build index map (premature optimization)
- Trade-off: O(n) lookups vs. O(1) with map (n typically < 20)
- Justification: Readability over optimization for small workflow sizes

## [2026-02-10T20:19:00Z] Task 9: Workflow Integration Decisions

### Decision: Helper functions over config builder
- **Chosen:** `getHandoverAgent()` and `getHandoverPrompt()` helper functions
- **Alternative:** Keep `HANDOVER_CONFIG` but build it from WorkflowDefinition
- **Rationale:** Helper functions are simpler and avoid maintaining intermediate data structures
- **Trade-off:** Two functions vs. one config object
- **Justification:** Direct querying of definition is clearer and reduces memory overhead

### Decision: Dynamic path resolution based on workflow ID
- **Pattern:** `src/workflows/{definition.id}/{stageConfig.promptFile}`
- **Alternative:** Store absolute paths in WorkflowDefinition
- **Rationale:** Relative paths keep workflow modules portable
- **Trade-off:** Need to construct paths at runtime vs. pre-computed paths
- **Justification:** Portability and clarity more important than marginal performance gain

### Decision: Integrate PromptResolver into loadPromptForStage()
- **Approach:** Load raw file → resolve placeholders → return final prompt
- **Alternative:** Return raw prompts, let caller resolve
- **Rationale:** Encapsulate resolution logic, ensure consistency
- **Trade-off:** Couples prompt loading to OpenCode registry (for now)
- **Justification:** All prompts need resolution, better to do it once in the right place

### Decision: Load workflow definition once at hook initialization
- **Strategy:** Load in `createWorkflowHooks()`, reuse for all events
- **Alternative:** Load workflow definition on every event
- **Rationale:** Performance and consistency (config doesn't change during session)
- **Trade-off:** Cannot hot-reload workflow config during session
- **Justification:** Sessions are typically short-lived, reload on new session is acceptable

### Decision: Try-catch in hooks, throw in library functions
- **Pattern:**
  - Library functions (handover.ts, prompts.ts): Throw descriptive errors
  - Hook integration (workflow.ts): Try-catch and log errors
- **Alternative:** Silent failures everywhere or errors everywhere
- **Rationale:** Fail fast in library code, graceful degradation in integration layer
- **Trade-off:** More verbose integration code
- **Justification:** Hook failures would break entire chat system, library errors should be visible

### Decision: Remove type casts in plugin tools
- **Before:** `params.stage_name as keyof Workflow`
- **After:** `params.stage_name` (plain string)
- **Rationale:** No longer have fixed Workflow type, accept any string
- **Trade-off:** Lose compile-time type safety
- **Justification:** Runtime validation in state functions is sufficient

### Decision: Delete old prompts directory immediately
- **Approach:** Remove `src/workflow/prompts/` after refactoring
- **Alternative:** Keep both directories during transition
- **Rationale:** Clean break, no ambiguity about which files are used
- **Trade-off:** Cannot roll back without git history
- **Justification:** Tests verify new loading works, old files are in git

### Decision: Update exports in src/index.ts
- **Removed:** `HANDOVER_CONFIG`
- **Added:** `getHandoverAgent`, `getHandoverPrompt`
- **Rationale:** Expose new API, remove deprecated exports
- **Alternative:** Keep both during transition period
- **Justification:** Internal plugin, no external consumers to break

### Decision: Comprehensive test coverage for new functions
- **Coverage:** 11 handover tests + 8 prompt loading tests
- **Approach:** Test with traditional workflow + custom workflow definitions
- **Rationale:** Validate generic behavior, not just traditional workflow
- **Alternative:** Minimal tests only for traditional workflow
- **Justification:** Custom workflow tests prove abstraction works correctly

### Decision: Fix HEngineer defaultPermission in same commit
- **Included:** Add missing `defaultPermission` field to HEngineer
- **Alternative:** Separate fix commit
- **Rationale:** Discovered during refactoring, related to AgentDefinition interface
- **Justification:** Small fix, prevents LSP errors, keeps main commit clean
