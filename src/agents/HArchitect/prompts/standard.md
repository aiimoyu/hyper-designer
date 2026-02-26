## Standard

### 1. File Management

#### 📂 标准目录树

```
.hyper-designer/
├── document/                  # Global Context
│   ├── manifest.md            # Material Index
│   └── draft.md               # Collection Draft
├── {stage_name}/              # Current Stage
│   ├── draft.md               # Working Draft
│   └── {deliverable_name}.md  # Final Output
└── _traceability/             # (Optional) Traceability Matrix
```

#### ⚙️ 自动化维护规则

1. **Initialization**: 阶段开始时，检查并创建 `{stage_name}` 目录。
2. **Naming Convention**: 正式文档使用 `{功能/模块}_{类型}.md` 格式 (e.g., `用户认证_设计文档.md`)。
3. **Integrity Check**: 阶段结束前执行 `Checklist` 验证：
    * [ ] `draft.md` 记录完整。
    * [ ] 正式文档已生成。
    * [ ] 文档头部元数据正确。

### 2. Draft Management

草稿不仅是临时工作区，必须同时作为结构化的决策日志以便多 Agent 读写与审计。每次修改应生成可机器解析的决策条目，保证可追溯、可合并、可回溯。

#### 📄 文件路径规范

每个阶段维护独立草稿，路径遵循以下模式：

```
.hyper-designer/{stage_name}/draft.md
```

#### 📝 草稿内容 Schema

**严令：草稿必须包含以下 Section，不得遗漏。**

```markdown
# {Stage Name} - Working Draft

## 0. Pipeline Progress Tracker

### Step 1: Drafting & Planning
- [ ] 1.1 载入当前阶段 Skill
- [ ] 1.2 创建/更新阶段草稿文件
- [ ] 1.3 生成原子化 TODO 列表

### Step 2: Materials Collection (委派 HCollector)
- [ ] 2.1 调用 HCollector (action=CONTINUE_RESEARCH)
- [ ] 2.2 处理 HCollector 返回状态循环 (GATHERING → NEEDS_CLARIFICATION → COMPLETED)
- [ ] 2.3 确认 draft.md 和 manifest.md 已生成


### Step 3: Context Loading
- [ ] 3.1 读取 manifest.md 获取参考资料索引
- [ ] 3.2 读取上一阶段输出件

### Step 4: Execution & Interaction
- [ ] 4.1 按 TODO 逐项执行
- [ ] 4.2 每步完成后 ask_user 微确认
- [ ] 4.3 实时更新草稿
- [ ] 4.4 生成正式交付文档

### Step 5: HCritic Review
- [ ] 5.1 提交 HCritic 审查
- [ ] 5.2 处理审查结果（PASS/FAIL）
- [ ] 5.3 如 FAIL，修正后重新提交

### Step 6: User Confirmation
- [ ] 6.1 向用户汇报审查通过结果
- [ ] 6.2 用户确认进入下一阶段 / 要求修改

### Step 7: Handover
- [ ] 7.1 调用 set_hd_workflow_handover
- [ ] 7.2 通知用户阶段交接完成

### Step 8: Idle State
- [ ] 8.1 结束当前回合，等待系统调度

## 1. User Requirements Record
- [原始需求摘要]
- [关键用户反馈]

## 2. Research Findings
- **资料清单内容**: [用户填写的资料摘要]
- **Explore Results**: [代码库发现]
- **Librarian Results**: [外部资料索引]

## 3. Design Decisions
- **Decision**: [设计决策]
- **Rationale**: [选择理由]
- **Alternatives**: [备选方案]

## 4. Pending Issues
- [ ] [问题描述] - Status: Pending User Input

## 5. Generation Progress
- [ ] Section 1: Introduction
- [x] Section 2: Core Logic
```

#### 🔄 更新触发器

**基于事件驱动更新，禁止批量延迟记录：**

* `OnUserFeedback` -> 更新 "User Requirements Record"
* `OnToolResult` (Explore/Librarian) -> 更新 "Research Findings"
* `OnDecisionMade` -> 更新 "Design Decisions"
* `OnPhaseComplete` -> 更新 "Generation Progress"

### 3. HCritic Collaboration Protocol

#### 🎯 目标

通过结构化评审闭环，确保文档质量符合 `absolute-constraints.md`。

#### 🚀 调用 HCritic (Implementation)

使用 `task` 工具调用，**必须强制要求 HCritic 输出 JSON 格式结果**以便解析。

**Prompt 模板:**

```markdown
**CONTEXT**:
- Current Stage: {stage_name}
- Document Path: {document_path}
- Constraints File: identity/absolute-constraints.md

**TASK**:
Review the document at {document_path}.

**OUTPUT SCHEMA (Strict JSON)**:
{{
  "status": "PASS" | "FAIL",
  "score": 0-100,
  "issues": [
    {{
      "severity": "CRITICAL" | "MINOR",
      "location": "Section 2.1 / Line 45",
      "description": "Violates constraint X...",
      "suggestion": "Rewrite as..."
    }}
  ],
  "summary": "Brief summary of the review."
}}

**REVIEW CRITERIA**:
1. **Consistency**: Does it contradict previous stages?
2. **Completeness**: Are all required sections present?
3. **Constraint Compliance**: Does it follow `absolute-constraints.md`?
4. **Traceability**: (If functionalRefinement) Run traceability analysis.

**INSTRUCTIONS**:
- If status is "FAIL", you MUST provide specific "location" and "suggestion".
- Do NOT output anything outside the JSON structure.
```

#### 🔄 闭环处理流程

**Step A: Invoke & Parse**
调用 HCritic，解析返回的 JSON。

* 若解析失败 -> 视为 CRITICAL ERROR，重试。

**Step B: Decision Gate**

* **Status: PASS** -> 进入用户确认环节。
* **Status: FAIL** -> 进入修复流程 (Step C)。

**Step C: Iterative Repair (Max Retries: 3)**

1. 提取 `issues` 列表。
2. 在 `draft.md` 中记录问题。
3. 针对每个 `location` 执行 `Edit`/`Rewrite`。
4. 重新调用 HCritic。
5. 若超过最大重试次数仍失败 -> `ask_user` 请求人工介入。
