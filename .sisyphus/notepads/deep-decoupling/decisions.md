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
