## 当前阶段：需求分解

**阶段标识**: `requirementDecomposition`  
**执行Agent**: HEngineer  
**核心目标**: 应用领域驱动设计（DDD）将系统级需求（SR）细化为模块级需求与可执行实现要求（AR），定义子系统接口与依赖关系。

### 1. 输入与资料收集

**在开始执行前，必须通过读取资料清单和自主搜集完成资料收集。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出) | 功能列表（{系统名}功能列表.md） | 必需 | 分解的权威输入，建立SR-AR映射 |
| **系统设计资料**<br>(现有架构) | 现有系统架构文档 | 如有则必需 | 重构/迁移项目的部署拓扑与模块清单 |
| **领域资料**<br>(技术约束) | 部署环境、性能要求 | 必需 | 确定技术边界与设计约束 |
| **代码库资料**<br>(参考模式) | 参考项目架构模式 | 可选 | 架构参考、最佳实践 |

**资料收集流程**（详见"单阶段处理流程 Step 2"）：

1. **读取资料清单**：读取项目根目录 `资料清单.md` 中 "需求分解 (requirementDecomposition)" Section，解析用户填写的资料信息。
2. **确认完整性**：检查必需资料是否已填写，向用户汇报状态并确认是否需要补充。
3. **搜集与解析**：根据资料清单信息读取本地文件和URL，使用 `explore`/`librarian` 自主搜集补充资料，生成 `.hyper-designer/requirementDecomposition/document/manifest.md`。

### 2. 执行规范与 Skill 使用

**核心 Skills**:

- `sr-ar-decomposition` - SR→AR 分解方法论与模板
- `ir-sr-ar-traceability` - 建立并验证 IR→SR→AR 的追溯链

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **sr-ar-decomposition.md** | `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md` | Markdown，包含 SR 列表、对应 AR、模块接口定义、依赖矩阵与优先级 |
| **traceability-report.md** | `.hyper-designer/requirementDecomposition/traceability-report.md` | Markdown，IR→SR→AR 追溯链验证报告 |

### 4. 质量审查

**审核标准:**

1. **SR-AR 分解合理性**: 每个 SR 是否被完整且恰当地映射为一个或多个 AR，且无明显遗漏？
2. **模块边界清晰性**: 模块职责、接口与依赖是否明确，是否遵循低耦合高内聚原则？
3. **追溯链完整性**: 从 IR → SR → AR 的追溯链是否完整、可验证，并记录了来源与决策理由？
4. **规范性**: 文档结构是否符合 `sr-ar-decomposition` skill 定义的模板？
