## 当前阶段：初始需求分析

**阶段标识**: `IRAnalysis`  
**执行Agent**: HArchitect  
**核心目标**: 通过结构化对话澄清模糊需求，输出包含 5W2H 全维度的 `需求信息.md`。

### 1. 资料收集

**必须先完成资料收集，再开始执行。**
使用 `task` 工具委派 HCollector 进行资料收集

#### 所需资料类别

| 资料类别 | 关键内容 | 必需性 | 用途 |
|----------|----------|--------|------|
| **Codebase Assets** | 现有项目源码 (`src/`, `lib/`) | 如有则必需 | 理解现有系统架构与技术栈 |
| **Domain Knowledge** | 行业标准、合规文档、业务术语表 | 必需 | 确保需求符合行业规范 |
| **Reference Projects** | 对标项目链接、开源实现参考 | 可选 | 提供技术选型参考 |

### 2. 执行规范

**核心 Skill**: `ir-analysis`

加载此 Skill 获取需求分析方法论（5W2H 框架、苏格拉底式提问）。Agent 必须严格遵循 Skill 内部的模板结构。

**核心参考资料**: `.hyper-designer/IRAnalysis/document/manifest.md`

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
|--------|------|----------|
| **需求信息.md** | `.hyper-designer/IRAnalysis/需求信息.md` | Markdown, 包含完整 5W2H 章节 |
| **draft.md** | `.hyper-designer/IRAnalysis/draft.md` | 工作草稿 |

### 4. 质量审查

| 维度 | 标准 |
|------|------|
| **完整性** | 5W2H 各维度有明确描述，严禁 "TBD" 或空白 |
| **一致性** | Why (目标) 与 What (功能) 逻辑自洽，无矛盾约束 |
| **可追溯性** | 需求有明确的来源引用或用户确认记录 |
| **规范性** | 文档结构符合 `ir-analysis` skill 定义的模板 |
