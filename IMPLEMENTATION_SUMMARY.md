# HArchitect & HCritic Implementation Summary

## Overview

This document summarizes the implementation of HArchitect (System Architect agent), HCritic (Design Review agent), and the workflow stage skills system for the hyper-designer project.

## Components Implemented

### 1. HArchitect Agent

**Location:** `src/agents/HArchitect/`

**Files Created:**

- `index.ts` - Agent factory and configuration
- `identity_constraints.md` - Complete system prompt with workflow management instructions

**Key Features:**

- Manages 9-stage requirements engineering workflow
- Coordinates with HCollector for data collection phase
- Integrates with HCritic for design review at each stage
- Maintains draft files for work-in-progress tracking
- Uses workflow state tools to manage stage transitions

**Workflow Stages Managed:**

1. Data Collection (delegated to HCollector)
2. Initial Requirement Analysis
3. Scenario Analysis
4. Use Case Analysis
5. Functional List Refinement
6. System Requirement Decomposition
7. System Functional Design
8. Activity Requirement Decomposition
9. Module Functional Design

**Permissions:**

- Read: ✅ (research and context gathering)
- Write/Edit: ✅ (design document creation)
- Bash: ❌ (no implementation)
- Workflow Tools: ✅ (stage management)

### 2. HCritic Agent

**Location:** `src/agents/HCritic/`

**Files Created:**

- `index.ts` - Agent factory and configuration
- `identity_constraints.md` - Review criteria and process guidelines

**Key Features:**

- Read-only design reviewer
- Four-dimension review framework:
  - Completeness (完整性)
  - Consistency (一致性)
  - Feasibility (可实现性)
  - Conformance (规范性)
- Structured feedback format with pass/fail decision
- Priority-based issue reporting
- Stage-specific review focus areas

**Permissions:**

- Read: ✅ (document review)
- Write/Edit: ❌ (read-only reviewer)
- Bash: ❌ (no execution)
- Delegation: ❌ (focused reviewer)

### 3. Workflow Stage Skills

**Location:** `src/skills/`

**Skills Implemented:**

#### Fully Detailed Skills

1. **initial-requirement-analysis.md**
   - 5W1H questioning framework
   - SMART requirements principles
   - Requirement classification (functional, non-functional, constraints)
   - Common pitfalls and countermeasures
   - Interactive clarification sequences
   - Document generation templates

2. **scenario-analysis.md**
   - User journey mapping
   - Scenario classification (primary, alternative, exception)
   - Standard scenario description template
   - CRUD coverage checks
   - Role coverage checks
   - Visualization guidelines (sequence diagrams, state diagrams)

#### Placeholder Skills

1. use-case-analysis.md
2. functional-list-refinement.md
3. system-requirement-decomposition.md
4. system-functional-design.md
5. activity-requirement-decomposition.md
6. module-functional-design.md

**Note:** Placeholder skills contain basic structure and can be expanded following the pattern established in the detailed skills.

### 4. Workflow Hook System

**Location:** `src/workflow/hooks/opencode/workflow.ts`

**Enhancements:**

- Updated all stages to use HArchitect (except dataCollection → HCollector)
- Added skill injection mechanism
- Skills are automatically loaded and injected when stage handover occurs
- Stage-specific prompts guide HArchitect through each phase

**Skill Injection Flow:**

```
User confirms stage completion
  → HArchitect calls set_hd_workflow_handover(nextStage)
  → Hook detects handover on session.idle event
  → Hook loads skill markdown for nextStage
  → Hook injects skill content into prompt
  → HArchitect receives stage-specific guidance
```

### 5. Agent Registry Updates

**Location:** `src/agents/utils.ts`

**Changes:**

- Added HArchitect and HCritic to agent imports
- Updated `createBuiltinAgents()` to export HArchitect and HCritic
- Updated `BuiltinAgentName` type to include new agents

## Architecture Design

### Workflow Execution Flow

```
User Request
  ↓
HArchitect (Entry Point)
  ↓
[Stage 1] HArchitect → handover → HCollector (Data Collection)
  ↓
HCollector completes → handover back → HArchitect
  ↓
[Stage 2-9] HArchitect executes with stage-specific skill
  ↓ (each stage)
  ├─ Read .hyper-designer/document/manifest.md for references
  ├─ Interact with user to gather information
  ├─ Update .hyper-designer/{stage}/draft.md continuously
  ├─ Generate design documents
  ├─ Request user confirmation
  │   ├─ User requests changes → iterate
  │   └─ User confirms → proceed
  ├─ Delegate to HCritic for review
  │   ├─ HCritic fails → fix and re-review
  │   └─ HCritic passes → proceed
  ├─ set_hd_workflow_stage(current, completed=true)
  └─ set_hd_workflow_handover(nextStage)
```

### Design Principles

**1. Separation of Concerns**

- HArchitect: Workflow orchestration and design execution
- HCollector: Data and reference collection
- HCritic: Quality assurance and review
- Skills: Stage-specific guidance and best practices

**2. Stateful Workflow Management**

- Workflow state stored in `.hyper-designer/workflow_state.json`
- Tools for querying and updating workflow state
- Hook system for automated stage transitions
- Draft files for context persistence across interactions

**3. Skill-Based Guidance**

- Each stage has dedicated skill markdown
- Skills provide templates, checklists, and best practices
- Skills loaded dynamically based on workflow state
- Decoupled from agent logic for maintainability

**4. Quality Gates**

- HCritic review required at each stage
- User confirmation required before stage transition
- Structured feedback with pass/fail criteria
- Priority-based issue tracking

## Directory Structure

```
hyper-designer/
├── src/
│   ├── agents/
│   │   ├── HArchitect/
│   │   │   ├── index.ts
│   │   │   └── identity_constraints.md
│   │   ├── HCritic/
│   │   │   ├── index.ts
│   │   │   └── identity_constraints.md
│   │   ├── HCollector/
│   │   │   ├── index.ts
│   │   │   ├── identity_constraints.md
│   │   │   └── interview_mode.md
│   │   ├── clarifier/
│   │   ├── types.ts (updated)
│   │   └── utils.ts (updated)
│   ├── skills/
│   │   ├── initial-requirement-analysis.md ✅ Complete
│   │   ├── scenario-analysis.md ✅ Complete
│   │   ├── use-case-analysis.md ⚠️ Placeholder
│   │   ├── functional-list-refinement.md ⚠️ Placeholder
│   │   ├── system-requirement-decomposition.md ⚠️ Placeholder
│   │   ├── system-functional-design.md ⚠️ Placeholder
│   │   ├── activity-requirement-decomposition.md ⚠️ Placeholder
│   │   └── module-functional-design.md ⚠️ Placeholder
│   └── workflow/
│       ├── state.ts
│       └── hooks/
│           └── opencode/
│               └── workflow.ts (updated with skill injection)
└── opencode/
    └── .plugins/
        └── hyper-designer.ts (exports HArchitect & HCritic)
```

## Usage Example

### Starting a New System Design

```typescript
// User starts with HArchitect
User: "I want to design a real-time notification system"

// HArchitect checks workflow state, starts from stage 1
HArchitect: "Let me check the workflow state..."
// Uses: get_hd_workflow_state()
// Result: All stages not completed, currentStep: null

HArchitect: "We'll begin with data collection. Let me hand over to HCollector."
// Uses: set_hd_workflow_handover("dataCollection")
// Hook automatically triggers HCollector on session.idle

HCollector: "Starting data collection phase..."
// HCollector collects references, creates .hyper-designer/document/manifest.md
// HCollector: "Data collection complete. Handing back to HArchitect."
// Uses: set_hd_workflow_handover("IRAnalysis")

// Hook loads initial-requirement-analysis.md skill
HArchitect: "Entering initial requirement analysis phase. 
Based on the collected materials, let's clarify your requirements..."
// HArchitect has access to skill guidance for this stage
// Interactive Q&A with user
// Updates draft: .hyper-designer/IRAnalysis/draft.md
// Generates: .hyper-designer/IRAnalysis/需求信息.md

HArchitect: "Initial requirements documented. 
Can we proceed to the next stage, or would you like to make changes?"

User: "Looks good, proceed."

HArchitect: "Requesting design review from HCritic..."
// Uses: delegate_task to HCritic with review request

HCritic: "Reviewing initial requirement analysis..."
// Result: "✅ Passed - All dimensions acceptable"

HArchitect: "Review passed. Marking stage complete and proceeding to scenario analysis."
// Uses: set_hd_workflow_stage("IRAnalysis", true)
// Uses: set_hd_workflow_handover("scenarioAnalysis")

// Hook loads scenario-analysis.md skill
HArchitect: "Entering scenario analysis phase..."
// Process repeats for each stage
```

## Integration Points

### With OpenCode Framework

- Plugin exports agents via `opencode/.plugins/hyper-designer.ts`
- Workflow tools registered as OpenCode tools
- Event hooks for `session.idle` to trigger handovers
- Agent switching mechanism via handover system

### With Existing Agents

- **HCollector**: Used for stage 1 (data collection)
- **Clarifier**: Not used in new workflow (replaced by HArchitect with skills)
- **HArchitect**: Central coordinator for stages 2-9
- **HCritic**: Called as subagent for reviews

## Extension Points

### Adding New Skills

1. Create markdown file in `src/skills/{skill-name}.md`
2. Follow structure from existing detailed skills
3. Update `loadSkillForStage()` mapping in `workflow.ts`
4. No code changes required - skills are dynamically loaded

### Adding New Workflow Stages

1. Update `Workflow` interface in `src/workflow/state.ts`
2. Add stage to `HANDOVER_CONFIG` in `workflow.ts`
3. Create corresponding skill file
4. Update HArchitect identity constraints if needed

### Customizing Review Criteria

- Edit `src/agents/HCritic/identity_constraints.md`
- Modify stage-specific review focus sections
- Add new review dimensions if needed
- Update review template structure

## Testing Checklist

### Unit Testing (Manual)

- [ ] HArchitect agent loads successfully
- [ ] HCritic agent loads successfully
- [ ] Workflow state tools work correctly
- [ ] Skill files load without errors
- [ ] Handover mechanism triggers correctly

### Integration Testing

- [ ] Complete workflow from stage 1 to stage 9
- [ ] HCollector handover and return
- [ ] HCritic review integration
- [ ] Skill injection at each stage
- [ ] Draft file creation and updates
- [ ] Document generation at each stage

### Edge Cases

- [ ] Workflow state persistence across sessions
- [ ] Handling missing skill files gracefully
- [ ] Multiple review iterations
- [ ] User-requested changes mid-stage
- [ ] Incomplete stage handling

## Known Limitations

1. **Placeholder Skills**: Stages 4-9 have placeholder skills that need detailed implementation following the pattern of stages 2-3.

2. **No Automated Tests**: Current implementation lacks automated unit/integration tests. Recommend adding Jest or Vitest.

3. **Skill File Path**: Currently assumes execution from project root. May need path resolution improvements for different execution contexts.

4. **TypeScript Compilation**: Project doesn't have tsconfig.json in root. May need to add for proper type checking.

5. **Error Handling**: Skill loading has basic try-catch but could be more robust with fallback strategies.

## Future Enhancements

### High Priority

1. Complete all placeholder skills (stages 4-9) with detailed guidance
2. Add TypeScript configuration and type checking
3. Add automated tests for workflow state management
4. Improve error handling and logging

### Medium Priority

1. Add workflow visualization (Mermaid diagram generation)
2. Implement stage skip/rollback capabilities
3. Add workflow state export/import for backup
4. Create skill validation framework

### Low Priority

1. Add metrics tracking (time per stage, iterations needed)
2. Create workflow templates for common system types
3. Add AI-assisted skill generation
4. Build interactive workflow dashboard

## Maintenance Guide

### Updating Agent Prompts

- Agent identity constraints in `{agent}/identity_constraints.md`
- Modify without code changes - agents reload on instantiation
- Test changes by creating new agent instance

### Updating Skills

- Skills in `src/skills/{stage-name}.md`
- Markdown format for easy editing
- Changes take effect on next stage handover
- Version control recommended for tracking changes

### Debugging Workflow Issues

1. Check workflow state: `get_hd_workflow_state()`
2. Verify hook registration in plugin
3. Check skill file existence and permissions
4. Review session event logs for handover triggers
5. Validate workflow state JSON file

## Conclusion

This implementation provides a comprehensive requirements engineering workflow system with:

- ✅ Two new specialized agents (HArchitect, HCritic)
- ✅ Dynamic skill injection system
- ✅ Workflow state management
- ✅ Quality assurance integration
- ✅ Extensible architecture

The system is ready for use with stages 2-3 fully detailed. Stages 4-9 have placeholders that can be completed following established patterns.

**Total Implementation:**

- 2 new agents (HArchitect, HCritic)
- 8 skill files (2 detailed, 6 placeholders)
- Updated workflow hooks with skill injection
- Updated agent registry and types
- Comprehensive documentation

**Lines of Code Added:**

- ~400 lines TypeScript (agents + workflow hooks)
- ~12,000 lines Markdown (prompts + skills)
- Total: ~12,400 lines
