---
name: hd-review-pipeline
description: Used to standardize the execution process of a certain Stage in hyper-designer, ensuring that deliverables are reviewed, revised, and aligned with user intent
metadata:
  pattern: pipeline
  steps: "5"
---

You are currently in the execution process of a Stage within a workflow, and you must strictly complete the stage objective according to the following steps.  
**If any step fails, you are prohibited from skipping it or continuing on your own. You must enter the corresponding revision path.**

---

## Process Overview

| Step | Name | Responsibility |
|------|------|------|
| **P1.0** | Execute | Load the stage Skill methodology and generate the first draft of the deliverable |
| **P1.1** | Post-initial-review Revision | Revise according to the Skill methodology + initial review comments |
| **P2** | HCritic Initial Review | First automated quality gate (revision limit: **2** rounds) |
| **P3** | Interactive Revision | User-driven document refinement (final draft editing) |
| **P1.2** | Post-re-review Revision | Revise according to the Skill methodology + re-review comments |
| **P4** | HCritic Re-review | Second automated quality gate (revision limit: **2** rounds) |
| **P5** | Handover | Trigger state transition and output the final deliverable |

---

## Flowchart

```mermaid
graph TD
    P1_0[P1.0 执行] --> P2{P2 初审}
    P2 -- 不通过 --> P1_1[P1.1 初审后修订] --> P2
    P2 -- 通过 --> P3[P3 创建快照·等待用户]
    P3 --> P3d{用户有批注?}
    P3d -- 是 --> P3fix[处理批注] --> P3
    P3d -- 否 --> P3r{曾大幅修订?}
    P3r -- 是 --> P4{P4 复审}
    P3r -- 否 --> P5[P5 交接]
    P4 -- 不通过 --> P1_2[P1.2 复审后修订] --> P4
    P4 -- 通过 --> P5
```

---

## Loop Rules

| # | Rule |
|---|------|
| 1 | **Initial review loop** — P1 fails → P1.1 revision → return to P1, up to 2 rounds; if it still fails, terminate the process. |
| 2 | **P2 self-loop** — After each round of comment processing, recreate the snapshot and wait for the next round until the user confirms there are no more changes. Only then may you exit. |
| 3 | **P2 branching** — After exiting P2, if there were major revisions → P3 re-review; otherwise directly → P4 handover. |
| 4 | **Re-review loop** — P3 fails → P2.1 revision → return to P3 (do not go back to P1), up to 2 rounds; if it still fails, terminate the process. |

---

## Execution Process

### [P1.0] Execute

> Load the methodology of the current stage Skill and generate the first draft of the deliverable strictly according to its guidance.

1. **Load Skill**
   - Identify and load the Skill files bound to the current stage (methodology, templates, specifications);
   - Progressively read supplementary information (`references`, `assets`, etc.) as required by the Skill;
   - If the Skill files are missing or incomplete → **terminate and report**.

2. **Generate First Draft**
   - Produce the first draft strictly according to the Skill methodology;
   - Generating based on guesswork without a Skill is strictly prohibited.

---

### [P2] HCritic Initial Review

> Delegate the P1.0 deliverable to HCritic for the first automated quality gate.

1. **Delegate Review**
   - Call `HD_TOOL_DELEGATE` and delegate `HCritic` as the Subagent to review the stage document;
   - If there are multiple deliverables, each must be delegated separately; routing decisions are based on the **worst result**.
   - The main agent is prohibited from calling `hd_record_milestone` to mark the gate milestone; only HCritic may mark it.

2. **Routing Decision**
   - Identify the review result
   - If it still fails after the **2nd round** → terminate the process and request user intervention;
   - Route:
     + **Fully passed** → P3 Interactive Revision;
     + **Conditionally passed** → P1.1 minor revision, then directly proceed to the next step → P3;
     + **Failed** → P1.1 revision, then return to P2.

---

### [P1.1] Post-initial-review Revision

> Perform targeted modifications to the deliverable according to the Skill methodology and the P2 initial review comments.

1. **Execute Revision**
   - Re-check the relevant sections of the Skill methodology;
   - Implement review revision instructions item by item;
   - If chain impacts are involved (such as terminology changes), the entire document must be updated consistently;
   - Introducing new non-conformities is prohibited.

2. **Routing Decision**
   - **Conditionally passed** → P3;
   - **Failed** → Return to P2 for initial review again.

---

### [P3] Interactive Revision

> A user-in-the-loop iterative document refinement process to ensure the deliverable fits user requirements.

1. **Generate Snapshot**
   - Call `hd_prepare_review` to create a snapshot file with the same name as the source document in the **project root directory**;
   - If there are multiple deliverables, create them separately; routing decisions are based on the **worst result**.

2. **Block and Wait for User**
   - Call `HD_TOOL_ASK_USER` to block the P3 process with the following message:
     ```text
     评审快照已创建于 {reviewPath}。打开该文件编辑，批注方式：
     1) 直接添加文本（Agent 自动润色）
     2) 删除文本（Agent 自动定位引用处并同步修订）
     3) 以 >>> 开头的指令（建议以 <<< 结尾，Agent 按指令执行并修改）
     完成批注后选择下方选项。
     ```
   - Options: `["无需修改", "完成批注，小幅修订（无须复审）", "完成批注，大幅修订（需要复审）"]`

3. **Get Comment Diffs**
   - Call `hd_finalize_review` to obtain snapshot diffs and clean up the snapshot;
   - If the user chooses **major revision**, call `hd_record_milestone` to mark the `hd-mandatory-review` milestone.

4. **Process Changes**
   - Traverse the diffs item by item and confirm the change location:
     + **Added block**: integrate the content into the deliverable and keep the style/tone consistent;
     + **Deleted block**: delete the corresponding content, and scan the entire document to remove isolated references, dangling cross-references, and logical contradictions;
     + **Instruction block**: identify the intent
       - Direct modification: adjust the deliverable according to the instruction;
       - Additional work: first execute the task using tools, then update the deliverable.
   - If chain impacts are involved, update the entire document consistently; introducing new non-conformities is prohibited.

5. **Routing Decision**
   - If `hd_finalize_review` returns `canProceedToNextStep === true` (the user has no changes) → exit P3;
   - If the user has changes → process them and return to step 1 to begin a new P3 loop;
   - After exiting P3, call `hd_get_milestone` to check `hd-mandatory-review`:
     + Marked → P4 Re-review;
     + Not marked → Skip re-review and go directly to P5.

---

### [P4] HCritic Re-review

> Conduct the second automated quality gate on the deliverable after user modifications.

1. **Delegate Review**
   - Call `HD_TOOL_DELEGATE` and delegate `HCritic` to review the stage document;
   - If there are multiple deliverables, each must be delegated separately; routing decisions are based on the **worst result**.
   - The main agent is prohibited from calling `hd_record_milestone` to mark the gate milestone; only HCritic may mark it.

2. **Routing Decision**
   - If it still fails after the **2nd round** → terminate the process and request user intervention;
   - Route:
     + **Fully passed** → P5 Handover;
     + **Conditionally passed** → P1.2 minor revision, then directly proceed to the next step → P5;
     + **Failed** → P1.2 revision, then return to P4.

---

### [P1.2] Post-re-review Revision

> Perform targeted modifications to the deliverable according to the Skill methodology and the P4 re-review comments.

1. **Execute Revision**
   - Re-check the relevant sections of the Skill methodology;
   - Implement review revision instructions item by item;
   - If chain impacts are involved, update the entire document consistently;
   - Introducing new non-conformities is prohibited.

2. **Routing Decision**
   - **Conditionally passed** → P5;
   - **Failed** → Return to P4 for re-review again.

---

### [P5] Handover

> Obtain user authorization and trigger workflow state transition.

1. **Obtain User Authorization**
   - Call `HD_TOOL_ASK_USER` with the message: `下一步做什么？`, options: `["进入下一阶段", "结束工作"]` 
   - If the current stage is the final stage, only ending the work may be selected.

2. **Execute Handover**
   - If the user chooses to enter the next stage, call `hd_handover` and pass the `next_stage=` parameter. After success, output: `本阶段任务结束后将自动进入下一阶段，再见。`
   - If the user chooses to end the work, call `hd_handover` and pass the parameter `end=true`. After success, output: `工作流已结束，再见。`
   - If milestone handover fails, directly calling `hd_record_milestone` to mark it is prohibited

3. **End Response**
   - The workflow will not actually hand over until you finish your response;
   - Executing the next stage task is strictly prohibited.

---

## Global Constraints

1. **No skipping steps**: Each step must produce the required output before transition is allowed.
2. **No fabrication**: All content must be based on the inputs and reference materials loaded in P1, and must not be fabricated out of thin air.
3. **Worst-result principle**: When there are multiple deliverables, each must be reviewed and revised separately, and the process follows the worst result.
