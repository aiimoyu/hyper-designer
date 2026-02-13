## 当前阶段：初始需求分析

**阶段标识**: `IRAnalysis`  
**执行Agent**: HArchitect  
**核心目标**: 通过结构化对话澄清模糊需求，输出包含 5W2H 全维度的 `需求信息.md`。

### 1. 输入与资料收集

**在开始执行前，必须通过委派 HCollector subagent 完成资料收集。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **Codebase Assets**<br>(代码库资料) | 现有项目源码 (`src/`, `lib/`) | 如有则必需 | 理解现有系统架构与技术栈 |
| **Domain Knowledge**<br>(领域资料) | 行业标准、合规文档、业务术语表 | 必需 | 确保需求符合行业规范与业务逻辑 |
| **Reference Projects**<br>(参考资料) | 对标项目链接、开源实现参考 | 可选 | 提供技术选型与功能实现的对标参考 |

**资料收集流程**：

1. **准备 HCollector 输入**：
   ```json
   {
     "stage": "IRAnalysis",
     "status": "init",
     "required_assets": [
       { "category": "Codebase Assets", "description": "理解现有系统架构与技术栈" },
       { "category": "Domain Knowledge", "description": "确保需求符合行业规范与业务逻辑" },
       { "category": "Reference Projects", "description": "提供技术选型与功能实现的对标参考" }
     ]
   }
   ```

2. **委派 HCollector**：使用 `task` 工具调用 HCollector subagent 进行资料收集。

3. **多轮交互**：HCollector 将通过 JSON 响应请求与用户交互，你需要作为中继代理传递问答，直到 HCollector 返回 `action="finish"`。

4. **收集完成**：HCollector 将自动生成 `.hyper-designer/IRAnalysis/document/manifest.md` 和 `draft.md`。

详细的委派和交互协议请参见 **"单阶段处理流程 Step 2"**。

### 2. 执行规范与 Skill 使用

**核心 Skill**: `ir-analysis`

此 Skill 提供了需求分析的方法论（5W2H框架、苏格拉底式提问）。Agent 必须严格遵循 Skill 内部的模板结构。


### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **需求信息.md** | `.hyper-designer/IRAnalysis/需求信息.md` | Markdown, 包含完整的 5W2H 章节 |
| **draft.md** | `.hyper-designer/IRAnalysis/draft.md` | 工作草稿 |

### 4. 质量审查

**审核标准:**

1. **完整性**: 5W2H 各维度是否有明确的描述？严禁出现 "TBD" 或空白项。
2. **一致性**: "Why" (目标) 与 "What" (功能) 是否逻辑自洽？是否存在矛盾约束？
3. **可追溯性**: 需求是否有明确的来源引用或用户确认记录？
4. **规范性**: 文档结构是否符合 `ir-analysis` skill 定义的模板？
