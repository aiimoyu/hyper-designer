# hyper-designer

一个 OpenCode 插件，实现了专业化的 AI Agent 协作和标准化工作流管理，用于需求工程和系统设计。

## 功能特性

### 四大核心 Agent

| Agent | 角色定位 | 主要职责 |
|-------|---------|---------|
| **HArchitect** | 系统架构师 | 需求分析流程管理（IR分析 → 场景分析 → 用例分析 → 功能细化） |
| **HEngineer** | 系统工程师 | 系统级设计（SR-AR分解、架构设计）和模块级详细设计 |
| **HCollector** | 需求收集专家 | 数据收集、用户访谈、参考资料整理 |
| **HCritic** | 设计评审员 | 阶段文档质量检查、一致性验证、质量门评审 |

### 7 阶段标准化工作流

```
阶段1: 初始需求分析(IR)     @HArchitect  → ir-analysis
阶段2: 场景分析             @HArchitect  → scenario-analysis
阶段3: 用例分析             @HArchitect  → use-case-analysis
阶段4: 功能细化             @HArchitect  → functional-refinement
阶段5: 需求分解(SR-AR)      @HEngineer   → sr-ar-decomposition
阶段6: 系统功能设计         @HEngineer   → functional-design
阶段7: 模块功能设计         @HEngineer   → functional-design
```

每个阶段通过对应的 Skill 文件注入专属方法论，完成后需通过 HCritic 质量门评审。

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
    }
  }
}
```

### 配置项说明

| 字段 | 说明 |
|------|------|
| `workflow` | 工作流类型，目前支持 `classic` |
| `agents.{name}.model` | Agent 使用的模型 ID |
| `agents.{name}.temperature` | 模型温度参数 |
| `agents.{name}.maxTokens` | 最大输出 Token 数 |

## 快速开始

### 1. 启动工作流

按 **Tab** 键切换到 **HArchitect** 入口，输入：

```
我想设计一个实时通知系统
```

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
- **通过**：进入下一阶段
- **不通过**：返回修改后重新评审

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
│   ├── agents/                    # Agent 定义
│   │   ├── HArchitect/            # 系统架构师
│   │   ├── HEngineer/             # 系统工程师
│   │   ├── HCollector/            # 需求收集专家
│   │   ├── HCritic/               # 设计评审员
│   │   └── factory.ts             # Agent 创建工厂
│   │
│   ├── workflows/                 # 工作流引擎
│   │   ├── core/                  # 核心逻辑
│   │   └── plugins/classic/       # 经典工作流
│   │
│   ├── skills/hyper-designer/     # 技能文件
│   │   ├── ir-analysis/           # IR分析技能
│   │   ├── scenario-analysis/     # 场景分析技能
│   │   ├── use-case-analysis/     # 用例分析技能
│   │   ├── functional-refinement/ # 功能细化技能
│   │   ├── sr-ar-decomposition/   # SR-AR分解技能
│   │   └── functional-design/     # 功能设计技能
│   │
│   ├── tools/                     # 工具实现
│   │   └── documentReview/        # 文档审核工具
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
