# hyper-designer

一个 OpenCode 插件，实现了专业化的代理和工作流管理，用于需求工程和系统设计。

## 功能特性

hyper-designer 提供了完整的需求工程工作流，包含四个专业化代理：

- **HCollector**：数据收集和参考资料收集代理
- **HArchitect**：系统架构师，管理 9 阶段设计工作流
- **HCritic**：设计评审代理，提供质量保证
- **HEngineer**：系统工程师，处理功能设计和分解

### 工作流阶段

1. **数据收集** - 参考资料收集和初始数据收集
2. **初始需求分析** - 5W2H 框架和 SMART 需求
3. **场景分析** - 用户旅程映射和用例场景
4. **用例分析** - 详细用例规范
5. **功能细化** - 功能需求细化
6. **系统需求分解** - 分解系统需求
7. **系统功能设计** - 高层系统架构
8. **活动需求分解** - 详细活动规范
9. **模块功能设计** - 组件级设计和实现

## 安装

告诉 OpenCode：

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/aiimoyu/hyper-designer/refs/heads/main/INSTALL.md
```

详细信息请参见 [INSTALL.md](INSTALL.md)。


## 使用

### 开始新设计

只需告诉 HArchitect 您想要设计什么系统：

```
"我想设计一个实时通知系统"
```

HArchitect 将引导您完成完整的 9 阶段工作流，并根据需要与其他代理协调。

### 可用代理

- **@HArchitect**：主工作流协调员和系统架构师
- **@HCollector**：数据收集和研究专家
- **@HCritic**：设计评审员和质量保证
- **@HEngineer**：技术设计和实施专家

### 工作流工具

该插件提供工作流状态管理工具：

- `get_hd_workflow_state` - 检查当前工作流进度
- `set_hd_workflow_stage` - 更新阶段完成状态
- `set_hd_workflow_current` - 设置当前活动阶段
- `set_hd_workflow_handover` - 在代理之间转移控制权


## 架构

该插件设计为框架无关：

- **框架无关**：核心逻辑与 OpenCode 特定代码分离
- **基于技能**：动态技能注入，提供特定阶段指导
- **有状态工作流**：持久化工作流状态管理
- **代理协调**：专业化代理之间的无缝交接

## 开发

该项目实现了代理、动态提示组合和技能管理，核心逻辑和框架集成之间有清晰的分离。

## 贡献

请参阅 [AGENTS.md](AGENTS.md) 了解编码指南和开发标准。

## 许可证

详细信息请参见 LICENSE 文件。</content>
<parameter name="filePath">