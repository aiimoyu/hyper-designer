# Agent 元数据优化总结

## 问题诊断

### 原始问题
HArchitect 和 HEngineer 总是不调用 HCritic 这个 Agent，而是调用其他评审 agent。

### 根本原因
1. **HCritic 的 mode 设置为 "subagent"**：导致框架可能不会主动推荐调用
2. **cost 标记为 "CHEAP"**：与实际审查成本不符（需要加载多个 skill 进行深度审查）
3. **描述不够突出触发场景**：其他 agent 不清楚何时、如何调用 HCritic
4. **缺少明确的调用时机说明**：元数据中没有强调"完成设计后必须调用 HCritic 审查"
5. **提示词中使用了错误的调用方式**：使用了 oh-my-opencode 特有的 `task()` 和 `call_omo_agent`

## 优化方案

### 1. HCritic 元数据优化

#### mode 修改
```typescript
// 之前：subagent（不易被推荐）
const MODE: AgentMode = "subagent"

// 优化后：all（所有场景都可用）
const MODE: AgentMode = "all"
```

#### cost 修正
```typescript
// 之前：CHEAP（低估了审查成本）
cost: "CHEAP"

// 优化后：EXPENSIVE（反映真实成本 - 需要加载多个 skill）
cost: "EXPENSIVE"
```

#### keyTrigger 强化
```typescript
// 之前：模糊的描述
keyTrigger: "Design review and quality assurance for requirements engineering documents"

// 优化后：明确强制调用时机
keyTrigger: "MANDATORY review after completing any workflow stage document - ensures quality before proceeding to next stage"
```

#### triggers 优化
```typescript
// 之前：一般性描述
triggers: [
  { domain: "Quality Assurance", trigger: "Need to review requirements or design documents" },
  { domain: "Design Review", trigger: "Verify completeness and consistency of design" },
  ...
]

// 优化后：具体场景触发
triggers: [
  { domain: "Quality Gate", trigger: "After HArchitect/HEngineer completes any stage document (IR, Scenario, UseCase, SR-AR, Design)" },
  { domain: "Design Review", trigger: "Before marking workflow stage as complete - verify document passes all quality criteria" },
  { domain: "Iterative Improvement", trigger: "Document failed previous review and needs re-validation after fixes" },
]
```

#### useWhen 详细化
```typescript
// 之前：抽象描述
useWhen: [
  "Requirements documents need review",
  "Design documents need validation",
  ...
]

// 优化后：具体操作场景
useWhen: [
  "HArchitect/HEngineer just finished writing IR信息.md, 功能场景.md, 用例.md, etc.",
  "About to mark a workflow stage as complete (set_hd_workflow_stage)",
  "Need structured feedback on document completeness, consistency, feasibility, and conformance",
  "Document previously failed review and has been revised",
  "Want to ensure document quality meets standards before next stage",
]
```

#### description 完善
```typescript
// 之前：简单描述
description: "Design Critic - Reviews requirements and design documents for completeness, consistency, and quality. Read-only reviewer that provides structured feedback."

// 优化后：明确调用要求和价值
description: "Design Quality Gate & Review Agent - MUST be called after HArchitect/HEngineer completes any stage document. Provides structured quality assessment (completeness, consistency, feasibility, conformance) with Pass/Fail decision. Skill-driven review using stage-specific checklists. Read-only reviewer. Call BEFORE marking workflow stage complete."
```

#### tools 补充
```typescript
tools: {
  Read: true,
  Grep: true,
  Glob: true,
  
  // 新增：允许加载阶段特定的 skills
  slashcommand: true,
  
  Write: false,
  Edit: false,
  Bash: false,
  Question: false,
  delegate_task: false,
}
```

---

### 2. HArchitect 元数据优化

#### keyTrigger 强化职责边界
```typescript
// 之前：模糊的工作流描述
keyTrigger: "Requirements engineering and early-stage analysis workflow"

// 优化后：明确调用 HCritic 的要求
keyTrigger: "Requirements engineering workflow coordinator - from data collection to functional refinement. MUST delegate to @HCritic after completing each stage document."
```

#### triggers 明确阶段范围
```typescript
triggers: [
  { domain: "Requirements Engineering", trigger: "Starting requirements analysis workflow (IR Analysis → Scenario → UseCase → Functional Refinement)" },
  { domain: "System Analysis", trigger: "Need structured requirements breakdown before detailed design" },
  { domain: "Workflow Coordination", trigger: "Managing multi-stage requirements process with quality gates (HCritic) and handover to HEngineer" },
]
```

#### description 强调审查流程
```typescript
description: "System Architect & Requirements Workflow Coordinator - Manages requirements engineering from data collection (delegates to @HCollector) through functional refinement. After completing each stage document, MUST call @HCritic for quality gate review. Hands over to @HEngineer for system/module design phases. Coordinates multi-stage design with formal documentation and review cycles."
```

#### identity_constraints.md 修正调用方式
```markdown
# 之前：使用 oh-my-opencode 特有的 task() 工具
b. 使用 task() 调用HCritic进行审查
   - 【强制】使用task()工具调用HCritic，prompt格式见下方"委托HCritic的提示词格式"

# 优化后：使用 @ 提及方式
b. 【强制】使用 @HCritic 提及方式调用HCritic进行审查
   - 明确说明："@HCritic 请审查 {阶段名} 的输出文档：{文档路径列表}"
```

#### 移除 call_omo_agent 工具
```typescript
// 之前：包含 oh-my-opencode 特有工具
tools: {
  ...
  delegate_task: true,
  call_omo_agent: true,  // ❌ 移除
  Question: true,
  ...
}

// 优化后：仅保留通用工具
tools: {
  ...
  delegate_task: true,
  Question: true,
  ...
}
```

---

### 3. HEngineer 元数据优化

#### keyTrigger 明确接管时机和审查要求
```typescript
// 之前：简单描述
keyTrigger: "System and module level detailed design"

// 优化后：明确上下游关系和审查要求
keyTrigger: "System and module detailed design - takes over after HArchitect completes functional refinement. MUST call @HCritic after completing each design stage."
```

#### triggers 细化技术设计场景
```typescript
triggers: [
  { domain: "System Design", trigger: "Need system requirement decomposition (SR-AR) and system functional design (architecture, tech stack, data models)" },
  { domain: "Module Design", trigger: "Need module functional design (detailed class design, algorithms, implementation specs)" },
  { domain: "Technical Specification", trigger: "Require implementable technical design documents ready for coding" },
]
```

#### description 强调技术深度和审查流程
```typescript
description: "System Engineer & Technical Design Specialist - Executes system-level design (SR-AR decomposition + system functional design: architecture, tech stack, data models) and module-level design (detailed class design, algorithms, implementation specs). Takes over from @HArchitect after functional refinement. After completing each stage document, MUST call @HCritic for quality gate review."
```

#### identity_constraints.md 同步修正
- 修正调用方式：`task()` → `@HCritic`
- 移除 `call_omo_agent` 相关说明

---

### 4. HCollector 元数据优化

#### keyTrigger 明确被委托角色
```typescript
// 之前：模糊的触发场景
keyTrigger: "New project or unclear requirements → fire `HCollector` for discovery"

// 优化后：明确委托关系
keyTrigger: "Data collection phase - typically delegated by @HArchitect at workflow start. Gathers reference materials, interviews users, and prepares context for requirements analysis."
```

#### triggers 聚焦数据收集阶段
```typescript
triggers: [
  { domain: "Data Collection", trigger: "Start of workflow - need to collect reference materials, existing docs, and user context" },
  { domain: "Requirements Gathering", trigger: "User has vague ideas - need interview mode to extract structured information" },
  { domain: "Research", trigger: "Need to investigate existing solutions, similar systems, or domain knowledge" },
]
```

#### description 强调只读和准备角色
```typescript
description: "Data Collection & Requirements Gathering Specialist - Typically delegated by @HArchitect at workflow start. Conducts user interviews to clarify vague requirements, collects reference materials and existing documentation, researches domain knowledge and similar systems. Prepares comprehensive context for requirements analysis. Read-mostly agent focused on discovery and information gathering."
```

---

## 优化效果预期

### 1. HCritic 可发现性提升
- **mode = "all"**：所有场景都可用，不受限制
- **cost = "EXPENSIVE"**：准确反映审查成本，避免被低估
- **明确的 keyTrigger**：使用 "MANDATORY" 强调强制性

### 2. 调用时机明确化
- **HArchitect/HEngineer 的 description**：明确写入 "MUST call @HCritic"
- **triggers 具体化**：从抽象描述到具体操作场景
- **useWhen 详细化**：列举实际使用场景和文件名

### 3. 角色边界清晰化
- **HArchitect**：需求工程（到 functionalRefinement）
- **HEngineer**：技术设计（systemFunctionalDesign + moduleFunctionalDesign）
- **HCritic**：质量门（每个阶段完成后强制审查）
- **HCollector**：数据收集（工作流起点）

### 4. 调用方式修正
- **移除 oh-my-opencode 特有工具**：`call_omo_agent`、`task()`
- **使用通用 @ 提及方式**：`@HCritic 请审查...`
- **保留通用工具**：`delegate_task`、`Question`

---

## 验证要点

### 1. HCritic 是否被推荐
- [ ] HArchitect 完成阶段文档后，系统是否推荐调用 HCritic
- [ ] HEngineer 完成阶段文档后，系统是否推荐调用 HCritic
- [ ] 元数据中的 "MANDATORY" 和 "MUST" 是否足够醒目

### 2. 调用方式是否正确
- [ ] 不再使用 `task()` 或 `call_omo_agent`
- [ ] 使用 `@HCritic` 提及方式
- [ ] HCritic 能够正确响应审查请求

### 3. 工作流衔接是否顺畅
- [ ] HArchitect → HCritic → HEngineer 流程完整
- [ ] HEngineer → HCritic → 下一阶段 流程完整
- [ ] 审查失败后的修改-重审循环是否正常

### 4. 元数据一致性
- [ ] 所有 agent 的 description 准确反映职责
- [ ] triggers 和 useWhen 覆盖实际使用场景
- [ ] cost 标记与实际消耗匹配

---

## 文件修改清单

### 修改的文件
1. `src/agents/HCritic/index.ts` - 元数据和 mode/cost 修正
2. `src/agents/HArchitect/index.ts` - 元数据强化和工具清理
3. `src/agents/HArchitect/identity_constraints.md` - 调用方式修正
4. `src/agents/HArchitect/interview_mode.md` - 调用方式修正
5. `src/agents/HEngineer/index.ts` - 元数据强化和工具清理
6. `src/agents/HEngineer/identity_constraints.md` - 调用方式修正
7. `src/agents/HEngineer/interview_mode.md` - 调用方式修正
8. `src/agents/HCollector/index.ts` - 元数据优化和工具清理

### 主要变更统计
- 9 个文件修改
- +326 行新增
- -146 行删除
- 净增 180 行

---

## 下一步建议

1. **测试完整工作流**：从 HArchitect 开始到 HEngineer 完成的完整流程
2. **验证 HCritic 调用频率**：确认每个阶段都正确调用了 HCritic
3. **监控审查质量**：HCritic 的反馈是否有效帮助改进文档
4. **收集使用反馈**：实际使用中是否还有元数据不清晰的地方

---

生成时间：2026-02-09
