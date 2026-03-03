# hyper-designer

一个 OpenCode 插件，实现了专业化的 AI Agent 协作和标准化工作流管理，用于需求工程和系统设计。

## 功能特性

hyper-designer 通过专业化 Agent 协作和 8 阶段标准化工作流，实现从需求分析到系统设计的全流程智能化。

### 四大核心 Agent

| Agent | 角色定位 | 主要职责 | 工作模式 |
|-------|---------|---------|---------|
| **HCollector** | 需求收集专家 | 数据收集、用户访谈、参考资料整理 | 被 HArchitect 委派 |
| **HArchitect** | 系统架构师 | 需求分析流程管理（IR分析 → 场景分析 → 用例分析 → 功能细化） | 主流程协调员 |
| **HEngineer** | 系统工程师 | 系统级设计（SR-AR分解、架构设计）和模块级详细设计 | HArchitect 交接后接管 |
| **HCritic** | 设计评审员 | 阶段文档质量检查、一致性验证、质量门评审 | 被动触发，只读审查 |

### 8 阶段标准化工作流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        hyper-designer 工作流                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  阶段1: 数据收集              @HCollector                               │
│    ↓ 收集参考资料、领域知识、场景库                                        │
│                                                                         │
│  阶段2: 初始需求分析(IR)      @HArchitect  (输出: 需求信息.md)              │
│    ↓ 5W2H 框架、苏格拉底式对话                                            │
│                                                                         │
│  阶段3: 场景分析              @HArchitect  (输出: 功能场景.md)             │
│    ↓ 业务/操作/维护/制造/其他场景分类                                         │
│                                                                         │
│  阶段4: 用例分析              @HArchitect  (输出: 用例.md)                 │
│    ↓ 用例规格（表格格式），输入/输出、验收标准                                │
│                                                                         │
│  阶段5: 功能细化              @HArchitect  (输出: {系统名}功能列表.md)      │
│    ↓ 简化功能细化表（功能、描述、优先级、估算），便于快速交接给 HEngineer         │
│    ↓ ──────────────────────────────────────── 交接给 HEngineer ────────│
│                                                                         │
│  阶段6: 需求分解(SR-AR)       @HEngineer   (输出: sr-ar-decomposition.md) │
│    ↓ 系统需求→模块需求→实现需求，DDD映射                                  │
│                                                                         │
│  阶段7: 系统功能设计          @HEngineer   (输出: system-design.md)       │
│    ↓ 架构设计、技术栈选择、数据模型                                        │
│                                                                         │
│  阶段8: 模块功能设计          @HEngineer   (输出: module-specs.md)        │
│    ↓ 详细类设计、算法、接口定义、测试策略                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**每个阶段完成后必须通过 @HCritic 质量门评审才能进入下一阶段**

### 技能驱动的专业化能力

每个工作流阶段通过 Skill 文件注入专属方法论：

- **ir-analysis**: 5W2H框架、苏格拉底式对话指南
- **scenario-analysis**: 场景识别方法论、业务/操作/维护/制造/其他场景分类
- **use-case-analysis**: 用例模板、DFX设计指南
- **functional-refinement**: 简化功能细化表（功能、描述、优先级、估算），支持快速交接与实现评估
- **sr-ar-decomposition**: SR-AR分解、DDD模式映射
- **functional-design**: 系统架构设计、模块详细设计

## 安装

告诉 OpenCode：

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/aiimoyu/hyper-designer/refs/heads/main/INSTALL.md
```

详细安装说明请参见 [INSTALL.md](INSTALL.md)。

## 使用

### 快速开始

只需告诉 HArchitect 您想要设计什么系统：

```
@HArchitect 我想设计一个实时通知系统
```

HArchitect 将引导您完成完整的 8 阶段工作流，自动协调其他 Agent 完成各个阶段。

### 分阶段使用

也可以在特定阶段独立使用 Agent：

```
# 仅进行需求收集
@HCollector 请帮我收集电商系统的参考资料和类似系统案例

# 仅进行设计评审
@HCritic 请评审这份系统架构设计文档

# 接手 HArchitect 完成的功能细化，进行系统设计
@HEngineer 基于这份功能列表，帮我进行 SR-AR 分解和系统架构设计
```

### 工作流管理工具

插件提供工作流状态管理工具：

```typescript
// 检查当前工作流进度
hd_workflow_state()

// 在代理之间转移控制权（需要先通过质量门）
hd_handover("requirementDecomposition")

// [仅 HCritic] 提交质量门评审分数
hd_submit_evaluation({ score: 85, comment: "文档结构完整，覆盖了主要需求" })
```

### 工作流切换

支持多种工作流模式，可在配置中切换：

- **classic**: 经典需求工程工作流（默认）
- **open-source**: 开源项目适配的工作流

配置方法：
```json
// .hyper-designer/hd-config.json
{
  "workflow": "classic"
}
```

## 架构设计

### 框架无关架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode 平台层                           │
├─────────────────────────────────────────────────────────────┤
│  opencode/.plugins/hyper-designer.ts  (框架适配层)           │
│    - Agent 注册                                              │
│    - 工具暴露                                                │
│    - Hook 注册                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  hyper-designer 核心层 (框架无关)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  HCollector │  │  HArchitect │  │   HCritic   │  ...     │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│        ↑                                               ↑    │
│        └──────────────  Agent Factory  ────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    工作流引擎                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │  State   │  │ Handover │  │ Prompts  │            │  │
│  │  │ Manager  │  │ Handler  │  │ Loader   │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    技能系统                            │  │
│  │  src/skills/ir-analysis/SKILL.md                      │  │
│  │  src/skills/scenario-analysis/SKILL.md                │  │
│  │  src/skills/use-case-analysis/SKILL.md                │  │
│  │  ...                                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心特性

- **框架无关**：核心逻辑与 OpenCode 特定代码完全分离，可移植到其他 AI 框架
- **插件化工作流**：通过 WorkflowDefinition 接口支持自定义工作流
- **技能注入**：通过 `experimental.chat.system.transform` Hook 动态注入阶段专属能力
- **状态持久化**：工作流状态保存到 `.hyper-designer/workflow_state.json`
- **Agent 协作**：基于事件驱动的 Agent 交接机制

## 项目结构

```
hyper-designer/
├── src/
│   ├── agents/                    # Agent 定义
│   │   ├── HCollector/            # 需求收集专家
│   │   ├── HArchitect/            # 系统架构师
│   │   ├── HCritic/               # 设计评审员
│   │   ├── HEngineer/             # 系统工程师
│   │   ├── factory.ts             # Agent 创建工厂
│   │   ├── types.ts               # Agent 类型定义
│   │   └── utils.ts               # Agent 工具函数
│   │
│   ├── workflows/                 # 工作流引擎
│   │   ├── core/                  # 核心工作流逻辑
│   │   │   ├── types.ts           # 工作流类型定义
│   │   │   ├── state.ts           # 状态管理
│   │   │   ├── handover.ts        # 交接处理
│   │   │   ├── prompts.ts         # 提示词加载
│   │   │   └── registry.ts        # 工作流注册表
│   │   ├── plugins/               # 工作流插件
│   │   │   ├── classic/           # 经典工作流
│   │   │   └── open-source/       # 开源工作流
│   │   └── hooks/opencode/        # OpenCode 钩子实现
│   │
│   ├── skills/                    # 技能文件
│   │   ├── ir-analysis/           # IR分析技能
│   │   ├── scenario-analysis/     # 场景分析技能
│   │   ├── use-case-analysis/     # 用例分析技能
│   │   ├── functional-refinement/ # 功能细化技能
│   │   ├── sr-ar-decomposition/   # SR-AR分解技能
│   │   └── functional-design/     # 功能设计技能
│   │
│   ├── config/                    # 配置管理
│   │   └── loader.ts              # 配置加载器
│   │
│   ├── tools/                     # 工具提示词生成
│   │   ├── index.ts               # 工具接口
│   │   └── opencode.ts            # OpenCode 工具定义
│   │
│   ├── utils/                     # 工具函数
│   │   └── logger.ts              # 统一日志
│   │
│   ├── __tests__/                 # 测试套件
│   │   ├── framework/             # 单元测试
│   │   └── instances/             # 集成测试
│   │
│   └── index.ts                   # 主入口
│
├── opencode/.plugins/             # OpenCode 插件入口
│   └── hyper-designer.ts
│
└── AGENTS.md                      # 开发规范
```

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

### 编码规范

请参见 [AGENTS.md](AGENTS.md) 了解详细的编码指南和开发标准。

### 添加新 Agent

1. 在 `src/agents/` 创建新目录
2. 实现 `createXAgent()` 工厂函数
3. 在 `src/agents/utils.ts` 中注册
4. 在工作流定义中配置交接

### 添加新工作流

1. 在 `src/workflows/plugins/` 创建新目录
2. 实现 `WorkflowDefinition` 接口
3. 在 `src/workflows/core/registry.ts` 中注册
4. 创建阶段提示词文件

### 添加新 Skill

1. 在 `src/skills/` 创建新目录
2. 编写 `SKILL.md`（包含方法论、模板、检查清单）
3. 在工作流阶段定义中引用

## 贡献

欢迎提交 Issue 和 Pull Request。请确保：

1. 代码通过类型检查 `npm run typecheck`
2. 所有测试通过 `npm run test`
3. 遵循 [AGENTS.md](AGENTS.md) 中的编码规范

## 许可证

详见 LICENSE 文件。
