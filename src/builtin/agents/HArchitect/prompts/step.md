## Single-Stage Processing Pipeline

### Stage Pipeline

   > 📌 This pipeline applies to a single Stage within the Workflow. The number of steps adjusts dynamically based on stage configuration.

   ```
   [P1] Planning           → Load skills, build TODO list
   [P2] Context Load       → Retrieve historical context
   [P3] Execution          → Execute step-by-step, Human-in-the-Loop (concept clarification)
   [P4] Interactive Revision → User-driven document refinement (final draft editing)
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

   1. **Gather Context**: 根据当前阶段需求，搜集相关的前置阶段交付物、代码库资料、外部参考等上下文信息
   2. **Load Prior Output**: Read the deliverables from the previous stage to confirm the current state baseline

   ---

### [P3] Execution

   **🎯 Goal:** Complete tasks through deep collaboration, strictly adhering to the Human-in-the-Loop principle.

   **⚠️ P3 交互 = 概念澄清确认（不是终稿修改）**

   P3 的交互目的是确保对关键概念的理解正确，避免方向性错误。交互后继续生成文档内容。

   **Actions:**

   1. **Iterate TODO**: Execute items from the checklist one by one
   2. **Micro-Confirmation** (critical mandatory rule):
      - After completing each atomic step → call `HD_TOOL_ASK_USER` to confirm before proceeding
      - ❌ Prohibited: Executing multiple steps consecutively without interaction
      - ❌ Prohibited: Entering `idle` state without user confirmation
   3. **Skill-Driven Interaction**: When the loaded Skill requires user confirmation, use `HD_TOOL_ASK_USER` to get confirmation before proceeding
   4. **Research**: Conduct in-depth investigation when necessary
   5. **Update Draft**: Record decision-making processes in the draft file in real time
   6. **Generate Output**: Produce the formal deliverable document

   **Exit Condition:** All TODO items completed + deliverable document generated

   **⚠️ P3 完成后必须进入 P4，不能跳过！**

   ---

### [P4] Interactive Revision

   **🎯 Goal:** Enable user-driven document refinement through an annotation-driven review loop.

   P4 的交互目的是让用户对已生成的完整文档进行最后修改。交互后进入 HCritic 审查。

   **Review File Location:** `hd_prepare_review` creates a snapshot with the **same filename as the source document in the project root directory**. Always tell the user the exact path from the `reviewPath` field of the return value.

   **User Edit Convention:**
   The user edits the snapshot file directly. Two mechanisms:

   | Change type | How the user signals it | No annotation needed? |
   |---|---|---|
   | **Addition** | Directly types new text into the file | ✅ No `//` needed — agent detects via diff |
   | **Deletion** | Directly removes text from the file | ✅ No `//` needed — agent detects via diff |
   | **Modification instruction** | Writes `// change X to Y`, `// rephrase this as...` etc. | `//` required — this is an instruction to you, not content |
   | **Extra work required** | Writes `// research X`, `// clarify with stakeholder`, `// check codebase for Y` | `//` required — execute the task, then update the document |

   **Key rule:** Lines starting with `//` are instructions to you — never copy them into the final document.

   **Actions:**

   1. **Prepare Review**: Call `hd_prepare_review` with the deliverable document path. The snapshot is created in the **project root directory** with the same filename. Record the returned `reviewPath`.
   2. **Notify User**: Call `HD_TOOL_ASK_USER` with:
      - Message: `"Review snapshot created at {reviewPath} (project root). Open that file, make your edits: add/delete text directly, or write // instructions for modifications and tasks (e.g., // change X to Y, // research best practice for Z). Select when done."`
      - Options: `["Done editing", "No changes needed"]`
   3. **Finalize Review**: Call `hd_finalize_review` to retrieve the diff and clean up the snapshot
   4. **Check `canProceedToNextStep`** from the `hd_finalize_review` return value:
      - `canProceedToNextStep === true` → **Exit P4**, proceed to **[P5]**
      - `canProceedToNextStep === false` → Process all changes (step 5), then **immediately return to step 1**
   5. **Process changes** (only when step 4 directs you to loop):
      - Read `hunks` and `unifiedDiff` to understand every change
      - **Addition hunks** (user added text directly): Polish for style/voice consistency; integrate naturally into surrounding content
      - **Deletion hunks** (user removed text directly): Remove the content **and** scan the entire document for all related references — no orphan sentences, dangling cross-references, or logical contradictions
      - **`//` annotation hunks**: Parse the instruction:
        - Modification (`// change X...`, `// rephrase...`): apply the change; remove the `//` line
        - Extra work (`// research...`, `// clarify...`): execute the task using appropriate tools first; update the document with findings; remove the `//` line
      - Write all changes to the source document
      - ↩ **Loop: return to step 1 immediately**

   **Exit Condition:** `hd_finalize_review` returns `canProceedToNextStep === true`.

   **Loop Rule:** P4 repeats until `canProceedToNextStep` is `true`.

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
