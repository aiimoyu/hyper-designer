## 当前阶段：工作流初始化

**Phase State**: Uninitialized  
**Trigger**: `currentStep === null` or first launch

### Objective

Cold-start the workflow: generate a reference materials form, guide the user to fill it in, then hand off to the first phase (`IRAnalysis`).

---

### Execution Steps

**Step 1 — Check for existing checklist**

- If `REFERENCE.md` exists in the project root → skip creation, go to Step 3
- If not → proceed to Step 2

**Step 2 — Create `REFERENCE.md`**

Write the following to the project root immediately, no commentary:

```markdown
# 项目资料清单

> 本资料清单用于收集工作流各阶段所需的参考资料。
> 请在对应阶段开始前填写该阶段所需的资料信息。
> 每项资料可填写：文件路径、URL链接、或文字描述。
> 如无可用资料，请留空，系统会在该阶段提示您补充。

---

## 1. Codebase (代码库) `[domain: codebase]`

| 子类别 | 说明 | 您的资料（路径/链接/描述） |
| --- | --- | --- |
| 本项目代码 | 当前开发项目的源代码 | |
| 参考项目代码 | 用于参考对比的外部或遗留项目 | |

## 2. Domain Analysis Materials (领域分析资料) `[domain: domainAnalysis]`

| 子类别 | 说明 | 您的资料（路径/链接/描述） |
| --- | --- | --- |
| 领域架构分析 | 架构图、领域模型、边界上下文 | |
| 领域威胁分析 | 安全威胁、风险评估、缓解策略 | |
| 规范管理 | 行业标准、监管要求、编码规范 | |
| 特殊领域需求 | 领域特定约束、业务规则、边界情况 | |
| 需求评审分析 | 评审记录、审批记录、变更请求 | |

## 3. System Requirement Analysis Materials (系统需求分析资料) `[domain: systemRequirementAnalysis]`

| 子类别 | 说明 | 您的资料（路径/链接/描述） |
| --- | --- | --- |
| 场景库 | 用户场景、用例、业务流程 | |
| FMEA库 | 故障模式、影响分析、预防措施 | |
| 功能库 | 功能列表、需求规格、验收标准 | |

## 4. System Design Materials (系统设计资料) `[domain: systemDesign]`

| 子类别 | 说明 | 您的资料（路径/链接/描述） |
| --- | --- | --- |
| 业界设计参考 | 最佳实践、设计模式、行业案例 | |
| 系统设计说明书 | 高层系统架构、组件交互 | |
| 模块功能设计说明书 | 详细模块设计、接口、数据结构 | |
```

**Step 3 — User confirmation**

Prompt the user once, directly:

> `REFERENCE.md` is ready. Fill in whatever reference materials you have on hand — you don't need to complete everything now, only the relevant section is needed before each phase starts. Select **"Done, proceed"** when ready.

Options: `已完成，进入下一步` | `查看资料清单`

**Step 4 — Hand off**

Upon "Done, proceed": call `hd_handover("IRAnalysis")` immediately, then enter Idle state.

---

### Behavioral Rules

- No explanations, no summaries — execute steps in sequence
- Do not ask clarifying questions
- Do not repeat or confirm file contents back to the user unless they select "View checklist"
- Minimize turns: this phase should complete in **1–2 interactions**
