# Scenario Taxonomy

This document defines the five scenario types used in scenario analysis, providing a unified classification standard.

---

## Scenario Type Definitions

### 业务场景 (Business Scenario)

**Definition:** Scenarios that directly support core business processes, involving the system's primary purpose and value delivery. A business scenario typically corresponds to a user completing a meaningful business goal (e.g., placing an order, approving a request, querying a report).

**Example:** 用户提交采购申请 — 采购员填写采购需求、选择供应商并提交审批，系统记录申请并通知审批人。

---

### 操作场景 (Operational Scenario)

**Definition:** Scenarios for routine interactions users perform while using the system — typically frequent, repetitive actions (e.g., search, filter, export, set preferences). Operational scenarios support the completion of business scenarios but do not directly produce business value on their own.

**Example:** 用户搜索历史订单 — 用户在订单列表页输入关键词或日期范围进行筛选，系统返回匹配结果。

---

### 维护场景 (Maintenance Scenario)

**Definition:** Scenarios in which system administrators or operations staff configure, manage, monitor, and maintain the system. Maintenance scenarios ensure the system runs correctly and are not directly oriented toward end users' business goals.

**Example:** 管理员配置用户权限 — 系统管理员为新员工分配角色和功能访问权限，调整后立即生效。

---

### 制造场景 (Manufacturing Scenario)

**Definition:** Scenarios in which the system generates, creates, or batch-processes content or data. The core of a manufacturing scenario is the system acting as a producer of output artifacts (e.g., generating reports, bulk-importing data, auto-generating configuration files, AI-generated content).

**Example:** 系统自动生成月度财务报告 — 系统在每月末汇总交易数据，按预设模板生成财务报告文件，并发送给指定收件人。

---

### 其他场景 (Other Scenario)

**Definition:** Scenarios that do not fit neatly into the four types above. Typically includes cross-type composite scenarios, edge interaction scenarios, or scenarios whose classification has not yet been determined. These should be refined in subsequent analysis.

**Example:** 用户反馈问题 — 用户通过内置反馈入口描述遇到的问题并提交，系统记录反馈并（可选）通知支持团队。

---

## Classification Methodology

### Quick Classification Guide

Use the following questions to determine scenario type:

1. **Does this scenario directly complete a core business goal?**
   - Yes → **业务场景**

2. **Is this scenario a supporting action during system use (search, filter, export, etc.)?**
   - Yes → **操作场景**

3. **Is the primary participant an administrator or operations person, with the goal of keeping the system running?**
   - Yes → **维护场景**

4. **Is the core of this scenario the system generating or batch-processing some output artifact?**
   - Yes → **制造场景**

5. **None of the above apply?**
   - Classify as **其他场景** with a brief note

### Classification Priority

When a scenario could span multiple types, apply this priority order:

```
业务场景 > 制造场景 > 操作场景 > 维护场景 > 其他场景
```

**Principle:** Choose the type that best reflects the scenario's core value. If a scenario has both a business goal and content generation, prefer 业务场景.

### Common Misclassification Examples

| Scenario Description | Wrong Classification | Correct Classification | Reason |
|----------------------|---------------------|----------------------|--------|
| 用户登录系统 | 业务场景 | 操作场景 | Login is a supporting action, not a core business goal |
| 管理员查看系统日志 | 业务场景 | 维护场景 | Primary participant is admin; purpose is system monitoring |
| 系统定时清理过期数据 | 操作场景 | 维护场景 | Executed automatically by the system for data health |
| AI 根据模板生成合同 | 业务场景 | 制造场景 | Core activity is the system producing an output artifact (contract) |

---

## Reference

This taxonomy applies to the scenario analysis phase of the hyper-designer workflow. Classification results influence scenario prioritization in downstream use-case analysis and the scoping of feature elaboration.
