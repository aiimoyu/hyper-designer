# Skill Development Guide

## Purpose
This guide explains how to create comprehensive skills for the remaining workflow stages (4-9).

## Skill Anatomy

### Required Sections

Every skill should include:

1. **技能用途 (Skill Purpose)**
   - What the skill provides
   - When it should be used

2. **何时加载此技能 (When to Load)**
   - Workflow stage mapping
   - Trigger conditions

3. **核心指导原则 (Core Guidance)**
   - Main content of the skill
   - Methods, frameworks, templates

4. **实战建议 (Practical Advice)**
   - Tips for user interaction
   - Common pitfall handling

5. **成功标准 (Success Criteria)**
   - What defines stage completion
   - Readiness signals for next stage

## Skill Template

```markdown
# Skill: [Stage Name]

## 技能用途
在[阶段名]阶段为HArchitect提供专业指导，帮助[主要目标]。

## 何时加载此技能
- 当workflow状态为 `[stageName]`
- 当需要[具体工作内容]时

## 核心指导原则

### 1. [方法论名称]

**[框架/方法描述]：**
[详细说明]

### 2. [关键活动]

**[活动描述]：**
```
[具体步骤或模板]
```

### 3. 利用前序文档

**强制流程：**
1. 读取 `.hyper-designer/[previous-stage]/[document].md`
2. 提取关键信息
3. 基于前序输出进行当前阶段工作

### 4. [特定技术/工具]

**[技术说明]：**
- 用途
- 使用方法
- 注意事项

### 5. 草稿管理指导

**草稿结构建议：**
```markdown
# [阶段名] 工作草稿

## [章节1]
内容

## [章节2]
内容
```

### 6. 文档生成指导

**[输出文档名]文档结构：**

```markdown
# [文档标题]

## 章节1
内容

## 章节2
内容
```

### 7. 质量自检清单

**在完成文档前，自检：**

```
□ 检查项1
□ 检查项2
□ 检查项3
```

## 实战建议

### 与用户交互的技巧

**[场景]：**
```
策略描述
示例对话
```

### 处理棘手情况

**情况1：[情况描述]**
```
策略：
1. 步骤1
2. 步骤2
```

## 成功标准

**该阶段成功的标志：**
1. 标准1
2. 标准2

**准备进入下一阶段的信号：**
- 信号1
- 信号2
```

## Stage-Specific Guidance

### Stage 4: Use Case Analysis

**Focus:** Transform scenarios into detailed use case specifications

**Key Elements to Include:**
- Use case template with all standard fields
- Input/output specification guidelines
- Acceptance criteria writing patterns
- Dependency mapping techniques
- Traceability to scenarios

**Reference:** See `scenario-analysis.md` for pattern

### Stage 5: Functional List Refinement

**Focus:** Comprehensive function list with prioritization and FMEA

**Key Elements to Include:**
- Function extraction from use cases
- Prioritization frameworks (MoSCoW, RICE, etc.)
- FMEA methodology and templates
- Dependency graph creation
- Complexity estimation techniques

**Special Requirements:**
- Dual outputs: function list + FMEA analysis
- Risk assessment framework
- Mitigation strategy templates

### Stage 6: System Requirement Decomposition

**Focus:** Break down system into modules with clear boundaries

**Key Elements to Include:**
- Module identification criteria
- Responsibility assignment patterns
- Interface definition standards
- Data flow modeling
- Module relationship mapping

**Technical Content:**
- Architecture patterns (layered, hexagonal, microservices, etc.)
- Interface design principles
- API contract templates

### Stage 7: System Functional Design

**Focus:** Detailed system architecture and interaction protocols

**Key Elements to Include:**
- Architecture diagram guidelines
- Technology stack selection criteria
- Component design patterns
- Data model design techniques
- Protocol specification templates

**Technical Depth:**
- Deep dive into architecture decisions
- Technology trade-off analysis
- Scalability considerations
- Security architecture

### Stage 8: Activity Requirement Decomposition

**Focus:** Break features into executable activities

**Key Elements to Include:**
- Activity identification method
- Input/output specification
- Dependency analysis
- Complexity estimation
- Work breakdown structure (WBS)

**Project Management Content:**
- Activity sequencing
- Critical path identification
- Resource estimation
- Timeline planning with Gantt charts

### Stage 9: Module Functional Design

**Focus:** Detailed technical specification for each module

**Key Elements to Include:**
- Class/interface design templates
- Algorithm specification format
- Data structure selection guidelines
- Error handling patterns
- Testing strategy templates

**Implementation-Ready Content:**
- Code-level interface definitions
- Pseudo-code for complex logic
- Performance considerations
- Testing approach

## Writing Tips

### 1. Be Specific
❌ "Ask questions about the requirements"
✅ "Use the 5W1H framework: What (functionality), Why (business value), Who (users/roles)..."

### 2. Provide Examples
Every template should include:
- Annotated example
- Multiple scenarios if applicable
- Good vs. bad examples

### 3. Include Checklists
Checklists help HArchitect ensure completeness:
```
□ Has section X?
□ Verified constraint Y?
□ Documented decision Z?
```

### 4. Reference Dependencies
Always specify:
- Which previous documents to read
- What information to extract
- How to apply it in current stage

### 5. Handle Uncertainty
Include guidance for:
- Missing information handling
- Assumption documentation
- Risk flagging
- User clarification requests

### 6. Quality Standards
Define what "good enough" means:
- Minimum content requirements
- Quality indicators
- Common anti-patterns to avoid

## Validation Checklist

Before considering a skill complete, verify:

### Content Completeness
- [ ] All required sections present
- [ ] At least 3 subsections in core guidance
- [ ] Document templates provided
- [ ] Quality checklists included
- [ ] Success criteria defined

### Practical Utility
- [ ] Provides actionable guidance (not just theory)
- [ ] Includes examples and templates
- [ ] Addresses common problems
- [ ] Gives interaction guidance

### Integration
- [ ] References previous stage outputs
- [ ] Defines current stage outputs
- [ ] Maps to next stage requirements
- [ ] Consistent with overall workflow

### Clarity
- [ ] Clear structure with headers
- [ ] Code blocks for templates
- [ ] Tables for comparisons
- [ ] Lists for checklists

### Completeness
- [ ] Covers the "happy path"
- [ ] Addresses common failure modes
- [ ] Provides troubleshooting guidance
- [ ] Includes tips for user interaction

## Testing Your Skill

### Unit Testing
1. **Read-through Test**
   - Can you understand it without context?
   - Are instructions clear and actionable?

2. **Template Test**
   - Can you fill out templates with example data?
   - Do they produce useful outputs?

3. **Checklist Test**
   - Do checklists catch real issues?
   - Are they comprehensive but not excessive?

### Integration Testing
1. **Workflow Test**
   - Load skill in HArchitect context
   - Verify it references correct previous documents
   - Check it produces expected outputs

2. **Consistency Test**
   - Compare with other skills
   - Ensure similar structure
   - Check terminology consistency

3. **User Simulation**
   - Roleplay as user
   - Follow skill guidance
   - Verify it leads to good outcomes

## Common Mistakes to Avoid

### 1. Too Generic
❌ "Analyze the requirements"
✅ "Analyze requirements using SMART criteria: Specific, Measurable..."

### 2. Too Prescriptive
❌ "Always use microservices architecture"
✅ "Consider microservices if: distributed teams, independent scaling needs..."

### 3. Missing Context
❌ Starts with "Define the interfaces"
✅ "Based on the module boundaries from stage 6, define the interfaces..."

### 4. No Examples
❌ Just provides template structure
✅ Template structure + filled example + explanation

### 5. Unclear Success Criteria
❌ "Document should be complete"
✅ "Document should have: all sections filled, no TBD markers, passed HCritic review"

## Skill Maintenance

### When to Update
- User feedback indicates confusion
- New best practices emerge
- Template formats evolve
- Integration issues discovered

### Version Control
- Track changes in git
- Document major updates
- Maintain changelog if extensive changes

### Deprecation
- Mark outdated sections clearly
- Provide migration guidance if structure changes
- Coordinate with agent prompt updates

## Advanced Techniques

### Conditional Guidance
```markdown
**If [condition]:**
- Guidance A

**Otherwise:**
- Guidance B
```

### Multi-Path Approaches
```markdown
### Approach 1: [Method A]
Best for: [scenarios]
Steps: ...

### Approach 2: [Method B]
Best for: [scenarios]
Steps: ...
```

### Progressive Disclosure
Start with essentials, then:
```markdown
### Basic Requirements
[Core content]

### Advanced Considerations (Optional)
[Deep dive]
```

## Resources

### Reference Skills
- `initial-requirement-analysis.md` - Full example with all sections
- `scenario-analysis.md` - Another complete example
- Both demonstrate the expected quality and depth

### Useful Frameworks
- SMART criteria (requirements)
- 5W1H questioning (analysis)
- FMEA (risk analysis)
- UML diagrams (modeling)
- User stories (requirements)
- Acceptance criteria (testing)

### Writing Style
- **Imperative mood** for instructions: "Define...", "Analyze...", "Create..."
- **Descriptive mood** for explanations: "This helps...", "Users need..."
- **Tables** for comparisons and mappings
- **Code blocks** for templates and examples
- **Lists** for steps and checklists

---

## Getting Started

### To Implement a Skill:
1. Copy the template above
2. Fill in stage-specific content from "Stage-Specific Guidance"
3. Review reference skills for depth and style
4. Validate against the checklist
5. Test with example scenarios
6. Iterate based on feedback

### Need Help?
- Review existing complete skills for patterns
- Check AGENTS.md for project conventions
- Test skills by using them with HArchitect
- Iterate based on actual usage

**Remember:** Skills directly guide HArchitect's interaction with users. Quality skills = better design outcomes.
