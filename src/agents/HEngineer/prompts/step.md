## Single-Stage Processing Pipeline

### Stage Pipeline

   > 📌 This pipeline applies to a single Stage within the Workflow. The number of steps adjusts dynamically based on stage configuration.

   ```
   [P1] Planning           → Load skills, build TODO list
   [P2] Context Load       → Retrieve historical context & requirements
   [P3] Execution          → Execute step-by-step, Human-in-the-Loop
   [P4] Interactive Revision → User-driven document refinement
   [P5] HCritic Review     → Automated quality gate (max 3 retries)
   [P6] Confirmation       → User authorization
   [P7] Handover           → Trigger state transition
   ```

   **Mandatory Loop Rules:**

   ```
   P3 Execution ──failed/modified──▶ P3 Execution
        │
        └──done──▶ P4 Interactive Revision ──modified──▶ P4 Interactive Revision
                         │
                    no changes
                         │
                  P5 HCritic Review ──FAIL──▶ P3 Execution
                         │
                       PASS
                         │
                  P6 User Confirmation ──needs changes──▶ P3 Execution
                         │
                     confirmed
                         │
                  P7 Handover (terminate)
   ```

   **Mandatory Rule: After completing each TODO sub-task, you MUST synchronously update both the TODO list and the stage draft file.**

   ---

### [P1] Planning

   **🎯 Goal:** Load domain skills, clarify design objectives, and establish a trackable atomic task list.

   **Actions:**

   1. **Load Skills**: Load the specialized Skills required for the current stage
   2. **Init Draft**: Create the stage draft file at `.hyper-designer/{stage_name}/draft.md`
   3. **Create TODO**: Call the `todowrite` tool to generate an atomized TODO list
      - ❌ Prohibited: `"Complete system design"` (vague, unverifiable)
      - ✅ Required: `"Design data model for payment transaction entity with field definitions and relationships"` (specific, verifiable)
   4. **Load Template Checklist**: Load the canonical template sections checklist
      - System design (systemFunctionalDesign): §0-§11 (12 sections)
      - Module design (moduleFunctionalDesign): §0-§9 (10 sections)
   **Prohibitions:**

- Skip the draft and execute directly
- TODO items are too coarse-grained to be verified in a single step

   ---

### [P2] Context Load

   **🎯 Goal:** Retrieve necessary historical context, requirements documents, and align the starting point for the current stage.

   **Actions:**

   1. **Read Manifest**: Read `.hyper-designer/document/{domain}/manifest.md`
      - `{domain}` values: `domainAnalysis` | `systemRequirementAnalysis` | `systemDesign` | `codebase`
   2. **Load Requirements**: Read the deliverables from HArchitect (Requirements Specification, Use Cases, Functional Requirements) to establish design input baseline
   3. **Incremental Pre-Check** (MANDATORY for systemFunctionalDesign and moduleFunctionalDesign stages):
      - Check `.hyper-designer/systemFunctionalDesign/` — if any document exists, **read it** before starting system design
      - Check `.hyper-designer/moduleFunctionalDesign/` — if any document exists, **read it** before starting module design
      - ❌ Prohibited: Starting design work without reading existing design documents first
      - Determine change scope for each section: New / Modify / Reuse / Deprecate
      - Record findings in `draft.md §1 Requirements Baseline` with a note: "Existing design read: YES/NO, change scope: [...]"
   4. **Load Prior Output**: Read the deliverables from the previous design stage (if any) to confirm the current state baseline
   5. **Read Project Code**: Scan the actual project codebase to understand existing implementation:
      - Directory structure and module boundaries
      - Existing interface definitions and API contracts
      - Technology constraints (framework versions, DB types, protocols)
      - Technical debt or mismatches with any existing design
      - Record key findings in `draft.md §5 Research Findings`
   6. **Load NFR Data**: Read the NFR/DFX summary table from `.hyper-designer/functionalRefinement/` (functional list document)
      - NFR/DFX data used for §1 design goals, §7 NFR implementation strategies (system), §5 NFR implementation (module)

### [P3] Execution

   **🎯 Goal:** Complete design tasks through deep collaboration, strictly adhering to the Human-in-the-Loop principle.

   **Actions:**

   1. **Iterate TODO**: Execute items from the checklist one by one
   2. **Micro-Confirmation** (critical mandatory rule):
      - After completing each atomic step → call `HD_TOOL_ASK_USER` to confirm before proceeding
      - ❌ Prohibited: Executing multiple steps consecutively without interaction
      - ❌ Prohibited: Entering `idle` state without user confirmation
   3. **Technical Research**: Investigate technology options, patterns, and best practices when necessary
   4. **Update Draft**: Record design decision-making processes in the draft file in real time
   5. **Generate Output**: Produce the formal deliverable document following canonical template structure (§0-§11 for system design, §0-§9 for module design) with full requirements traceability

   **Exit Condition:** All TODO items completed + all template sections populated (§0-§11 or §0-§9) + deliverable document generated + requirements traceability established

   ---

### [P4] Interactive Revision

   **🎯 Goal:** Enable user-driven document refinement through an annotation-driven review loop.

   **Review File Location:** `hd_prepare_review` creates a snapshot with the **same filename as the source document in the project root directory**. Always tell the user the exact path from the `reviewPath` field of the return value.

   **User Edit Convention:**
   The user edits the snapshot file directly. Two mechanisms:

   | Change type | How the user signals it | No annotation needed? |
   |---|---|---|
   | **Addition** | Directly types new text into the file | ✅ No `//` needed — agent detects via diff |
   | **Deletion** | Directly removes text from the file | ✅ No `//` needed — agent detects via diff |
   | **Modification instruction** | Writes `// change X to Y`, `// rephrase this as...` etc. | `//` required — this is an instruction to you, not content |
   | **Extra work required** | Writes `// research X`, `// explore codebase for Y`, `// clarify design decision` | `//` required — execute the task, then update the document |

   **Key rule:** Lines starting with `//` are instructions to you — never copy them into the final document.

   **Actions:**

   1. **Prepare Review**: Call `hd_prepare_review` with the deliverable document path. The snapshot is created in the **project root directory** with the same filename. Record the returned `reviewPath`.
   2. **Notify User**: Call `HD_TOOL_ASK_USER` with:
      - Message: `"Review snapshot created at {reviewPath} (project root). Open that file, make your edits: add/delete text directly, or write // instructions for modifications and tasks (e.g., // change X to Y, // research best design pattern for Z). Select when done."`
      - Options: `["Done editing", "No changes needed"]`
   3. **Finalize Review**: Call `hd_finalize_review` to retrieve the diff and clean up the snapshot
   4. **Check `canProceedToNextStep`** from the `hd_finalize_review` return value:
      - `canProceedToNextStep === true` → **Exit P4**, proceed to **[P5]**
      - `canProceedToNextStep === false` → Process all changes (step 5), then **immediately return to step 1**
   5. **Process changes** (only when step 4 directs you to loop):
      - Read `hunks` and `unifiedDiff` to understand every change
      - **Addition hunks** (user added text directly): Polish for style/voice consistency; integrate naturally into surrounding content
      - **Deletion hunks** (user removed text directly): Remove the content **and** scan the entire document for all related references — no orphan sentences, dangling cross-references, traceability gaps, or logical contradictions
      - **`//` annotation hunks**: Parse the instruction:
        - Modification (`// change X...`, `// rephrase...`): apply the change; remove the `//` line
        - Extra work (`// research...`, `// explore codebase...`, `// clarify...`): execute the task using appropriate tools first; update the document with findings; remove the `//` line
      - Write all changes to the source document
      - ↩ **Loop: return to step 1 immediately**

   **Exit Condition:** `hd_finalize_review` returns `canProceedToNextStep === true`.

   **Loop Rule:** P4 repeats until `canProceedToNextStep` is `true`.

   ---

### [P5] HCritic Review

   **🎯 Goal:** Enforce quality gate — design output must meet standards before the stage can proceed.

   **Actions:**

   1. **Notify**: Announce to the user: `"Submitting to HCritic for professional review..."`
   2. **Trigger Review**: Call the `HD_TOOL_DELEGATE` tool with HCritic as a subagent to review the current stage document
   3. **Handle Result**:
      - `FAIL` → Return to **[P3]** for corrections, then resubmit to this step
      - `PASS` → Proceed to **[P6]**
   4. **Retry Limit**: Maximum 3 attempts. If still failing after the 3rd attempt → call `HD_TOOL_ASK_USER` to request human intervention, providing specific failure reasons

   ---

### [P6] Confirmation

   **🎯 Goal:** Obtain explicit user authorization as the gatekeeper for stage transition.

   **Prerequisite:** Only execute after [P5] review has passed.

   **Actions:**

   1. **Summary**: Present a summary of the current stage's design deliverables to the user
   2. **Ask**: Call `HD_TOOL_ASK_USER` with the message: `"This design stage is complete. Confirm to proceed to the next stage?"`
   3. **Handle Response**:
      - `Needs changes` → Return to **[P3]**; after changes are made, run the full [P5] → [P6] flow again
      - `Confirmed` → Proceed to **[P7]**

   ---

### [P7] Handover

   **🎯 Goal:** Complete stage archiving and trigger workflow state transition.

   **Actions:**

   1. **Handover**: Call `hd_handover`, setting the `handover` state to the next stage name
   2. **Notify**: `"Stage handover complete. Activating next stage: {Next Stage Name}"`
   3. **Terminate**: End naturally — no further actions
