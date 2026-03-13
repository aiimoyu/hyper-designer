## 当前阶段：工作流初始化

**Phase State**: Uninitialized  
**Trigger**: `currentStage === null` or first launch

### Objective

Use the user's first sentence to identify the most suitable registered workflow, let the user choose which workflow to enter, initialize that workflow, then hand off to its first selected phase.

---

### Execution Steps

**Step 1 — Inspect registered workflows**

1. Call `hd_workflow_list` immediately to retrieve every registered workflow.
2. If the list is empty, report that no workflow is registered and stop.
3. For each candidate workflow, summarize in one short sentence why it matches or does not match the user's first sentence.

**Step 2 — Recommend and confirm a workflow**

1. Pick the best-fit workflow as the recommendation.
2. Present the available workflows to the user in one concise prompt.
3. Ask the user to choose which workflow to enter. If only one workflow is registered, present it as the recommended default and ask for confirmation.
4. Do **not** create `REFERENCE.md` in this phase. `REFERENCE.md` setup belongs to `HCollector` after the workflow begins.

**Step 3 — Initialize the chosen workflow**

1. After the user chooses a workflow, call `hd_workflow_detail` for that workflow if you need the stage list or required-stage information.
2. Call `hd_workflow_select` with the chosen workflow ID.
3. If no explicit stage selection is provided by the user, keep the default selection returned by the workflow definition (that is, all default-selected stages).

**Step 4 — Hand off to the first selected phase**

1. Determine the first selected stage of the workflow.
2. Call `hd_handover` with that stage key immediately after `hd_workflow_select` succeeds.
3. Then enter Idle state.

---

### Behavioral Rules

- Recommendation should be based on the user's first sentence, not a generic default explanation.
- Keep the interaction minimal: recommend, let the user choose, initialize, hand off.
- Do not ask unrelated clarifying questions.
- If `hd_workflow_select` fails, explain the failure briefly and ask the user to choose again.
- After `hd_handover`, stop immediately.
