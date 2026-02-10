# Prompt Enhancement Work Plan

**Date**: 2026-02-09  
**Task**: Add standardized workflow chapter to agent prompts  
**Status**: ✅ Completed

---

## Objective

Enhance HArchitect, HEngineer, and HCollector agent prompts with a standardized "单个阶段标准执行流程" (Single-Stage Standard Execution Process) chapter that enforces:

1. Structured 6-step workflow for every stage
2. Mandatory Question tool usage for user interaction (no idle state)
3. Task-based HCritic invocation (replacing deprecated @HCritic mention)
4. User authorization before stage transitions
5. Proper workflow handover using set_hd_workflow_handover

---

## Requirements Breakdown

### Core Requirements

- [x] Add "单个阶段标准执行流程" section to all three agent prompts
- [x] Define 6-step process: Draft/TODO → Work → HCritic Review → User Confirm → Handover → Idle
- [x] Replace `@HCritic` mention with `task` tool invocation
- [x] Enforce Question tool usage for every sub-step (prevent idle state)
- [x] Clarify that stage transition requires user explicit consent
- [x] Document HCritic review loop (repeat until pass)

### Technical Changes

**Agent Invocation Method Updates:**
- [x] `@HCritic` → `task({ category: "quick", load_skills: [], ... })`
- [x] `delegate_task(...)` → `task({ subagent_type: "...", ... })` (HCollector only)

**Workflow Tool Usage:**
- [x] Clarify `set_hd_workflow_handover` is the correct tool (not `set_hd_workflow_stage`)
- [x] Handover only after HCritic pass + user confirmation

---

## Implementation Details

### Step 1: Draft and TODO List

**What agents must do:**
- Create/update `.hyper-designer/{stage_name}/draft.md`
- Use `todowrite` tool to create detailed atomic TODO list
- Each TODO item must be verifiable and atomic

**Prohibitions:**
- ❌ Skip TODO creation and start work directly
- ❌ Generic TODO items (e.g., "Complete requirement analysis")
- ❌ Not maintaining TODO status

---

### Step 2: Complete Stage Work (Question Tool Required)

**What agents must do:**
- Follow TODO list item by item
- **[CRITICAL]** After each sub-step, use Question tool to confirm with user (not idle)
- Follow loaded skill guidance and templates
- Use explore/librarian agents for research (if needed)
- Continuously update draft.md to record progress
- Generate formal deliverable documents

**Question Tool Usage Pattern:**

```javascript
question({
  questions: [{
    header: "Sub-task Confirmation",
    question: "I have completed {sub-task description}, recorded in draft. Please confirm:",
    multiple: false,
    options: [
      { label: "Confirm, continue", description: "This sub-task meets expectations" },
      { label: "Needs adjustment", description: "Have feedback on this sub-task" }
    ]
  }]
})
```

**Prohibitions:**
- ❌ After completing sub-step, saying "I've completed XX, now moving to next step..." and auto-continuing (this is idle behavior)
- ❌ Assuming user satisfaction without confirmation
- ❌ Not interacting with user before making technical decisions

---

### Step 3: HCritic Review via Task Tool (Mandatory Loop)

**What agents must do:**
1. Inform user: "正在请HCritic审查该阶段设计..."
2. **[MANDATORY]** Use task tool to invoke HCritic:

```javascript
task({
  category: "quick",
  load_skills: [],
  run_in_background: false,
  description: "HCritic审查{stage_name}文档",
  prompt: `请审查 {stage_name} 的输出文档：{document_paths}
审查重点：{stage-specific focus}
检查项：完整性、一致性、可实现性、规范性

请输出明确的审查结果：
1. 结论：通过 / 不通过
2. 具体反馈意见
3. 如果不通过，明确指出需要改进的地方`
})
```

3. **[MANDATORY]** Wait for HCritic review result (don't assume pass)
4. **[MANDATORY]** Analyze feedback:
   - **Not pass** → Return to Step 2 to revise, then re-execute Step 3
   - **Minor issues** → Revise and re-execute Step 3 to confirm
   - **Pass** → Continue to Step 4

**Prohibitions:**
- ❌ Use `@HCritic` mention (deprecated, not functional)
- ❌ Skip HCritic review and ask user directly
- ❌ HCritic says "not pass" but ignore and continue
- ❌ Self-judge "good enough" without waiting for explicit "pass"

---

### Step 4: User Confirmation via Question Tool (No Unauthorized Stage Transition)

**What agents must do:**
1. **[MANDATORY]** Only execute this step after HCritic review passes
2. **[MANDATORY]** Use Question tool:

```javascript
question({
  questions: [{
    header: "Stage Completion Confirmation",
    question: "This stage is complete, HCritic review passed. Output documents: {document_list}. Please choose next action:",
    multiple: false,
    options: [
      { 
        label: "Enter next stage", 
        description: "Current stage work is complete and satisfactory, ready for next stage." 
      },
      { 
        label: "Continue revising", 
        description: "Have feedback on current stage output, need adjustments before next stage." 
      }
    ]
  }]
})
```

3. **[MANDATORY]** Wait for user's explicit answer
4. **Based on user choice:**
   - **"Continue revising"** → Return to Step 2, after revision re-execute Step 3 and Step 4
   - **"Enter next stage"** → Continue to Step 5

**Prohibitions:**
- ❌ Ask user before HCritic passes
- ❌ Use plain text question instead of Question tool
- ❌ Assume user intent without waiting for explicit answer
- ❌ Execute Step 5 before user explicitly agrees

---

### Step 5: Call set_hd_workflow_handover for Handover

**What agents must do:**
1. **[MANDATORY]** Use `set_hd_workflow_handover` tool (not `set_hd_workflow_stage`)
2. Pass next stage name
3. Inform user: "已交接到下一阶段 {next_stage_name}"

```javascript
// Correct approach
set_hd_workflow_handover("next_stage_name")

// Wrong approach (prohibited)
set_hd_workflow_stage("current_stage_name", true)  // ❌ This doesn't trigger handover
```

**Prohibitions:**
- ❌ Use `set_hd_workflow_stage` instead of `set_hd_workflow_handover`
- ❌ Execute this step before user confirmation

---

### Step 6: Enter Idle

**What agents must do:**
1. After completing Step 5, naturally end current turn
2. System will auto-load next stage's skill (if applicable)
3. Wait for next stage work instructions

---

## Agent-Specific Considerations

### HArchitect

- Manages 5 stages: dataCollection, IRAnalysis, scenarioAnalysis, useCaseAnalysis, functionalRefinement
- Special case: dataCollection is handed over to HCollector
- After functionalRefinement completes, hands over to HEngineer for systemFunctionalDesign
- Updated "与HCritic协作" section to use task tool

### HEngineer

- Manages 2 stages with sub-steps:
  - systemFunctionalDesign: 系统需求分解 + 系统功能设计
  - moduleFunctionalDesign: 活动需求分解 + 模块功能设计
- Each sub-step requires user confirmation via Question tool
- Updated "与HCritic协作" section to use task tool

### HCollector

- Single stage: dataCollection with 4 sub-phases
- Sub-phases: 自动发现 → 访谈 → 生成索引 → 审查确认
- Each sub-phase requires Question tool confirmation
- Updated agent invocation from `delegate_task` to `task`
- Hands over to HArchitect's IRAnalysis when complete

---

## Files Modified

1. ✅ `/home/li/.config/opencode/hyper-designer/src/agents/HArchitect/identity_constraints.md`
   - Added "🔥 单个阶段标准执行流程（必读）" section
   - Updated HCritic invocation from @mention to task tool
   - Updated "与HCritic协作" section

2. ✅ `/home/li/.config/opencode/hyper-designer/src/agents/HEngineer/identity_constraints.md`
   - Added "🔥 单个阶段标准执行流程（必读）" section
   - Updated HCritic invocation from @mention to task tool
   - Updated "与HCritic协作" section

3. ✅ `/home/li/.config/opencode/hyper-designer/src/agents/HCollector/identity_constraints.md`
   - Added "🔥 单个阶段标准执行流程（必读）" section
   - Updated agent invocations from delegate_task to task tool
   - Updated "阶段4" to include HCritic review before user confirmation
   - Updated "终止条件" section

---

## Quality Assurance Checklist

- [x] All 3 agent prompts have standardized 6-step workflow section
- [x] Question tool usage is mandatory for every sub-step
- [x] HCritic invocation uses task tool (not @mention)
- [x] HCritic review loop is enforced (repeat until pass)
- [x] User confirmation required before stage transition
- [x] set_hd_workflow_handover usage is clarified
- [x] All prohibitions are clearly documented
- [x] Agent-specific nuances are preserved (e.g., HCollector sub-phases)
- [x] Consistent formatting and structure across all 3 files

---

## Expected Behavior Changes

### Before Enhancement

**Problems:**
- Agents would complete sub-steps and auto-continue without user confirmation
- HCritic was called via @mention (no longer functional)
- No standardized workflow process
- Agents might skip HCritic review
- User authorization was implicit, not explicit

### After Enhancement

**Improvements:**
- Every sub-step requires Question tool confirmation (no idle state)
- HCritic is properly invoked via task tool
- Mandatory 6-step workflow process enforced
- HCritic review must pass before user confirmation
- User must explicitly authorize stage transition via Question tool
- Clear prohibitions prevent unauthorized progression

---

## Testing Recommendations

1. **Test HCritic Invocation**: Verify that task tool properly invokes HCritic agent
2. **Test Question Tool Usage**: Ensure agents use Question tool after every sub-step
3. **Test Review Loop**: Verify agents re-submit to HCritic after revisions
4. **Test User Authorization**: Confirm agents wait for explicit user consent before handover
5. **Test Workflow Handover**: Verify set_hd_workflow_handover triggers stage transition correctly

---

## Completion Status

✅ **All modifications completed successfully**

- 3/3 agent prompts enhanced
- 6-step workflow documented in all agents
- HCritic invocation method updated
- Question tool usage enforced
- User authorization process clarified
- Workflow handover mechanism documented

**Next Steps:**
- Monitor agent behavior in production to ensure compliance
- Gather user feedback on new interaction patterns
- Iterate on Question tool prompts if needed
