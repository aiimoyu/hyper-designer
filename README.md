# hyper-designer

一个 OpenCode 插件，通过专业化 AI Agent 协作和标准化工作流，实现从需求工程到系统设计的全流程智能化。

## 核心资产一览

### Skills（方法论）

| 类别 | Skill 名称 | 用途说明 | 触发场景 |
|------|-----------|---------|---------|
| **复杂流程** | `ir-analysis` | 初始需求分析，使用5W2H框架和苏格拉底式提问 | 用户有系统/产品想法需要结构化需求澄清 |
| **复杂流程** | `scenario-analysis` | 场景分析，识别系统参与者和功能使用场景 | 需要识别系统角色或构建场景库 |
| **复杂流程** | `use-case-analysis` | 用例分析，定义系统行为和交互流程 | 需要详细描述系统用例和交互 |
| **复杂流程** | `functional-refinement` | 功能细化，将场景转化为可实施的功能定义 | 需要将场景转化为具体功能列表 |
| **复杂流程** | `sr-ar-decomposition` | SR-AR分解，系统需求到分配需求的映射 | 需求分解和架构映射 |
| **复杂流程** | `functional-design` | 功能设计，系统级和模块级详细设计 | 需要进行系统或模块的功能设计 |
| **复杂流程** | `sdd-plan-generator` | SDD开发计划生成，任务拆分和波次划分 | 需要根据MFD生成可执行的开发计划 |
| **简单流程** | `lite-designer` | 轻量级需求设计，三步快速产出文档和计划 | 中小规模功能增强需求，快速产出结构化文档 |
| **项目分析** | `projectAnalysis` | 项目分析，系统架构/组件/覆盖率分析 | 陌生项目快速理解，架构分析 |

### Agents（角色）

| Agent | 角色定位 | 主要职责 | 协作模式 |
|-------|---------|---------|---------|
| **Hyper** | 路由代理 | 智能路由用户请求到正确的专业代理；工作流未初始化时直接处理简单请求 | primary，统一入口 |
| **HArchitect** | 系统架构师 | 需求分析流程管理（IR分析 → 场景分析 → 用例分析 → 功能细化） | primary，主流程协调员 |
| **HEngineer** | 系统工程师 | 系统级设计（SR-AR分解、架构设计）和模块级详细设计 | primary，接收 HArchitect 交接 |
| **HCollector** | 需求收集专家 | 数据收集、用户访谈、参考资料整理 | all，接受 HArchitect 委派 |
| **HCritic** | 设计评审员 | 阶段文档质量检查、一致性验证、质量门评审 | subagent，被动触发只读审查 |
| **HAnalysis** | 项目分析专家 | 系统分析 → 组件分析 → 缺漏检查 | primary，projectAnalysis 工作流专用 |

### Workflows（工作流）

| 工作流 | 阶段数 | 执行流程 | 适用场景 |
|-------|-------|---------|---------|
| **Classic** | 8阶段 | IR分析 → 场景分析 → 用例分析 → 功能细化 → SR-AR分解 → 系统功能设计 → 模块功能设计 → SDD计划生成 | 全新系统从零设计、多团队协作的大型项目 |
| **Lite Designer** | 3阶段 | 需求场景分析 → 功能与模块设计 → SDD开发计划 | 功能增强型需求、中小规模新功能开发 |
| **Project Analysis** | 3阶段 | 系统分析 → 组件分析 → 缺漏检查 | 陌生项目快速理解、架构分析、覆盖率检查 |

---

## 功能特性

### 六大核心 Agent

| Agent | 角色定位 | 主要职责 |
|-------|---------|---------|
| **Hyper** | 路由代理 | 智能路由用户请求到正确的专业代理；工作流未初始化时直接处理简单请求 |
| **HArchitect** | 系统架构师 | 需求分析流程管理（IR分析 → 场景分析 → 用例分析 → 功能细化） |
| **HEngineer** | 系统工程师 | 系统级设计（SR-AR分解、架构设计）和模块级详细设计 |
| **HCollector** | 需求收集专家 | 数据收集、用户访谈、参考资料整理 |
| **HCritic** | 设计评审员 | 阶段文档质量检查、一致性验证、质量门评审 |
| **HAnalysis** | 项目分析专家 | 项目架构分析、组件分析、覆盖率检查 |

### 工作流类型

#### Classic 工作流（8 阶段）

```
阶段1: 初始需求分析(IR)     @HArchitect  → ir-analysis
阶段2: 场景分析             @HArchitect  → scenario-analysis
阶段3: 用例分析             @HArchitect  → use-case-analysis
阶段4: 功能细化             @HArchitect  → functional-refinement
阶段5: 需求分解(SR-AR)      @HEngineer   → sr-ar-decomposition
阶段6: 系统功能设计         @HEngineer   → system-functional-design
阶段7: 模块功能设计         @HEngineer   → module-functional-design
阶段8: SDD 开发计划生成     @HEngineer   → sdd-plan-generation
```

每个阶段通过对应的 Skill 文件注入专属方法论，完成后需通过 HCritic 质量门评审（score > 75）。

#### Lite Designer 工作流（3 阶段）

```
阶段1: 需求场景分析         @HArchitect  → requirement-analysis
阶段2: 需求设计             @HEngineer   → requirement-design
阶段3: 开发计划             @HEngineer   → development-plan
```

**特点**：
- 适用于中小规模功能增强需求
- 快速产出结构化文档和开发计划
- 同样需要通过质量门评审

#### Project Analysis 工作流（3 阶段）

```
阶段1: 系统分析               @HAnalysis  → system-analysis
阶段2: 组件分析               @HAnalysis  → component-analysis
阶段3: 缺漏检查               @HAnalysis  → missing-coverage-check
```

**目标输出**：
- 系统架构分析报告：`{项目根}/.hyper-designer/projectAnalysis/architecture.md`
- 组件分析报告：`{项目根}/.hyper-designer/projectAnalysis/component/*.md`
- 中间产物：`{项目根}/.hyper-designer/projectAnalysis/_meta/*`

**特点**：
- 适用于陌生项目的快速理解
- 自动识别架构组件、技术栈、扩展性瓶颈
- 严格的覆盖率检查，确保分析完整性
- 输出包含 Mermaid 图表和代码引用
- 无质量门禁（诊断型工作流）

## 安装

告诉 OpenCode：

```bash
Fetch and follow instructions from https://raw.atomgit.com/u011501137/hyper-designer/raw/master/INSTALL.md
```

详细安装说明请参见 [INSTALL.md](INSTALL.md)。

## 配置

### hd-config.json 配置

在项目根目录创建 `.hyper-designer/hd-config.json`：

```json
{
  "$schema": "https://raw.atomgit.com/u011501137/hyper-designer/raw/master/schemas/hd-config.schema.json",
  "workflow": "classic",
  "agents": {
    "HArchitect": {
      "model": "your-model-id",
      "temperature": 0.7,
      "maxTokens": 200000
    },
    "HCollector": {
      "model": "your-model-id",
      "temperature": 0.2,
      "maxTokens": 200000
    },
    "HCritic": {
      "model": "your-model-id",
      "temperature": 0.1,
      "maxTokens": 200000
    },
    "HEngineer": {
      "model": "your-model-id",
      "temperature": 0.4,
      "maxTokens": 200000
    },
    "HAnalysis": {
      "model": "your-model-id",
      "temperature": 0.5,
      "maxTokens": 200000
    }
  }
}
```

### 配置项说明

| 字段 | 说明 |
|------|------|
| `workflow` | 工作流类型，支持 `classic` 或 `projectAnalysis` |
| `agents.{name}.model` | Agent 使用的模型 ID |
| `agents.{name}.temperature` | 模型温度参数 |
| `agents.{name}.maxTokens` | 最大输出 Token 数 |

## 日志配置

### 环境变量配置

日志系统默认不创建文件（opt-in 设计），需要通过环境变量启用：

```bash
# 启用日志文件写入
export HYPER_DESIGNER_LOG_PERSIST=true

# 设置日志级别（可选，默认 INFO）
export HYPER_DESIGNER_LOG_LEVEL=DEBUG

# 在终端查看日志（可选，用于调试）
export HYPER_DESIGNER_LOG_PRINT=true

# 启用 DEBUG 级别日志（可选）
export HYPER_DESIGNER_LOG_DEBUG=true

# 严格模式：记录错误后抛出异常（可选）
export HD_STRICT_ERRORS=1
```

### 日志级别

| 级别 | 说明 | 优先级 |
|------|------|--------|
| `DEBUG` | 详细调试信息，开发时使用 | 0 |
| `INFO` | 重要操作信息，用户应了解（默认） | 1 |
| `WARN` | 警告信息，不影响功能但需要注意 | 2 |
| `ERROR` | 错误信息，需要立即处理 | 3 |

### 日志文件位置

- **目录**：`.hyper-designer/logs/`（项目根目录）
- **文件名**：`{timestamp}.log`（如 `2026-03-06T10.30-00.log`）
- **格式**：`2026-03-06T10:30:00 +100ms [hyper-designer:ModuleName:INFO] message key=value`

### 使用示例

```typescript
import { HyperDesignerLogger } from './utils/logger'

// 静态方法调用
HyperDesignerLogger.info('MyModule', '操作完成', { duration: 100 })
HyperDesignerLogger.error('MyModule', '操作失败', error, { userId: 123 })

// 模块特定日志器
const logger = HyperDesignerLogger.forModule('MyFeature')
logger.debug('调试信息')
logger.warn('警告信息')
```

### 注意事项

1. **必须设置环境变量**：只有设置了 `HYPER_DESIGNER_LOG_PERSIST=true` 才会创建日志文件
2. **日志文件不会自动创建**：日志系统设计为 opt-in，避免污染项目目录
3. **文件写入失败静默处理**：不会因为日志写入失败而中断程序执行
4. **日志级别过滤**：低于当前级别的日志会被忽略

## 快速开始

### 1. 启动工作流

按 **Tab** 键切换到 **Hyper** 入口（统一路由代理），输入：

```
我想设计一个实时通知系统
```

Hyper 会自动识别您的意图并路由到正确的专业代理（如 HArchitect）。

### 2. 选择工作流

首次使用时，系统会提示您选择工作流类型：
- **Classic**：8 阶段完整流程（推荐大型项目）
- **Lite Designer**：3 阶段轻量流程（推荐中小规模功能）
- **Project Analysis**：项目架构分析（无质量门禁）

### 2. 配置参考资料

首次启动时，系统会在项目根目录创建 `REFERENCE.md` 文件。按照文件指引填写各阶段的参考资料：

```markdown
## 1. Codebase (代码库)
| 子类别 | 您的资料（路径/链接/描述） |
| --- | --- |
| 本项目代码 | src/ |
| 参考项目代码 | https://github.com/xxx/notification-system |

## 2. Domain Analysis Materials (领域分析资料)
| 子类别 | 您的资料 |
| --- | --- |
| 领域架构分析 | docs/architecture.md |
...
```

填写完成后选择 **"已完成，进入下一步"**。

### 3. 阶段交互式修改

每个阶段完成后，系统会：

1. **生成审核文件**：在项目根目录生成 `{文档名}.md`（如 `需求信息.md`）
2. **用户修改**：打开文件，按需修改内容或添加 `//` 注释指令：
   ```markdown
   ## 功能描述
   用户登录功能需要支持多种认证方式 // 增加 OAuth2.0 支持
   
   ## 性能要求
   响应时间应小于 500ms // 改为 200ms
   ```
3. **确认修改**：选择 **"修改完成"**
4. **自动应用**：AI 自动应用您的修改到正式文档

### 4. 质量评审

修改确认后，HCritic 自动进行质量评审：
- **通过**（score > 75）：进入下一阶段
- **不通过**（score ≤ 75）：返回修改后重新评审
- **强制推进**：1 次失败后可使用 `hd_force_next_step` 强制进入下一阶段

## 开发

### 构建与测试

```bash
# 类型检查
npm run typecheck

# 运行所有测试
npm run test

# 运行单个测试文件
npx vitest run src/__tests__/framework/agents/factory.test.ts

# 测试监听模式
npm run test:watch
```

### 项目结构

```
hyper-designer/
├── src/
│   ├── agents/                    # 核心 Agent 系统
│   │   ├── Hyper/                 # 路由代理（统一入口）
│   │   ├── factory.ts             # Agent 创建工厂
│   │   ├── types.ts               # Agent 类型定义
│   │   └── utils.ts               # Agent 工具函数
│   │
│   ├── plugins/                   # 插件系统
│   │   ├── agent/                 # Agent 插件
│   │   │   ├── builtin/           # 内置 Agent 定义
│   │   │   │   ├── HArchitect/    # 系统架构师
│   │   │   │   ├── HEngineer/     # 系统工程师
│   │   │   │   ├── HCollector/    # 需求收集专家
│   │   │   │   ├── HCritic/       # 设计评审员
│   │   │   │   └── HAnalysis/     # 项目分析专家
│   │   │   └── user/              # 用户自定义 Agent 插件
│   │   │
│   │   └── workflow/              # 工作流插件
│   │       ├── builtin/           # 内置工作流定义
│   │       │   ├── classic/       # 经典工作流（8 阶段）
│   │       │   ├── lite/          # 轻量级工作流（3 阶段）
│   │       │   └── projectAnalysis/ # 项目分析工作流（3 阶段）
│   │       └── user/              # 用户自定义工作流插件
│   │
│   ├── workflows/                 # 工作流引擎核心
│   │   ├── core/                  # 核心逻辑
│   │   │   ├── service/           # WorkflowService
│   │   │   ├── state/             # 状态管理
│   │   │   ├── runtime/           # 运行时（交接、提示词加载）
│   │   │   ├── stageHooks/        # 阶段钩子
│   │   │   ├── stageMilestone/    # 里程碑系统
│   │   │   ├── artifacts/         # 产物管理
│   │   │   ├── toolRegistry.ts    # 工具注册管理
│   │   │   └── outputChecker.ts   # 输出文件检查
│   │   └── integrations/          # 平台集成
│   │
│   ├── transform/                 # 转换系统
│   │   ├── agentRouting.ts        # Agent 路由逻辑
│   │   ├── placeholder.ts         # 占位符替换
│   │   ├── injectionRegistry.ts   # 提示词注入注册
│   │   ├── injections/            # 内置注入提供者
│   │   └── opencode/              # OpenCode 平台转换器
│   │
│   ├── sdk/                       # SDK 模块
│   │   └── index.ts               # 统一 SDK 接口
│   │
│   ├── skills/hyper-designer/     # 技能文件
│   │   ├── ir-analysis/           # IR分析技能
│   │   ├── scenario-analysis/     # 场景分析技能
│   │   ├── use-case-analysis/     # 用例分析技能
│   │   ├── functional-refinement/ # 功能细化技能
│   │   ├── sr-ar-decomposition/   # SR-AR分解技能
│   │   ├── functional-design/     # 功能设计技能
│   │   ├── lite-designer/         # 轻量级设计技能
│   │   ├── sdd-plan-generator/    # SDD计划生成技能
│   │   ├── project-analysis-concepts/ # 项目分析共享概念
│   │   ├── system-analysis/       # 系统分析技能
│   │   ├── component-analysis/    # 组件分析技能
│   │   └── missing-coverage-check/ # 缺漏检查技能
│   │
│   ├── tools/                     # 工具定义
│   │
│   ├── adapters/                  # 平台适配器
│   │   └── opencode/              # OpenCode 平台实现
│   │
│   ├── config/                    # 配置加载
│   │
│   └── utils/                     # 工具函数
│
├── opencode/.plugins/             # OpenCode 插件入口
└── AGENTS.md                      # 开发规范
```

### 添加新 Skill

1. 在 `src/skills/hyper-designer/` 创建新目录
2. 编写 `SKILL.md`（包含方法论、模板、检查清单）
3. 在工作流阶段定义中引用

## 贡献

欢迎提交 Issue 和 Pull Request。请确保：

1. 代码通过类型检查 `npm run typecheck`
2. 所有测试通过 `npm run test`
3. 遵循 [AGENTS.md](AGENTS.md) 中的编码规范

## 许可证

详见 LICENSE 文件。
