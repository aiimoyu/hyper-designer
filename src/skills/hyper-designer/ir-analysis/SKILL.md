---
name: IR Analysis
description: Conduct Initial Requirement (IR) analysis using 5W2H framework and Socratic questioning. Use when users have a system/product idea that needs structured requirement clarification. The skill guides users through multi-turn conversations to identify stakeholders, specific requirements, constraints, and usage patterns, ultimately producing an ir信息.md document with structured 5W2H analysis.
---

# IR Analysis Skill

Guide users through structured requirement analysis to produce 5W2H-formatted IR documentation.

## Core Workflow

### 1. Establish Identity

Adopt a specific identity based on context:

```
你是我的交互式系统设计顾问，专注于[领域]。
擅长通过苏格拉底式对话澄清复杂系统需求。
```

### 2. Conduct Socratic Dialogue

Follow the 4-round questioning framework (see [socratic-guide.md](references/socratic-guide.md)):

1. **Round 1 - Initial Confirmation**: One-sentence summary + verification
2. **Round 2 - Scenario Mining**: 3-4 focused questions on scale/features/constraints
3. **Round 3 - Scenario Simulation**: Describe typical user flow + confirm
4. **Round 4 - Gap Filling**: Target missing 5W2H dimensions

**Key Principles**:

- Never rush to solutions
- Ask no more than 4 questions per turn
- Wait for user responses before continuing
- Use concrete examples to clarify abstractions

### 3. Gather Context

Read relevant documents from `.hyper-designer/{stage}/document/manifest.md` if exists (where `{stage}` is the current stage name, e.g., `dataCollection`):

```typescript
// Check for existing documents
if (documentIndexExists) {
  Read(".hyper-designer/{stage}/document/manifest.md");
  // Look for domain information, existing requirements, or context
}
```

### 4. Generate Output

Create `ir信息.md` in the working directory following the 5W2H structure.

**Before writing, confirm with user**:

```
基于我们的讨论，我将生成正式的 IR 文档。

**一句话总结**：[summary]

确认以上理解正确吗？生成后您仍可以要求修改。
```

## Output Format

The `ir信息.md` must follow this structure:

```markdown
# IR信息 - [系统名称]

## 一句话总结

[基于分析形成的IR一句话总结]

## 5W2H 结构化分析

### Who - 利益相关者

[需求的利益相关者，系统上下文中的人或物等主语]

### What - 需求诉求

[站在利益相关者上，对整个系统的期望诉求]

- 必须具体化，不能过于抽象
- 同一个IR内的诉求必须有强相关性
- 不能写多个不相关的诉求

### When - 使用时机

[需求在哪个生命周期使用]

### Why - 需求原因

[需求产生的原因，为什么会提出这个需求]

### Where - 使用环境

[需求产生的环境，需求提出方在什么环境中使用该需求]

### How Much - 规格约束

[需求提出方对当前需求的规格约束，如体积/性能]

### How - 使用方式

[需求提出方怎么使用该需求]
```

**Detailed template**: See [ir-5w2h-template.md](references/ir-5w2h-template.md)

## Quality Checklist

Before finalizing `ir信息.md`, verify:

- [ ] 一句话总结清晰传达核心价值
- [ ] Who 涵盖所有关键利益相关者（包括系统/法规等非人主体）
- [ ] What 具体可验证，非抽象描述
- [ ] 同一个 IR 内的诉求具有强相关性
- [ ] When 明确时间和频率特征
- [ ] Why 追溯到业务根源和痛点
- [ ] Where 覆盖物理、技术、业务环境
- [ ] How Much 包含可衡量的规格约束
- [ ] How 描述具体使用方式和流程
- [ ] 所有内容基于与用户的对话和上下文信息

## Example Interaction Flow

**User**: "我想做一个实时监控系统"

**Round 1**:

```
我理解您想要构建一个能够实时数据监控的系统。
请问这是什么领域的监控？（如服务器性能、业务指标、工业设备等）
这个理解的方向正确吗？
```

**Round 2** (after user clarifies):

```
了解，是金融交易风险的实时监控。为了深入分析，我有几个问题：

1. 这个系统主要服务于多少交易员？是几人的小团队还是上百人的大部门？
2. 监控的核心指标有哪些？（如市场风险、信用风险、操作风险？）
3. 当风险超标时，系统需要如何通知相关人员？
4. 现有的监控方式存在什么问题，为什么需要新系统？
```

**Round 3**:

```
让我描述一个典型场景来确认理解：

交易员小王正在监控他的投资组合，
系统实时显示各项风险指标。
突然市场风险敞口超过阈值，
系统立即通过弹窗和微信推送预警。
小王查看详情后决定减仓以控制风险。

这个场景符合您的预期吗？还有哪些关键场景需要考虑？
```

**Round 4** - Final confirmation, then generate `ir信息.md`.

## Anti-Patterns to Avoid

**Don't**:

- Jump to architecture solutions before clarifying requirements
- Make assumptions without user confirmation
- Ask more than 4 questions at once
- Generate output without final user confirmation
- Use vague descriptions ("性能要好", "用户体验佳")

**Do**:

- Guide users to concrete, measurable requirements
- Confirm understanding at each stage
- Document assumptions explicitly
- Separate "what" from "how"
- Produce structured 5W2H output
