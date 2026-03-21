# Project Analysis Workflow Shared Reference

## 术语表

| 术语 | 定义 |
|------|------|
| **目标项目 (Target Project)** | 被分析的外部项目（在阶段1提供路径） |
| **分析根目录 (Analysis Root)** | 目标项目中的 `./.hyper-designer/projectAnalysis/` 目录 |
| **组件 (Component)** | 具有清晰职责边界的代码逻辑单元（在阶段1自动发现） |
| **覆盖率 (Coverage)** | 源代码在所有维度上被文档化和分析的程度 |
| **维度 (Dimension)** | 分析的特定视角或方面（架构5维度、组件4维度） |

---

## 输出文件约定（纯 Markdown）

所有分析工件以纯 Markdown 格式输出，无需 JSON 清单文件。阶段间通过 Markdown 文件交换数据。

### 输出目录结构

```
./.hyper-designer/projectAnalysis/
├── architecture.md               # 系统架构分析（5维度 + Mermaid图表）
├── components-manifest.md        # 组件清单（Markdown表格）
├── api-catalog.md                # API目录
├── source-overview.md            # 源码概览
├── components/                   # 组件分析目录
│   └── {componentSlug}.md        # 每个组件的4维度分析
├── component-analysis-summary.md # 组件分析汇总报告
└── coverage-report.md            # 覆盖率检查报告（含判定、严重性、修复建议）
```

### Markdown 驱动的交接

所有阶段通过 `.md` 文件交换数据。下游阶段不得重新扫描源代码，必须使用上游阶段生成的 Markdown 文件作为唯一事实来源。各文件用途：

- `components-manifest.md`：阶段2的唯一事实来源
- `architecture.md`：阶段3的系统级参照基准
- `components/{componentSlug}.md`：阶段3的组件级分析输入

---

## Mermaid 图表约定

### 支持的图表类型

| 类型 | 用途 | 适用阶段 |
|------|------|----------|
| `graph TD` | 层次结构、目录结构、依赖树 | 全部 |
| `graph LR` | 流程、管道、交互 | 全部 |
| `sequenceDiagram` | 请求-响应流、调用序列 | 全部 |
| `classDiagram` | 数据模型、类结构、接口 | 全部 |
| `stateDiagram` | 状态机、生命周期 | 全部 |
| `erDiagram` | 数据库模式、实体关系 | 全部 |
| `gantt` | 时间线、流程 | 可选 |
| `pie` | 统计、分布 | 可选 |

### 图表命名规则

每个图表必须有描述性标题。

### 节点命名约定

- 文件和模块：使用相对于目标项目根目录的完整路径
- 组件：使用 `components-manifest.md` 中的组件 slug
- 层级：使用标准层级名称（API Layer / Business Layer / Data Layer 等）

### 边类型

| 边类型 | 样式 | 含义 |
|--------|------|------|
| 直接依赖 | `-->` | 标准依赖 |
| 弱依赖 | `-.->` | 可选或间接 |
| 双向 | `<-->` | 循环依赖（警告） |
| 数据流 | `==>` | 数据移动 |
| 控制流 | `-->` | 执行顺序 |

### 图表大小限制

- 最大节点数：50
- 最大边数：100
- 最大嵌套深度：5层

超出限制时拆分为多个图表并编号。

---

## 代码引用规则

所有分析工件必须使用标准化引用格式引用源代码。

### 引用格式

- 行内引用：`[File: 相对路径/文件.ts:行范围]`
- 函数引用：`[Function: 函数名 in File: 相对路径/文件.ts:行范围]`
- 类引用：`[Class: 类名 in File: 相对路径/文件.ts:行范围]`

### 引用规则

1. 使用相对路径，禁止机器绝对路径
2. 行内引用必须包含行范围
3. 引用最小相关单元，避免过宽引用
4. 所有引用必须指向实际存在的文件
5. 避免逐行过度引用，按代码单元引用
6. 多个相关引用应分组展示

---

## 工作流行为说明

### 非阻塞验证模式

阶段3的缺失覆盖率检查是诊断工具，不会阻止工作流推进。

### 增量分析支持

工件支持恢复/重新运行。若现有 Markdown 文件有效，可复用并进行增量补全。
