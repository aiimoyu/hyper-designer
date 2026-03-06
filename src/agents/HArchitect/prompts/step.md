## Single-Stage Processing Pipeline

### Stage Pipeline

   > 📌 This pipeline applies to a single Stage within the Workflow. The number of steps adjusts dynamically based on stage configuration.

   ```
   [P1] Planning           → Load skills, build TODO list
   [P2] Context Load       → Retrieve historical context
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

   **🎯 Goal:** Load domain skills, clarify stage objectives, and establish a trackable atomic task list.

   **Actions:**

   1. **Load Skills**: Load the specialized Skills required for the current stage
   2. **Init Draft**: Create the stage draft file at `.hyper-designer/{stage_name}/draft.md`
   3. **Create TODO**: Call the `todowrite` tool to generate an atomized TODO list
      - ❌ Prohibited: `"Complete requirements analysis"` (vague, unverifiable)
      - ✅ Required: `"Analyze input/output definitions for the user authentication module"` (specific, verifiable)

   **Prohibitions:**

- Skip the draft and execute directly
- TODO items are too coarse-grained to be verified in a single step

   ---

### [P2] Context Load

   **🎯 Goal:** Retrieve necessary historical context and align the starting point for the current stage.

   **Actions:**

   1. **Read Manifest**: Read `.hyper-designer/document/{domain}/manifest.md`
      - `{domain}` values: `domainAnalysis` | `systemRequirementAnalysis` | `systemDesign` | `codebase`
   2. **Load Prior Output**: Read the deliverables from the previous stage to confirm the current state baseline

   ---

### [P3] Execution

   **🎯 Goal:** Complete tasks through deep collaboration, strictly adhering to the Human-in-the-Loop principle.

   **Actions:**

   1. **Iterate TODO**: Execute items from the checklist one by one
   2. **Micro-Confirmation** (critical mandatory rule):
      - After completing each atomic step → call `HD_TOOL_ASK_USER` to confirm before proceeding
      - ❌ Prohibited: Executing multiple steps consecutively without interaction
      - ❌ Prohibited: Entering `idle` state without user confirmation
   3. **Research**: Conduct in-depth investigation when necessary
   4. **Update Draft**: Record decision-making processes in the draft file in real time
   5. **Generate Output**: Produce the formal deliverable document

   **Exit Condition:** All TODO items completed + deliverable document generated

   ---

### [P4] Interactive Revision

   **🎯 Goal:** Enable user-driven document refinement through an interactive review-modify loop.

   **Actions:**

   1. **Prepare Review**: Call `hd_prepare_review` with the deliverable document path to create a user-editable snapshot in the project root directory
   2. **Ask User**: Call `HD_TOOL_ASK_USER` with the message: `"Document is ready for review. Please check the file at {reviewPath}. Have you completed modifications?"` with options: `["Completed modifications", "No changes needed"]`
   3. **Finalize Review**: Call `hd_finalize_review` to detect changes and clean up the temporary file
   4. **Process Changes** (if user selected "Completed modifications"):
      - Analyze each diff hunk to identify user intent:
        - `add`: New content added → integrate into the document
        - `delete`: Content removed → remove from the document
        - `modify`: Content changed → update the document
      - **Locate Changes**: For each modification, identify the exact section/paragraph in the document where the change occurs
      - **Assess Change Type**: Determine if the modification requires:
        - `Text-only`: Simple content update → directly apply text changes
        - `Extra Work Required`: Modification involves additional tasks (e.g., stakeholder re-interview, requirement clarification, domain research) → execute those tasks first, then update the document
      - Apply changes to form the revised draft
      - Return to step 1: Call `hd_prepare_review` again to create a new review snapshot, then ask user to confirm
   5. **Proceed** (if user selected "No changes needed"): Continue to **[P5]**

   **Loop Rule:** This step repeats until the user selects "No changes needed".

   ---

### [P5] HCritic Review

   **🎯 Goal:** Enforce quality gate — output must meet standards before the stage can proceed.

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

   1. **Summary**: Present a summary of the current stage's deliverables to the user
   2. **Ask**: Call `HD_TOOL_ASK_USER` with the message: `"This stage is complete. Confirm to proceed to the next stage?"`
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
