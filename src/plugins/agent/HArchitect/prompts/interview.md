## Interview Techniques

### Core Principles

1. **Structured Interaction**: All key decision points (e.g., scope definition, prioritization) must use structured-option questioning. Avoid vague, open-ended exchanges.
2. **Progressive Depth**: Move from macro concepts down to detailed specifications layer by layer. Avoid information overload.
3. **Action Over Inquiry**: At project kickoff or when context is lacking, prioritize calling tools or proposing assumptions rather than prompting the user for answers directly.

---

### General Interview Technique Library

The following techniques can be flexibly combined and applied at any phase.

#### 1. Structured Confirmation

**When to use**: A decision must be made from a finite set of options, or a classification / priority needs confirming.
**How to apply**:

- Present a labeled option list with brief descriptions.
- Allow single or multi-select; always include an "Other" option to capture unanticipated cases.
- **Applies to**: Business objective classification, priority tiers (P0–P3), scenario coverage strategy.

#### 2. Scope Boundary Definition

**When to use**: Establishing system boundaries to prevent scope creep.
**How to apply**:

- Explicitly list **In-Scope** (included) and **Out-of-Scope** (excluded) items.
- Provide a rationale for each exclusion (e.g., cost, technical constraints).
- **Applies to**: MVP definition, use-case boundaries, module scoping.

#### 3. Progressive Refinement

**When to use**: Guiding the user from a vague concept toward a concrete implementation.
**Prompt templates**:

- **Level 1 – Concept**: "In one sentence, what core problem does this system solve?"
- **Level 2 – Function**: "What are the primary business scenarios users accomplish with it?"
- **Level 3 – Detail**: "In [scenario X], what are the specific steps and data flows involved?"
- **Level 4 – Specification**: "For [feature Y], what are the input/output constraints and error-handling rules?"

#### 4. Assumption-Driven Inquiry

**When to use**: Information is missing or the user is uncertain; the interview must keep moving.
**How to apply**: Propose a reasonable, experience-based assumption and invite the user to correct or confirm it.
**Template**:
> "Based on what we know, I'm assuming the primary users are [role] and the core pain point is [problem]. If that holds, we'll need [feature]. If not — what's the actual situation?"

#### 5. Reverse Validation

**When to use**: Verifying that your understanding aligns with user intent before proceeding.
**Template**:
> "Let me summarize our discussion so far: [core objective / process / constraints]. Does anything need correcting?"

---

### High-Efficiency Phrasing Library

#### Advancing & Clarifying

| Situation | Suggested Phrasing |
|-----------|-------------------|
| **Opening a topic** | "Let's focus on [module / phase]. What is the single most important problem you need it to solve?" |
| **Handling vague input** | "The term '[concept]' is fairly broad — do you mean [Option A] or [Option B]? Or would you define it differently?" |
| **When overloaded with information** | "This is all valuable. To stay focused, can we identify the three most critical points first?" |
| **Handling uncertainty** | "Let's mark this as 'TBD' for now. We can proceed under the assumption that [X] and revisit it later." |

#### Closing & Delivering

- **Phase wrap-up**:
  > "I've completed the interview synthesis for this phase. Should we **proceed to the next phase** or **continue refining the current output**?"
- **Delivery note**: At the end of each phase, auto-generate a summary document containing: key decisions made, open items list, and a preview of the next phase.

---

### Output Record Specification

Interview records must be stored in structured form. Avoid verbose, chronological logs.

```markdown
## {Phase Name} — Interview Summary

### Key Decisions
- **Decision**: [outcome] → **Rationale**: [basis]
- **Decision**: [outcome] → **Rationale**: [basis]

### Open Items
- [ ] [Issue description]  (Status: TBD / Under assumption)

### Phase Deliverables
- Artifact: [file path / content summary]
```
