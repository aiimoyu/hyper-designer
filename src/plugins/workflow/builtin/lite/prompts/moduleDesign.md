## 当前阶段：功能列表与模块设计（轻量）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="ModuleDesign"/>
    <pre_stage>requirementAnalysis</pre_stage>
  </pipeline>
  <executing_agent>HEngineer</executing_agent>
  <core_objective>
    Based on requirement scenario analysis, produce a single-module implementable
    function list and module functional design summary within strict length limits.
  </core_objective>
</workflow_context>
```

**阶段标识**: `ModuleDesign`  
**执行Agent**: HEngineer  
**核心目标**: 基于需求场景分析，产出单模块可实现的功能列表和模块功能设计摘要。

### 0. 阶段执行流程

本阶段遵循 Single-Stage Processing Pipeline：

```
[P1] Planning           → Load skills, build TODO list
[P2] Context Load       → Retrieve historical context & requirements
[P3] Execution          → Execute step-by-step, Human-in-the-Loop
[P4] Interactive Revision → User-driven document refinement (hd_prepare_review/hd_finalize_review)
[P5] HCritic Review     → Automated quality gate (max 3 retries)
[P6] Confirmation       → User authorization
[P7] Handover           → Trigger state transition
```

**关键交互节点**：
1. **模块分解理解确认**（P3内）：阅读代码后，使用 HD_TOOL_ASK_USER 确认模块理解是否正确
2. **围栏范围确认**（P3内）：确定修改围栏前，使用 HD_TOOL_ASK_USER 与用户确认围栏范围
3. **交互式修改**（P4）：文档生成后，调用 `hd_prepare_review` 和 `hd_finalize_review` 进行交互式修改
4. **HCritic审查**（P5）：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 进行质量评审

---

### 1. 输入与资料收集

**在开始执行前，必须读取前阶段产出的需求分析文档。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出) | 需求分析说明书.md | 必需 | 功能提取与模块边界定义 |

**核心参考资料**: 根据上下文搜集已收集的前置阶段交付物的结构化摘要和引用链接。

---

### 2. 执行规范与 Skill 使用

**核心 Skills**: `lite-designer`

**⚠️ 强制前置步骤**：

在开始执行前，**必须先读取** `lite-designer` skill 的以下 reference 文件：

```
references/phase2-functional-module-design.md
```

该文件包含：

- 完整的输出模板结构（§0 概要 → §1 设计目标 → §4 SR-AR 分解 → §5 数据与接口 → 修改围栏）
- SR 分解规则（总量控制 2-6 个、场景对应、合并优先）
- AR 分配规则（默认 1-2 个、最多 3 个、功能点清单要求）
- 模块接口定义规范（支持 REST/函数调用/消息队列/CLI/文件接口等）
- 修改围栏确认流程（历史文档分析 + 代码库分析 + 用户确认）
- 质量自检清单

**严禁跳过此步骤，严禁使用简化模板或自行简化输出结构。**

---

### 3. 关键交互步骤

#### 3.1 模块分解理解确认（必须）

阅读代码库后、开始SR-AR分解前，**必须使用 HD_TOOL_ASK_USER 确认对模块分解的理解是否正确**：

```
基于代码库分析，我对现有模块结构的理解如下：

**模块结构**：
- [模块A]：[职责描述]
- [模块B]：[职责描述]

**关键依赖**：
- [模块A] → [模块B]：[依赖原因]

**核心接口**：
- [接口1]：[提供方] → [消费方]，[用途]

请确认：
1. 模块划分理解是否正确？
2. 有没有遗漏的关键模块或接口？
3. 有没有需要特别关注的依赖关系？
```

#### 3.2 围栏范围确认（必须）

确定修改围栏前，**必须使用 HD_TOOL_ASK_USER 与用户确认围栏范围**：

```
基于代码库分析和历史文档，我初步划定以下修改围栏：

✅ 允许修改：
  - [模块A]：[修改内容]
  - [模块B]：[修改内容]

❌ 禁止修改：
  - [模块C]：[原因]
  - [模块D]：[原因]

❓ 需要您确认：
  - [模块E]：是否可以修改？

请确认以上围栏范围是否正确，或指出需要调整的部分。
```

#### 3.3 交互式修改（P4）

文档生成后，**必须调用交互式修改工具**：

1. **Prepare Review**: 调用 `hd_prepare_review` 创建文档快照
2. **Notify User**: 使用 `HD_TOOL_ASK_USER` 通知用户审核快照文件
3. **Finalize Review**: 调用 `hd_finalize_review` 获取用户修改
4. **Process Changes**: 根据用户修改更新文档，循环直到 `canProceedToNextStep === true`

---

### 4. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **需求设计说明书.md** | `.hyper-designer/ModuleDesign/需求设计说明书.md` | Markdown，**严格遵循 phase2-functional-module-design.md 中的完整模板** |

---

### 5. 质量要求

基于 `phase2-functional-module-design.md` 中的质量自检清单：

1. **每个 SR 标注了对应的主要场景**
2. **SR 总数合理（2-6 个）**，新增前已自问是否可合并
3. **每个 SR 的 AR 数量克制（1-3 个）**，超过 3 个已与用户确认
4. **每个 AR 列出了具体功能点**（非笼统描述）
5. **接口定义包含输入/输出/约束**（不限 REST 形式）
6. **修改围栏已参考历史文档和代码库分析**
7. **修改围栏已与用户确认**
8. **IR→SR→AR 追溯链完整，无断链**

---

### 6. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```markdown
# 文档审核任务

## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/ModuleDesign/需求设计说明书.md`

---

## 🔍 审核维度

**参考规范**：
1. 请读取 `lite-designer` skill 文件
2. 请读取 `references/phase2-functional-module-design.md`，理解该文档的撰写规范与模板要求

在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **模板结构完整性** | 是否包含 §0 概要、§1 设计目标、§4 SR-AR 分解、§5 数据与接口、修改围栏？ | 🔴 Critical |
| **SR 数量合规** | SR 总数是否在 2-6 个？每个 SR 是否标注了对应场景？ | 🔴 Critical |
| **AR 功能点清单** | 每个 AR 是否列出了具体功能点？是否避免了笼统描述？ | 🔴 Critical |
| **追溯链完整性** | IR→SR→AR 追溯链是否完整？每个功能是否都有 AR 覆盖？ | 🟡 Major |
| **修改围栏确认** | 修改围栏是否已与用户确认？是否明确列出允许/禁止范围？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```
