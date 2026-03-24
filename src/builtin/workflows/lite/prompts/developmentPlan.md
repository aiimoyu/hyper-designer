## 当前阶段：SDD 开发计划生成（轻量）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="developmentPlan"/>
    <pre_stage>requirementDesign</pre_stage>
  </pipeline>
  <executing_agent>HEngineer</executing_agent>
  <core_objective>
    Convert single-module design into an executable, distributable, and verifiable
    SDD plan with task wave partitioning, complexity rating, acceptance criteria,
    and TDD test scenarios.
  </core_objective>
</workflow_context>
```

**阶段标识**: `developmentPlan`  
**执行Agent**: HEngineer  
**核心目标**: 将单模块设计转换为可执行、可分发、可验证的 SDD 计划。

### 0. 核心原则：计划划分与排序（最高优先级）

**开发计划必须按照依赖关系和技术栈层次进行排序，而非机械按 AR 或模块划分。**

#### 0.1 框架优先，渐进细化

对于全新项目（greenfield），必须遵循以下顺序：

```
Wave 0（基础设施层）：
├── 项目脚手架初始化
├── 构建工具配置（tsconfig, vite/webpack, eslint 等）
├── 目录结构创建
├── 基础类型定义
└── 核心依赖安装

Wave 1（数据与接口层）：
├── 数据模型/Schema 定义
├── 接口类型声明
├── 基础工具函数
└── 配置文件

Wave 2（核心业务层）：
├── 核心业务逻辑实现
├── 服务层实现
└── 业务规则处理

Wave 3（接口与集成层）：
├── API 端点实现
├── UI 组件实现
└── 模块间集成

Wave FINAL（验收层）：
├── 集成测试
├── 端到端测试
└── 需求覆盖审查
```

**对于增量项目（brownfield）**，Wave 0 可能已存在，但仍需确认基础设施是否需要扩展。

#### 0.2 工作量适中，避免极端

**开发计划数量建议**：

| 项目规模 | 建议计划数量 | 单个计划工作量 |
|----------|--------------|----------------|
| 小型（单模块增强） | 1 个 | 1-3 人日 |
| 中型（多模块） | 2 个 | 2-5 人日 |
| 大型（全新系统） | 3 个 | 3-7 人日 |

**核心约束**：**一个开发计划最多 3 个**，超过 3 个应合并或重新评估范围。

**避免极端**：

- ❌ 过少：一个计划包含 10+ 个 AR，工作量超过 2 周
- ❌ 过多：每个 AR 单独一个计划，导致计划碎片化
- ✅ 适中：每个计划包含 2-4 个相关 AR，工作量 2-5 人日

#### 0.3 耦合度优先于 AR 边界

**不要机械按 AR 划分计划，要考虑功能耦合度。**

**合并规则**（应该合并为一个计划）：

- 多个 AR 属于同一模块且共享数据模型
- 多个 AR 有强依赖关系，分开实现会导致反复修改
- 多个 AR 的实现涉及同一组文件
- 多个 AR 共同完成一个完整的用户场景

**拆分规则**（应该拆分为多个计划）：

- AR 涉及完全独立的模块
- AR 可以独立测试和验收
- AR 的实现不需要等待其他 AR 完成
- 单个计划工作量超过 5 人日

#### 0.4 全新项目的框架构建计划

**对于全新项目，第一个计划必须是框架构建计划。**

框架构建计划必须包含：

```
## 框架构建计划（Wave 0）

**目标**：搭建项目骨架，为后续开发提供基础支撑。

**必须包含**：
1. 项目初始化
   - 包管理器配置（package.json / pnpm-workspace.yaml）
   - TypeScript 配置（tsconfig.json, tsconfig.build.json）
   - 构建工具配置（vite.config.ts / webpack.config.ts）
   - 代码规范配置（eslint, prettier）

2. 目录结构
   - src/
   - tests/
   - docs/
   - 配置文件目录

3. 基础依赖
   - 运行时依赖
   - 开发依赖
   - 类型定义

4. 开发脚本
   - npm run dev
   - npm run build
   - npm run test
   - npm run lint

**验收标准**：
- [ ] 项目可成功编译（npm run build）
- [ ] 测试框架可运行（npm run test）
- [ ] 代码规范检查通过（npm run lint）
- [ ] 开发服务器可启动（npm run dev）
```

**框架构建计划完成后，才能开始业务功能计划。**

---

### 1. 阶段执行流程

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

1. **代码阅读确认修改位置**（P3内）：阅读代码后，明确每个任务要修改的文件路径、位置和内容
2. **里程碑确认**（P3内）：使用 HD_TOOL_ASK_USER 确认里程碑时间节点是否符合预期
3. **交互式修改**（P4）：文档生成后，调用 `hd_prepare_review` 和 `hd_finalize_review` 进行交互式修改
4. **HCritic审查**（P5）：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 进行质量评审

---

### 2. 输入与资料收集

**在开始执行前，必须读取前阶段产出的需求设计文档。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **需求设计资料**<br>(前阶段输出) | 需求设计说明书.md | 必需 | 任务分解的主要输入：功能列表、SR映射、接口定义 |

**核心参考资料**: 根据上下文搜集已收集的前置阶段交付物的结构化摘要和引用链接。

---

### 3. 执行规范与 Skill 使用

**核心 Skills**: `lite-designer`

**⚠️ 强制前置步骤**：

在开始执行前，**必须先读取** `lite-designer` skill 的以下 reference 文件：

```
references/phase3-sdd-plan.md
```

该文件包含：

- 完整的输出模板结构（§0 概要 → §1 执行前准备 → §2 开发任务列表 → §3 依赖关系 → §4 测试计划 → §5 风险 → §6 执行说明）
- 任务编号格式（T-{里程碑编号}{序号:02d}）
- 每个任务的完整卡片格式（对应AR、功能点清单、实现要点、验收条件）
- 任务依赖与执行顺序图示
- 测试计划要求（单元测试、集成测试、回归测试）
- 给开发 Agent 的执行说明

**严禁跳过此步骤，严禁使用简化模板或自行简化输出结构。**

---

### 4. 代码阅读要求（必须）

**在生成SDD计划前，必须阅读相关代码文件，明确修改位置。**

#### 4.1 阅读步骤

1. **阅读需求设计说明书中的修改围栏**：确认允许修改和禁止修改的范围
2. **使用 SearchCodebase/Grep 阅读代码库**：定位要修改的文件和位置
3. **记录修改位置**：每个任务必须明确以下信息

#### 4.2 任务修改信息格式

每个开发任务必须包含：

```
**修改文件**：
- 文件路径：[具体路径，如 src/services/feedback/index.ts]
- 修改位置：[行号范围或函数名，如 L45-67 或 submitFeedback 函数]
- 修改类型：[新增 / 修改 / 删除]
- 修改内容：[具体描述，如"新增 submitFeedback 方法，处理用户反馈提交"]

**新增文件**（如有）：
- 文件路径：[具体路径]
- 依赖关系：[依赖哪些现有模块]
- 集成方式：[如何与现有代码集成]
```

---

### 5. 关键交互步骤

#### 5.1 里程碑确认

在开始拆分任务前，**使用 HD_TOOL_ASK_USER 确认里程碑时间节点**：

```
在生成开发计划前，请确认：

1. 各里程碑的目标日期是否与 §4 中一致？
   M1（需求设计完成）：[日期]
   M2（P0 功能上线）：[日期]
   M3（P1 功能上线）：[日期]

2. 是否有并行开发的团队成员？如有，我可以标注哪些任务可以并行。

3. 有没有已知的技术风险需要在计划中提前预留时间？
```

#### 5.2 交互式修改（P4）

文档生成后，**必须调用交互式修改工具**：

1. **Prepare Review**: 调用 `hd_prepare_review` 创建文档快照
2. **Notify User**: 使用 `HD_TOOL_ASK_USER` 通知用户审核快照文件
3. **Finalize Review**: 调用 `hd_finalize_review` 获取用户修改
4. **Process Changes**: 根据用户修改更新文档，循环直到 `canProceedToNextStep === true`

---

### 6. 阶段交付物

**输出目录**：`.hyper-designer/developmentPlan/`

每个模块生成一个独立的开发计划文件，命名格式：`{模块名}-dev-plan.md`

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **{模块名}-dev-plan.md** | `.hyper-designer/developmentPlan/{模块名}-dev-plan.md` | Markdown，**严格遵循 phase3-sdd-plan.md 中的完整模板** |

**命名规范**：

- 模块名使用英文小写，多个单词用连字符连接
- 例如：`feedback-service-dev-plan.md`、`user-auth-dev-plan.md`

---

### 7. 质量要求

基于 `phase3-sdd-plan.md` 中的质量自检清单：

1. **每个 AR 都对应至少一个开发任务**
2. **每个任务的功能点清单直接来自 AR 功能点**
3. **每个任务有可客观判断的验收条件**（不依赖主观判断）
4. **任务依赖关系已完整标注**
5. **修改围栏已在执行说明中体现**
6. **测试计划覆盖主成功场景和关键异常场景**
7. **每个任务明确了修改文件路径、位置和内容**

---

### 8. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```markdown
# 文档审核任务

## 📁 审核目标
请对以下目录中的所有开发计划文件进行全面的质量审核：
**目录路径**: `.hyper-designer/developmentPlan/`

每个文件命名格式：`{模块名}-dev-plan.md`

---

## 🔍 审核维度

**参考规范**：
1. 请读取 `lite-designer` skill 文件
2. 请读取 `references/phase3-sdd-plan.md`，理解该文档的撰写规范与模板要求

在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **模板结构完整性** | 是否包含 §0 概要、§1 执行前准备、§2 开发任务列表、§3 依赖关系、§4 测试计划、§5 风险、§6 执行说明？ | 🔴 Critical |
| **AR 任务覆盖** | 每个 AR 是否都有对应的开发任务？ | 🔴 Critical |
| **验收条件客观性** | 每个任务的验收条件是否可客观判断？是否避免了模糊词汇？ | 🔴 Critical |
| **功能点清单追溯** | 任务的功能点是否来自 AR 功能点？是否有遗漏或越界？ | 🟡 Major |
| **依赖关系完整性** | 任务依赖关系是否已标注？是否有循环依赖？ | 🟡 Major |
| **修改位置明确性** | 每个任务是否明确了修改文件路径、位置和内容？ | 🔴 Critical |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```

---

### 9. 阶段完成提示

**本阶段是工作流的最后一个阶段。**

完成所有任务并生成开发计划后，请：

1. **确认所有交付物已完成**：检查 `.hyper-designer/developmentPlan/开发计划.md` 文件是否已生成且内容完整
2. **向用户汇报完成状态**：明确告知用户"工作流已执行完毕，所有阶段已完成"
3. **进入 idle 状态**：工作流将自动进入 idle 状态，等待用户下一步指示

**完成话术示例**：
> 工作流已执行完毕。所有阶段（需求分析与场景分析 → 功能列表与需求设计 → 开发计划生成）已成功完成。开发计划已生成，可供 subagent 执行。感谢使用！
