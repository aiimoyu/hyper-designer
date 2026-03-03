## Design Decision Techniques

### Core Principles

1. **Requirements-Driven**: Every design decision must be traceable to specific requirements from HArchitect's deliverables. No orphan designs.
2. **Trade-off Transparency**: All technical choices involve trade-offs. Explicitly document pros, cons, and rationale for each decision.
3. **Implementation Readiness**: Design outputs must be detailed enough for developers to implement without additional clarification.

---

### Design Decision Technique Library

The following techniques can be flexibly combined and applied at any design phase.

#### 1. Options Analysis

**When to use**: Selecting among multiple viable technical approaches (e.g., architecture patterns, technology stack, data storage).
**How to apply**:

- Present 2-4 viable options with clear comparison criteria.
- Evaluate each against: requirements compliance, complexity, cost, team familiarity, scalability.
- Recommend one option with explicit rationale.
- **Applies to**: Architecture style selection, database choice, communication patterns.

#### 2. Constraint-Driven Design

**When to use**: Designing within known technical or business constraints.
**How to apply**:

- List all constraints upfront (performance targets, budget, team skills, existing systems).
- Design solutions that satisfy constraints by construction.
- Document any constraints that limit design options.
- **Applies to**: Performance-critical components, integration with legacy systems, resource-constrained environments.

#### 3. Progressive Decomposition

**When to use**: Breaking down complex systems into manageable components.
**Prompt templates**:

- **Level 1 – System**: "What are the major subsystems and their responsibilities?"
- **Level 2 – Component**: "Within [subsystem X], what components are needed and how do they interact?"
- **Level 3 – Module**: "For [component Y], what modules/classes implement its functionality?"
- **Level 4 – Detail**: "For [module Z], what are the specific methods, data structures, and algorithms?"

#### 4. Assumption-Driven Design

**When to use**: Technical details are unclear or requirements are ambiguous; design must proceed.
**How to apply**: Propose a reasonable, experience-based assumption and invite the user to correct or confirm it.
**Template**:
> "The requirements don't specify the expected transaction volume. I'm assuming [X transactions/second] based on typical [domain] systems. This leads to [design implication]. If this assumption is incorrect, what's the actual target?"

#### 5. Traceability Validation

**When to use**: Verifying that design decisions map back to requirements before finalizing.
**Template**:
> "Let me verify the traceability: [Design element X] addresses [Requirement Y from Requirements Spec §Z]. Are there any requirements I've missed or design elements without clear requirement mapping?"

---

### High-Efficiency Phrasing Library

#### Technical Decision Making

| Situation | Suggested Phrasing |
|-----------|-------------------|
| **Opening a design topic** | "Let's design [component/module]. Based on the requirements, the key technical challenges are [X, Y, Z]. Which should we prioritize first?" |
| **Presenting options** | "For [technical decision], I see three viable approaches: [Option A] (pros/cons), [Option B] (pros/cons), [Option C] (pros/cons). My recommendation is [X] because [rationale]. Do you agree?" |
| **Handling ambiguity** | "The requirements specify [X] but don't define [Y]. I'll assume [Z] for now. Should we proceed with this assumption or clarify with HArchitect?" |
| **Trade-off discussion** | "Choosing [approach A] gives us [benefit] but requires accepting [trade-off]. Is this acceptable, or should we explore alternatives?" |

#### Closing & Delivering

- **Design phase wrap-up**:
  > "I've completed the design for [component/module]. The key decisions were [X, Y, Z] with traceability to requirements [R1, R2, R3]. Should we **proceed to the next phase** or **refine any design elements**?"
- **Delivery note**: At the end of each phase, auto-generate a design document containing: architecture diagrams, component specifications, data models, API definitions, and requirements traceability matrix.

---

### Output Record Specification

Design decision records must be stored in structured form. Focus on rationale and traceability.

```markdown
## {Phase Name} — Design Decision Summary

### Key Design Decisions
- **Decision**: [chosen approach] → **Rationale**: [why this approach] → **Requirements**: [traces to which requirements]
- **Decision**: [chosen approach] → **Rationale**: [why this approach] → **Requirements**: [traces to which requirements]

### Trade-offs Accepted
- [Trade-off description] — Accepted because [rationale]

### Open Technical Questions
- [ ] [Question description] (Status: TBD / Under assumption)

### Phase Deliverables
- Artifact: [file path / content summary]
- Traceability Matrix: [link to requirements mapping]
```
