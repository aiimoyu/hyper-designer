## Template

### 1. File Management

#### 📂 标准目录树

```
.hyper-designer/
├── {stage_name}/              # Current Stage
│   ├── document/              # HCollector 管理的资料区
│   │   ├── draft.md           # Collection Draft (HCollector 独占读写)
│   │   └── manifest.md        # Material Index (HCollector 独占读写)
│   ├── draft.md               # Working Draft (主Agent 工作草稿)
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

**参照 step.md 中的 8-Step Pipeline 定义，跟踪当前进度：**

| Step | Status | Notes |
|:----:|:------:|:------|
| 1. Drafting & Planning | ⬜/🔄/✅ | |
| 2. Materials Collection | ⬜/🔄/✅ | 自动执行 |
| 3. Context Loading | ⬜/🔄/✅ | |
| 4. Execution & Interaction | ⬜/🔄/✅ | |
| 5. HCritic Review | ⬜/🔄/✅ | hd_submit |
| 6. User Confirmation | ⬜/🔄/✅ | ask_user |
| 7. Handover | ⬜/🔄/✅ | |
| 8. Idle State | ⬜/🔄/✅ | |
## 1. User Requirements Record
- [原始需求摘要]
- [关键用户反馈]

## 2. Research Findings
- **资料清单内容**: [用户填写的资料摘要]
- **代码库发现**: [代码库发现]
- **外部资料索引**: [外部资料索引]

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

### 3. HCritic 协作协议

#### 🎯 目标

通过 `hd_submit` 工具实现自动化评审闭环，确保文档质量符合 `absolute-constraints.md`。

#### 🚀 调用方式

完成阶段文档后，调用 `hd_submit()` 工具提交 HCritic 审查。工具自动完成文档定位、评审触发和结果返回。

#### 🔄 闭环处理流程

1. **提交审查**: 调用 `hd_submit()`，系统自动将当前阶段文档提交给 HCritic。
2. **处理结果**:
   * **PASS** → 进入用户确认环节（Step 6）。
   * **FAIL** → 根据返回的问题描述修正文档，重新调用 `hd_submit()`。
3. **重试上限**: 最多 3 次提交。若仍未通过，使用 `ask_user` 请求人工介入。

### 4. HCollector 协作协议

#### 核心机制

HCollector 是唯一负责资料收集的 Subagent。通过**状态机协议**交互，以 `.hyper-designer/document/{domain}/draft.md` 作为共享记忆（`{domain}` 为当前阶段对应的资料领域）。

**禁止**：自行执行资料搜集、使用 explore/librarian 收集资料、跳过资料收集、忽略 NEEDS_CLARIFICATION。

#### 调用方式

```yaml
# 首次调用（无 action）
stage: {stage_name}
required_assets: [当前阶段所需资料列表]

# 后续调用
stage: {stage_name}
action: "CONTINUE" | "USER_ANSWERED"
user_feedback: "..."  # 仅 USER_ANSWERED 时
```

#### 状态处理循环

HCollector 每次退出时返回 JSON，包含 `status`、`next_instruction` 等字段。**必须根据 status 执行对应动作**：

```
┌──────────────────────────────────────────────────────────┐
│  调用 HCollector (task)                                   │
└──────────┬───────────────────────────────────────────────┘
           ▼
┌──────────────────────────────────────────────────────────┐
│  解析返回 JSON 的 status 字段                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  GATHERING:                                              │
│    → 再次调用 HCollector (action=CONTINUE)                │
│                                                          │
│  NEEDS_CLARIFICATION:                                    │
│    → 读取 question_for_user                              │
│    → ask_user 转达问题                                    │
│    → 再次调用 HCollector (action=USER_ANSWERED,           │
│       user_feedback=用户回答)                              │
│                                                          │
│    → 读取 .hyper-designer/document/{domain}/draft.md      │
│      确认 status=COMPLETED                               │
│    → 读取 .hyper-designer/document/{domain}/manifest.md   │
│    → 进入 Step 3: Context Loading                        │
│    → 读取 .hyper-designer/{stage}/document/draft.md      │
│      确认 status=COMPLETED                               │
│    → 读取 .hyper-designer/{stage}/document/manifest.md   │
│    → 进入 Step 3: Context Loading                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL: 收到 GATHERING 或 NEEDS_CLARIFICATION 时，资料收集未完成，严禁进入下一步。必须继续循环直到 COMPLETED。**

#### 防御性规则

| 规则 | 处理方式 |
|------|----------|
| NEEDS_CLARIFICATION 上限 | 最多 3 轮，超过则警告用户并以当前资料继续 |
| 卡死检测 | 连续 2 次 GATHERING 但 draft.md 无变化 → 升级到用户 |
| 解析失败 | HCollector 输出解析失败 → 重试 1 次，仍失败则 ask_user |
| 完成验证 | COMPLETED 后必须读取 draft.md 确认 status 字段 |
