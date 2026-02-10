# 当前阶段

**你现在处于：需求分解 (Requirement Decomposition) 阶段**

**必须使用的 Skills：**
- `sr-ar-decomposition` - 需求分解
- `ir-sr-ar-traceability` - 需求追溯

使用这些 skills 将功能列表映射并分解为模块级需求、子系统和接口定义，生成系统需求分解文档，并建立从 IR 到 SR 再到 AR 的完整追溯关系。

## 质量审核要求

**强制审核：** 完成本阶段所有输出文档后，**必须**使用 `HCritic` agent 进行设计审核。

- 调用方式：{{TOOL:delegate_critic_review}}
- 审核未通过时：根据 HCritic 的反馈意见，**必须**修改文档并重新提交审核
- 审核流程：重复"生成文档 → HCritic 审核 → 修改"直到审核通过
- **禁止跳过审核**：未经 HCritic 审核通过的文档不得进入下一阶段
