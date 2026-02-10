# HArchitect Quick Start Guide

## Starting a New System Design

### Step 1: Initialize with HArchitect

```
User: "I want to design a [system description]"
```

HArchitect will:

1. Check workflow state
2. Begin with data collection phase
3. Hand over to HCollector automatically

### Step 2: Data Collection (HCollector)

HCollector will:

- Ask about existing resources
- Search for reference materials
- Create `.hyper-designer/document/manifest.md`
- Hand back to HArchitect when complete

### Step 3: Requirement Analysis (HArchitect + Skill)

HArchitect will:

- Load initial-requirement-analysis skill
- Ask systematic questions (5W1H framework)
- Update draft: `.hyper-designer/IRAnalysis/draft.md`
- Generate: `.hyper-designer/IRAnalysis/需求信息.md`
- Ask: "Ready to proceed to next stage?"

When you confirm → HCritic reviews → If passed → Next stage

### Step 4-9: Iterative Design Stages

Each stage follows the same pattern:

1. HArchitect loads stage-specific skill
2. Interactive analysis with user
3. Draft updates
4. Document generation
5. User confirmation
6. HCritic review
7. Stage transition

## Key Commands

### Check Workflow Status

```
"What's the current workflow status?"
```

HArchitect uses: `get_hd_workflow_state()`

### Request Stage Transition

```
"I'm satisfied with this stage, let's proceed."
```

HArchitect will:

1. Call HCritic for review
2. If passed: `set_hd_workflow_stage(current, true)`
3. `set_hd_workflow_handover(nextStage)`

### Request Changes

```
"I want to modify [aspect] in the current document."
```

HArchitect will iterate on the current stage without transitioning.

## Expected Outputs

### By Stage

| Stage | Output Files |
|-------|-------------|
| 1. Data Collection | `.hyper-designer/document/manifest.md` |
| 2. Requirement Analysis | `.hyper-designer/IRAnalysis/需求信息.md` |
| 3. Scenario Analysis | `.hyper-designer/scenarioAnalysis/{功能}场景.md` |
| 4. Use Case Analysis | `.hyper-designer/useCaseAnalysis/{功能}用例.md` |
| 5. Functional List | `.hyper-designer/functionalRefinement/{功能}功能列表.md`<br>`.hyper-designer/functionalRefinement/{功能}FMEA.md` |
| 6. System Decomposition | `.hyper-designer/systemRequirementDecomposition/系统需求分解.md` |
| 7. System Design | `.hyper-designer/systemFunctionalDesign/系统功能设计.md` |
| 8. Activity Decomposition | `.hyper-designer/activityRequirementDecomposition/活动需求分解.md` |
| 9. Module Design | `.hyper-designer/moduleFunctionalDesign/{模块}设计.md` |

### Draft Files

Each stage also creates: `.hyper-designer/{stage}/draft.md`

## Tips for Effective Use

### 1. Be Specific in Initial Request

❌ "Design a system"
✅ "Design a real-time notification system for a social media app supporting 10k concurrent users"

### 2. Reference Existing Materials

If you have:

- Existing codebase → Mention it
- Reference projects → Provide links/paths
- Domain documents → Share locations

HCollector will incorporate these in data collection.

### 3. Answer Questions Thoroughly

HArchitect will ask systematic questions. Detailed answers lead to better designs.

### 4. Review Drafts Regularly

Check `.hyper-designer/{stage}/draft.md` to see:

- What HArchitect understood
- What decisions were made
- What questions remain

### 5. Iterate Before Moving On

Don't rush through stages. Each builds on the previous.

- Review generated documents carefully
- Request clarifications or changes
- Only proceed when satisfied

### 6. Trust the Review Process

HCritic will catch:

- Incomplete information
- Inconsistencies
- Feasibility issues
- Format problems

If review fails, address feedback before proceeding.

## Common Scenarios

### Scenario 1: New System from Scratch

```
User: "Design a task management system"
→ Full workflow stages 1-9
→ Complete documentation set
```

### Scenario 2: Existing System Enhancement

```
User: "Add real-time collaboration to existing task system"
→ HCollector finds existing code
→ Stages focus on new feature
→ Integration considerations in design
```

### Scenario 3: Reference-Based Design

```
User: "Design an auth system like [reference project]"
→ HCollector analyzes reference
→ Stages adapt patterns
→ Custom requirements integrated
```

## Troubleshooting

### Issue: Workflow state seems stuck

**Solution:**

```
"Check workflow state"
```

If needed, manually check: `.hyper-designer/workflow_state.json`

### Issue: Missing reference materials

**Solution:**
Return to stage 1:

```
"Let's go back to data collection, I have more materials"
```

### Issue: HCritic keeps failing

**Solution:**

- Review HCritic feedback carefully
- Address specific issues mentioned
- Ask HArchitect to explain unclear points
- Iterate until quality standards met

### Issue: Want to skip a stage

**Solution:**
Not recommended, but if needed:

- Manually create expected output documents
- Mark stage complete manually (requires workflow tool access)
- Better: Work through quickly with minimal detail

## Best Practices

### 1. Front-Load Information

Provide comprehensive context early (stage 1-2):

- Business goals
- Technical constraints
- Performance requirements
- Integration needs

### 2. Maintain Consistency

Use consistent terminology throughout:

- Define terms in stage 2
- Reference definitions in later stages
- Update draft when terms change

### 3. Document Decisions

When making design choices:

- State the decision clearly
- Provide reasoning
- Consider alternatives
- Document in draft

### 4. Leverage Skills

Skills provide:

- Question frameworks
- Document templates
- Quality checklists
- Common pitfall warnings

Read injected skills during each stage.

### 5. Incremental Refinement

Don't expect perfection in first iteration:

- Draft documents
- Review with HCritic
- Refine based on feedback
- Iterate until satisfied

## Example Session Flow

```
[User] "Design a URL shortener service"

[HArchitect] "Starting workflow. Handing over to HCollector for data collection..."

[HCollector] "Do you have any existing codebase or reference materials?"
[User] "Check bit.ly and TinyURL as references"
[HCollector] "Analyzing references... [creates index.md] ...Handing back to HArchitect"

[HArchitect] "Entering requirement analysis. What's the expected user load?"
[User] "100k requests/day initially, scaling to 1M"
[HArchitect] "What are the key features needed?"
[User] "URL shortening, custom aliases, analytics, API access"
[... interactive Q&A ...]
[HArchitect] "Generated requirements document. Review: [shows content]"
[HArchitect] "Satisfied with this stage?"
[User] "Yes, proceed"

[HArchitect] "Requesting HCritic review..."
[HCritic] "✅ Passed - Requirements are complete and well-defined"
[HArchitect] "Stage 2 complete. Moving to scenario analysis..."

[... stages 3-9 continue similarly ...]

[HArchitect] "All stages complete. Final deliverables:
- 9 design documents
- Complete system specification
- Ready for implementation"
```

## Getting Help

### During a Stage

```
"What should I focus on in this stage?"
```

HArchitect will reference the loaded skill for guidance.

### Understanding Output

```
"Explain the [section] in [document]"
```

HArchitect will clarify based on design decisions.

### Workflow Navigation

```
"Which stage are we in?"
"What's next?"
"What did we complete so far?"
```

HArchitect tracks and reports workflow progress.

---

**Remember:** The workflow is designed to ensure comprehensive, high-quality system design. Take your time with each stage for best results.
