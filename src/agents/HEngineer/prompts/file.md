## Template

### 1. File Management

#### 📂 标准目录树

```
.hyper-designer/
├── document/                      # HCollector 全局资料区（按领域组织）
│   └── {domain}/
│       └── manifest.md            # 最新资料搜集目录 (HCollector 独占读写)
├── {stage_name}/                  # 当前阶段工作区
│   ├── draft.md                   # Agent 记忆系统（主 Agent 独占读写）
│   └── {deliverable_name}.md      # 阶段最终交付物
└── _traceability/                 # 需求追溯矩阵（设计到需求的映射）
```

> **注意**: 资料目录由 HCollector 统一维护于 `document/{domain}/manifest.md`，各阶段不再单独管理资料子目录。

#### ⚙️ 自动化维护规则

1. **Initialization**: 阶段开始时，检查并创建 `{stage_name}` 目录；首次运行时读取 `document/{domain}/manifest.md` 初始化上下文。
2. **Integrity Check**: 阶段结束前执行 `Checklist` 验证：
    * [ ] `draft.md` 全部必填 Section 均已填写（无空占位符）。
    * [ ] 正式交付文档已生成。
    * [ ] 文档头部元数据正确。
    * [ ] 需求追溯矩阵已建立（每个设计元素可追溯到需求）。

---

### 2. Draft Management

`draft.md` 是 Agent 的**持久化记忆系统**，而非临时工作区。其核心价值在于捕获那些**无法从最终交付文档中推断出来的隐性知识**：

* **设计决策依据**（为什么选择这个技术方案）
* **用户说了什么**（原始输入与澄清结论）
* **被否决的方案**（为什么不用其他方案）

> **记忆原则**: 每次更新时问自己——"如果我明天上下文清零，这条记录是否足以让我复原当前设计判断？"若不能，则补充直到可以。
> **记忆更新**：每次发生用户澄清、做出关键设计决策或有关键进度更新时，必须立即更新 `draft.md`，禁止批量延迟记录。

#### 📄 文件路径规范

```
.hyper-designer/{stage_name}/draft.md
```

#### 📝 草稿内容 Schema

**严令：以下所有 Section 必须存在且填写完整，空占位符 = 未完成任务。**

```markdown
# {Stage Name} - Working Draft

## 0. Pipeline Progress Tracker

参照 Single-Stage Processing Pipeline 定义，实时跟踪当前进度：

| Step | Status | Notes |
|:----:|:------:|:------|
| 1. Drafting & Planning     | ⬜/🔄/✅ | |
| ...         | ⬜/🔄/✅ | |


---

## 1. Requirements Baseline

<!-- 
PURPOSE: 记录本阶段设计所依据的需求基线，确保设计可追溯。
WHEN TO UPDATE: 阶段开始时从 HArchitect 交付物中提取；需求变更时更新。
RULE: 每个需求条目必须包含来源文档引用。
-->

### 1.1 Source Requirements Documents

| Document | Path | Status |
|----------|------|--------|
| [Requirements Spec] | `.hyper-designer/xxx/requirements-spec.md` | ✅ Loaded |
| [Use Case Spec] | `.hyper-designer/xxx/use-case-spec.md` | ✅ Loaded |

### 1.2 Key Requirements Summary

| # | Requirement ID | Description | Priority | Source |
|---|----------------|-------------|----------|--------|
| 1 | [REQ-001] | [需求描述] | P0 | [文档名 §章节] |

---

## 2. Technical Knowledge Gaps

<!--
PURPOSE: 捕获 Agent 在技术领域中的认知盲点，防止基于错误假设产出设计。
WHEN TO UPDATE: 发现未知技术概念时【立即】新增条目（Status=Pending）；
                用户澄清后更新 Clarification 列并将 Status 改为 Resolved。
ANTI-PATTERN: 不要记录通用技术知识；只记录【对本阶段设计有实质影响】的未知概念。
-->

| # | 未知概念 | 为何影响本阶段设计 | 用户澄清内容 | Status |
|---|---------|-------------------|-------------|--------|
| 1 | [技术概念] | [若误解此概念，会导致哪些设计错误] | [用户原话或"待澄清"] | Pending / Resolved |

---

## 3. User Communication Log

<!--
PURPOSE: 完整记录与用户的技术讨论，作为所有设计决策的原始依据。
RULE: 只记录事实，不做主观解读。解读和结论放到 Section 4（设计决策日志）。
ANTI-PATTERN: "用户大概是这个意思" → 应引用原话，再另起一行写"提取结论"。
-->

### 3.1 Initial Input

> [逐字引用用户的原始输入，不做任何修改或摘要]

### 3.2 Clarification History

| # | 提问 / 议题 | 用户原始回复 | 提取结论 |
|---|------------|-------------|---------|
| 1 | [我们提出的技术问题或讨论议题] | "[用户原话，加引号]" | [从本次交流中明确得出的结论，一句话] |

---

## 4. Design Decision Log

<!--
PURPOSE: 记录关键设计决策的完整推理链。核心是"为什么"，而非"是什么"。
RULE: 每个条目必须填写 Why 字段；没有 Why 的条目无效。
RULE: 决策必须能追溯到 Section 1 中的具体需求。
ANTI-PATTERN: "决定采用方案 X"（无效）
VALID PATTERN: "因为需求 REQ-003 要求高可用，且方案 X 满足 §1-C1 的性能约束，所以采用 X"
-->

### D-[序号]. [决策标题]

- **触发背景**: [什么情况/信息触发了这个决策？引用具体的 §1 或 §3 条目]
- **核心约束**: [有哪些不可违反的技术限制？来源是需求还是技术环境？]
- **Why This**: [选择当前方案的核心动机，必须回答"为什么不是其他方案"]
- **Trade-offs Accepted**: [为了达成目标，我们接受了哪些代价或风险]
- **Rejected Alternatives**: [被否决的备选方案及各自被否决的原因]
- **Requirements Traceability**: [本决策满足哪些需求，引用 §1 中的需求ID]
- **Confidence**: High / Medium / Low — [若为 Low，说明哪些悬而未决的疑虑]

---

## 5. Research Findings

<!--
PURPOSE: 汇总来自 HCollector 和代码库的技术研究发现，为设计决策提供事实支撑。
REFERENCE: 完整资料目录见 .hyper-designer/document/{domain}/manifest.md
-->

- **技术资料要点**: [来自 manifest.md 的关键摘要，注明条目编号]
- **代码库发现**: [相关的代码模式、技术债务或约束点]
- **外部参考**: [关键技术文档、最佳实践索引，含简短摘要]

---

## 6. Pending Issues

<!-- 每个 Issue 必须明确阻塞原因和负责方，不允许无主 Issue 存在 -->

- [ ] [问题描述] — Blocked by: [阻塞原因] — Owner: User / Agent / Auto

---

## 7. Generation Progress

- [ ] Section 1: [章节名]
- [x] Section 2: [章节名]
```

#### 🔄 更新触发器

**事件驱动更新，禁止批量延迟记录。每个事件对应唯一的更新目标：**

| Event | Target Section | Update Action |
|-------|---------------|---------------|
| `OnRequirementsLoaded` | §1 Requirements Baseline | 记录需求来源和关键需求摘要 |
| `OnUnknownTechConceptDetected` | §2 Technical Knowledge Gaps | 新增条目，Status=Pending |
| `OnUserClarificationReceived` | §2 + §3.2 | 更新 Clarification；新增 Clarification History 行；Status → Resolved |
| `OnInitialInputReceived` | §3.1 Initial Input | 逐字记录原始输入（仅首次，不可修改） |
| `OnDesignDecisionMade` | §4 Design Decision Log | 新增完整决策条目，**Why 字段必填**，必须引用 §1 需求依据 |
| `OnToolResult` (Explore/Librarian) | §5 Research Findings | 追加发现摘要，注明来源 |
| `OnIssueIdentified` | §6 Pending Issues | 新增待解决项，明确 Owner |
| `OnSectionComplete` | §7 Generation Progress | 勾选对应章节 |
