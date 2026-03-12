## 工作流各阶段概览

### 角色分工与执行流程

本工作流由 **HAnalysis** 执行，严格遵循线性执行顺序。每个阶段必须按照 `Single-Stage Processing Pipeline` 执行后方可进入下一阶段。

**执行链条：**
`systemAnalysis` → `componentAnalysis` → `missingCoverageCheck`

### 阶段定义与执行规范

以下定义涵盖所有3个阶段。Agent在执行对应阶段时，必须严格遵循下述的输入、行动指引与输出规范。

#### 阶段 1：systemAnalysis (系统分析)

**执行者：** HAnalysis
**核心目标：** 发现目标项目的架构、组件、API 和源代码结构，生成系统级分析报告和机器可读清单。

**输入依赖：**

- 用户提供的目标项目路径（在阶段开始时询问）

**执行行动指引：**

1. **建立分析上下文**：首先询问用户目标项目的绝对路径、项目领域和分析范围。
2. **扫描分析边界**：确定排除目录（node_modules, .git, dist等）、包含的语言和框架。
3. **分析5个架构维度**：
    - 系统结构和组织（模块边界、分层架构、依赖关系）
    - 组件发现和粒度（组件识别、边界定义、依赖映射）
4. **生成源代码清单**：创建完整的源文件清单，包括语言分布和大小指标。
5. **生成输出**：
    - 人类可读的 `.hyper-designer/projectAnalysis/architecture.md`
    - 机器可读的 `_meta/` 清单文件（manifest.json, system-analysis.json, component-manifest.json, api-manifest.json, source-inventory.json）

**输出交付物：**

- `.hyper-designer/projectAnalysis/architecture.md` - 系统架构分析报告
- `.hyper-designer/projectAnalysis/_meta/manifest.json` - 项目分析总清单（项目路径与重跑元数据）
- `.hyper-designer/projectAnalysis/_meta/system-analysis.json` - 结构化维度数据
- `.hyper-designer/projectAnalysis/_meta/component-manifest.json` - 完整组件清单（阶段2的唯一事实来源）
- `.hyper-designer/projectAnalysis/_meta/api-manifest.json` - API清单和组件映射
- `.hyper-designer/projectAnalysis/_meta/source-inventory.json` - 源文件清单

#### 阶段 2：componentAnalysis (组件分析)

**执行者：** HAnalysis
**核心目标：** 基于阶段1的组件清单，并行分析每个组件的4个维度，生成组件级分析报告。

**输入依赖：**

- `.hyper-designer/projectAnalysis/_meta/component-manifest.json`（唯一事实来源，不得重新扫描）

**执行行动指引：**

1. **加载组件清单**：从 `_meta/component-manifest.json` 读取完整的组件清单。
2. **并行分析组件**：对每个组件执行4个维度的分析：
    - 输入/输出/位置（IOP）维度
    - 职责和范围维度
3. **生成组件输出**：为每个组件生成：
    - 人类可读的 `component/{componentSlug}.md`
    - 机器可读的 `_meta/components/{componentSlug}.json`
4. **协调步骤**：验证清单与实际输出的一致性，聚合质量指标。

**输出交付物：**

- `.hyper-designer/projectAnalysis/component/{componentSlug}.md`（每个组件的分析报告）
- `.hyper-designer/projectAnalysis/_meta/components/{componentSlug}.json`（每个组件的机器可读数据）
- `.hyper-designer/projectAnalysis/_meta/component-analysis-summary.json`（协调步骤的汇总报告）

#### 阶段 3：missingCoverageCheck (缺失覆盖率检查)

**执行者：** HAnalysis
**核心目标：** 严格验证所有维度的覆盖率，识别缺失的分析内容，生成诊断报告。

**输入依赖：**

- `.hyper-designer/projectAnalysis/architecture.md`
- `.hyper-designer/projectAnalysis/component/{componentSlug}.md`（所有组件）
- `.hyper-designer/projectAnalysis/_meta/` 下的所有清单文件

**执行行动指引：**

1. **加载所有清单**：读取阶段1和阶段2生成的所有清单文件。
2. **执行7类严格检查**：
    - 缺失组件（清单中引用但未定义）
    - 缺失文件（引用但不存在）
    - 缺失文件夹（预期目录结构缺失）
    - API识别遗漏（代码中使用但未记录）
    - Mermaid覆盖不足（关键图表缺失或不完整）
    - 跨引用损坏（文档间无效链接）
    - 系统/组件不一致（系统规格与组件分析不匹配）
3. **生成诊断报告**：
    - 人类可读的 `coverage-report.md`
    - 机器可读的 `_meta/coverage-report.json`（包含结构化判定、严重性、受影响工件的修复建议）

**输出交付物：**

- `.hyper-designer/projectAnalysis/coverage-report.md` - 覆盖率检查报告
- `.hyper-designer/projectAnalysis/_meta/coverage-report.json` - 结构化判定数据

### 工作流特性说明

**非阻塞验证模式：**
本工作流使用报告和测试验证而非质量门阻塞。阶段3的缺失覆盖率检查是诊断工具，不会阻止工作流推进。检查结果用于：

- 生成覆盖率报告供人工审查
- 在测试套件中进行自动化断言
- 指导后续迭代和改进工作

**清单驱动的编排：**
所有阶段通过 `_meta/` 目录中的清单交换数据。下游阶段不得重新扫描源代码，必须使用清单作为唯一事实来源。

**增量分析支持：**
所有工件支持恢复/重新运行，通过在重新生成前检查现有清单。
