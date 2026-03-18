# componentAnalysis Reference

## Current Phase: Component Analysis

### 阶段定义

**执行者：** HAnalysis  
**核心目标：** 基于阶段 1 的组件清单，逐个分析每个组件的 4 个维度，生成组件级分析报告。

**输入依赖：**
- `./.hyper-designer/projectAnalysis/components-manifest.md`（唯一事实来源，不得重新扫描）

---

### 1. 执行流程

#### 1.1 加载组件清单

从 `components-manifest.md` 读取完整的组件列表。这个文件是 Stage 1 生成的，定义了所有需要分析的组件。

**关键约束：**
- `components-manifest.md` 是组件发现的唯一事实来源
- 禁止重新扫描项目目录来发现组件
- 禁止使用目录启发式或文件模式来识别组件
- 禁止用任何替代发现方法覆盖清单

#### 1.2 逐个分析组件

对清单中的每个组件，执行 4 个维度的分析。虽然分析可以并行进行（组件间相互独立），但每个组件的分析必须完整覆盖所有 4 个维度。

**分析策略：**
1. 按清单顺序或并行处理每个组件
2. 每个组件在独立上下文中分析
3. 参考 `architecture.md` 确保与系统分析的一致性
4. 记录组件边界（范围内 vs 范围外）

#### 1.3 生成组件输出

为每个组件生成：
- `components/{componentSlug}.md` — 人类可读的组件分析报告

#### 1.4 对账步骤

所有组件分析完成后，执行对账：

1. **对比清单与输出**
   - 验证清单中的每个组件都有对应的 .md 分析文件
   - 标记缺失的输出为失败

2. **验证交叉引用**
   - 检查组件依赖是否引用有效的 componentSlug
   - 验证 Mermaid 图表节点与清单条目匹配
   - 验证代码引用指向存在的文件

3. **聚合质量指标**
   - 收集所有组件的覆盖率百分比
   - 计算整体组件分析健康评分
   - 识别覆盖率低或质量有问题的组件

4. **生成汇总**
   - 写入 `component-analysis-summary.md`

---

### 2. 4 个组件维度

#### 维度 1：Input/Output/Position (IOP)

**目的**：理解组件的输入、输出和在系统中的位置。

**分析重点：**
- **识别所有输入**：参数、事件、消息、外部 API 调用
- **识别所有输出**：返回值、发出的事件、副作用
- **确定调用链位置**：入口点、中间层、叶子节点、横切关注点
- **映射数据流**：数据如何流经组件

**必需输出：**
- 输入清单表格
- 输出清单表格
- 调用链位置声明（Entry Point / Intermediate / Leaf / Cross-cutting）
- 数据流图（Mermaid `graph LR`）

#### 维度 2：Responsibility and Scope（职责和范围）

**目的**：定义组件做什么及其边界。

**分析重点：**
- **核心职责**：它拥有的业务逻辑或基础设施关注点
- **边界**：它不做什么
- **子域映射**：属于哪个 DDD 限界上下文或业务领域
- **SRP 违规**：识别单一职责原则违规

**必需输出：**
- 职责声明（1-2 句话）
- 范围内功能列表
- 范围外排除项
- 职责内聚度评分
- 业务规则清单

#### 维度 3：Interface Contracts（接口契约）

**目的**：记录所有公开契约和通信边界。

**分析重点：**
- **公开 API 表面**：函数、方法、类
- **输入参数和验证**：参数类型、约束、验证规则
- **返回类型和错误处理**：返回值、异常、错误码
- **事件发射**：发出的事件及其 payload
- **外部依赖**：对其他组件的依赖
- **协议规范**：HTTP、RPC、基于事件

**必需输出：**
- 接口清单表格
- 输入/输出规格
- 错误契约文档
- 依赖列表（含耦合级别）
- 接口图（Mermaid `classDiagram`）
- 用法示例

#### 维度 4：Internal Structure and Patterns（内部结构和模式）

**目的**：理解组件的内部组织和使用的模式。

**分析重点：**
- **内部模块/类**：及其关系
- **设计模式**：工厂、策略、观察者等
- **复杂度分析**：圈复杂度、嵌套深度、代码重复
- **技术债务**：重构机会

**必需输出：**
- 内部模块/类清单
- 设计模式识别
- 复杂度指标
- 技术债务标记
- 重构建议

---

### 3. 组件 IOP 摘要表

每个组件分析必须包含一个摘要表：

| 维度 | 描述 |
|------|------|
| **Input（输入）** | 外部依赖、API 参数、事件订阅 |
| **Output（输出）** | 公开 API、发射的事件、数据转换 |
| **Position（定位）** | 层、子域、调用层次位置、部署单元 |

---

### 4. 失败处理语义

- **部分成功允许**：如果某些组件分析失败，继续处理其他组件
- **失败隔离**：一个组件的失败不会中止整个 Stage 2
- **失败跟踪**：在汇总中记录失败原因和组件
- **对账标记**：失败的组件在 Stage 3 覆盖率检查中标记

---

### 5. 输出文件规格

#### 5.1 components/{componentSlug}.md — 组件分析报告

**路径**：`./.hyper-designer/projectAnalysis/components/{componentSlug}.md`

**必需章节结构：**

```markdown
# Component Analysis: {componentName}

## Overview
[组件简述，1-2 段落]

## IOP Summary

| 维度 | 描述 |
|------|------|
| Input | [输入列表] |
| Output | [输出列表] |
| Position | [调用链位置] |

## 1. Input/Output/Position (IOP)
[详细分析：所有输入、输出、调用链位置]
[Mermaid 数据流图]

## 2. Responsibility and Scope
[核心职责、边界、子域映射]
[职责内聚度评估]

## 3. Interface Contracts
[公开接口清单、schema、SLA]
[Mermaid 接口图]

## 4. Internal Structure and Patterns
[内部模块、设计模式、复杂度]
[Mermaid 内部结构图]

## Dependencies
### Upstream (被谁调用)
- [依赖列表]

### Downstream (调用谁)
- [依赖列表]

## Code References
[关键代码引用，使用相对路径]

---
> **Update Reminder**: 此文档反映 [日期] 时的组件状态。当代码结构变更时，请更新此文档。
```

#### 5.2 component-analysis-summary.md — 组件分析汇总

**路径**：`./.hyper-designer/projectAnalysis/component-analysis-summary.md`

```markdown
# Component Analysis Summary

## 统计
- Total Components: N
- Successfully Analyzed: N
- Failed: N
- Quality Score: N%

## 组件状态

| componentSlug | Status | Dimensions Covered | Issues |
|---------------|--------|-------------------|--------|
| auth-service | ✅ Success | 4/4 | None |
| user-repository | ✅ Success | 4/4 | None |
| payment-gateway | ❌ Failed | 2/4 | Missing interface contracts |

## 失败组件
- [如果有失败组件，列出名称和原因]

## 对账问题
- [如果有交叉引用问题，列出]
```

---

### 6. 完成检查清单

在完成 Stage 2 之前，验证：

- [ ] 已读取 `components-manifest.md` 作为唯一组件来源
- [ ] 未扫描项目目录来发现组件
- [ ] 清单中的每个组件都有对应的 .md 分析文件
- [ ] 每个组件分析覆盖所有 4 个维度
- [ ] 组件 Markdown 包含代码引用和 Mermaid 图表
- [ ] 对账汇总已写入 `component-analysis-summary.md`
- [ ] 所有交叉引用已验证（依赖、图表节点、代码路径）
- [ ] 失败组件已在汇总中跟踪和报告

---

### 7. 反模式

**禁止：**
- 在 Stage 2 期间从目录结构重新发现组件
- 使用文件模式或启发式方法识别组件
- 用任何替代组件列表覆盖清单
- 因为一个组件分析失败而中止整个阶段
- 跳过 fan-out 完成后的对账步骤
- 仅生成 Markdown 而不包含完整的 4 维度分析

**应该：**
- 将 `components-manifest.md` 视为不可变的事实来源
- 按清单定义的确切顺序和集合处理组件
- 个别分析失败时继续处理剩余组件
- 在声明 Stage 2 完成前验证所有交叉引用
- 为每个组件生成包含 4 个维度的完整分析
