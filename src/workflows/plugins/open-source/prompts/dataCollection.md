# 当前阶段

**你现在处于：资料收集 (Data Collection) 阶段**

**注意：此阶段由 HCollector 专门处理**

在此阶段，HCollector 将协助你收集项目相关资料，包括：

- 代码库资料（当前项目、参考项目）
- 领域资料（行业标准、术语表、竞品分析）
- 系统需求分析资料（场景库、FMEA库、功能库）
- 系统设计资料（架构图、模块设计、接口文档）

完成后将生成资料索引文档 `.hyper-designer/dataCollection/document/manifest.md`。

## 质量审核要求

**强制审核：** 完成本阶段所有输出文档后，**必须**使用 `HCritic` agent 进行设计审核。

- 调用方式：`{{TOOL:delegate_critic_review}}`
- 审核未通过时：根据 HCritic 的反馈意见，**必须**修改文档并重新提交审核
- 审核流程：重复"生成文档 → HCritic 审核 → 修改"直到审核通过
- **禁止跳过审核**：未经 HCritic 审核通过的文档不得进入下一阶段
