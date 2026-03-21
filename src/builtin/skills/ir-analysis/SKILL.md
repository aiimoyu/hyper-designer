---
name: IR Analysis
description: Conduct Initial Requirement (IR) analysis using 5W2H framework and Socratic questioning. Use when users have a system/product idea that needs structured requirement clarification. The skill guides users through multi-turn conversations to identify stakeholders, specific requirements, constraints, and usage patterns, ultimately producing a structured 5W2H requirement document. Trigger this skill whenever a user describes a product idea, system concept, or feature request that needs deeper clarification before design or development can begin.
---

# IR Analysis Skill

Guide users through structured requirement analysis to produce 5W2H-formatted IR documentation.

## Core Workflow

### 1. Gather Context

Before opening any dialogue, scan all available context sources:

- Uploaded files, existing documents, or project directories in the current workspace
- Any domain analysis files, requirement drafts, or background materials already provided
- Conversation history for previously stated constraints or goals

Extract relevant domain knowledge, existing requirements, and technical context. This reduces redundant questioning and makes the Socratic dialogue more targeted.

### 2. Establish Identity

Based on the domain inferred from context or the user's initial message, briefly introduce yourself as a focused advisor for that space:

```
你是我的交互式系统设计顾问，专注于[根据上下文推断的领域]。
擅长通过苏格拉底式对话澄清复杂系统需求。
```

If no domain is clear yet, adopt a general requirement analysis consultant identity.

### 3. Conduct Socratic Dialogue

Follow the 4-round framework below. **Where multiple questions can be asked together, use a structured questioning tool (e.g., a multi-question widget or formatted list) to present them in a single turn** rather than spreading across separate messages.

See [socratic-guide.md](references/socratic-guide.md) for detailed tone and handling guidance.

---

#### Round 1 — Initial Confirmation (1 question)

Summarize your understanding of the user's idea in one sentence and ask for confirmation. This surfaces any fundamental misreading before investing in deeper questions.

---

#### Round 2 — Scenario Mining (3–4 questions, presented together)

Use a questioning tool to ask all relevant dimensions simultaneously when they are independent of each other. Focus on:

- **Scale**: user volume, data volume, team size
- **Core features**: the most essential 2–3 capabilities
- **Constraints**: budget, timeline, tech stack preferences, compliance
- **User profile**: who uses it, their technical level, typical scenarios

> Key principle: only split into a follow-up round if earlier answers reveal new unknowns that couldn't have been anticipated.

---

#### Round 3 — Scenario Simulation (1 scenario + confirmation)

Describe a concrete end-to-end user flow based on what you've heard. Ask the user to confirm whether it matches their expectation and whether key scenarios are missing.

---

#### Round 4 — Gap Filling + 验收标准 Confirmation

Identify which 5W2H dimensions still lack sufficient information and ask targeted questions to fill gaps.

**In this round, also collaboratively confirm the 验收标准 (acceptance criteria)**:

- Propose 1–2 draft acceptance criteria based on the dialogue so far
- Ask the user to confirm, adjust, or add to them before finalizing

Example:

```
基于我们的讨论，我初步拟定了以下验收标准：
1. [可测量条件1]
2. [可测量条件2]

这些标准能准确反映"完成"的定义吗？需要调整或补充吗？
```

---

### 4. Generate Output

Before writing the document, confirm the core understanding with the user:

```
基于我们的讨论，我将生成正式的需求信息文档。

**需求价值**：[核心价值一句话]
**验收标准**：[已确认的标准]

确认以上理解正确吗？生成后您仍可以要求修改。
```

Then create the requirement document in the current working directory (use a contextually appropriate filename, defaulting to `需求信息.md`), following the 描述 + 5W2H structure.

---

## Output Format

```markdown
# 需求信息

## 描述
### 需求价值
[1-2 句话描述该需求的核心业务价值]

### 需求描述
[1-2 句话描述需求的本质和范围]

### 验收标准
[1-2 句话描述可验证的成功条件——需经用户确认]

## 5W2H 分析
### What - 是什么
[1-2 句话]

### Why - 为什么
[1-2 句话]

### Who - 谁使用
[1-2 句话]

### When - 何时使用
[1-2 句话]

### Where - 在哪里使用
[1-2 句话]

### How - 怎么做
[1-2 句话]

### How Much - 多少成本/规模
[1-2 句话]

## 其他
[可选内容，放置不适合5W2H框架的补充信息]
```

For detailed field definitions and a complete example, see [ir-5w2h-template.md](references/ir-5w2h-template.md).

---

## Quality Checklist

Before finalizing the document, verify:

- [ ] 需求价值清晰传达核心业务价值
- [ ] 需求描述准确描述需求本质和范围
- [ ] 验收标准已与用户确认，具体可验证
- [ ] What 具体，非抽象描述
- [ ] Why 追溯到业务根源和痛点
- [ ] Who 涵盖所有关键利益相关者
- [ ] When 明确时间和频率特征
- [ ] Where 覆盖物理、技术、业务环境
- [ ] How 描述具体使用方式和流程
- [ ] How Much 包含资源投入与成本预算（人力/资金/时间/设备）
- [ ] 所有内容基于与用户的对话和上下文信息

---

## Example Interaction Flow

**User**: "我想做一个实时监控系统"

**Round 1**:
```
我理解您想构建一个能对某类数据进行实时监控并及时预警的系统。
这个方向理解正确吗？是哪个领域的监控？
```

**Round 2** (user clarifies: 金融交易风险监控):
> 使用提问工具，一次性呈现以下问题：

```
了解，是金融交易风险的实时监控。我有几个问题想一起确认：

1. 主要服务多少交易员？（小团队 / 50人左右 / 百人以上？）
2. 核心监控指标是哪几类？（市场风险 / 信用风险 / 操作风险？）
3. 风险超标时，期望通过什么渠道通知？（界面弹窗 / 邮件 / 即时通讯？）
4. 现有监控方式存在什么问题，是什么驱动了这个新系统的需求？
```

**Round 3**:
```
让我描述一个典型场景确认理解：

交易员正在查看实时风险仪表盘，
某持仓的市场风险敞口突然超过阈值，
系统立即推送预警，
交易员查看详情后决定调整仓位。

这个流程符合预期吗？还有哪些关键场景需要涵盖？
```

**Round 4** — 补充缺失维度 + 确认验收标准，然后生成文档。

---

## Anti-Patterns to Avoid

**Don't**:
- 跳过上下文收集、直接进入对话
- 一次提问超过 4 个问题（工具并行提问时也应保持聚焦）
- 在未收到用户回复前自行推进到下一轮
- 单方面撰写验收标准而不与用户确认
- 对"性能要好"、"用户体验佳"等模糊描述不加追问就接受

**Do**:
- 优先从现有上下文中提取信息，减少冗余提问
- 能并行的问题合并在一轮中通过提问工具呈现
- 每一轮结束都与用户确认理解
- 验收标准作为对话的一部分共同拟定
- 输出文档与项目上下文保持一致的命名和存放位置
