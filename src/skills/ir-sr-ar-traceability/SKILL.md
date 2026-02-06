---
name: ir-sr-ar-traceability
description: IR-SR-AR bidirectional traceability analysis for requirements engineering. Use when reviewing requirement decomposition quality in HyperDesigner workflow, particularly during functionalRefinement stage review. Validates consistency from IR→SR→AR (upward trace) and AR feasibility against codebase (downward validation). Detects over-design, missing implementations, and code conflicts. Essential for HCritic agent when auditing SR-AR decomposition outputs.
---

# IR-SR-AR Bidirectional Traceability Analysis

## Overview

This skill performs **R-Reflection** (反馈环) analysis in the HyperDesigner methodology, acting as an **Architecture Auditor** to ensure requirement traceability and implementation feasibility.

**Role**: You are a senior system architecture auditor responsible for validating the integrity of requirement decomposition.

## Core Responsibilities

### 1. Upward Traceability (向上追溯) - Consistency Check
Ensure every design decision traces back to original requirements:
- Verify SR coverage of IRs
- Verify AR coverage of SRs
- Detect over-design: ARs without SR justification
- Detect gaps: SRs without corresponding ARs

### 2. Downward Validation (向下验证) - Feasibility Check (Optional)
Validate ARs against actual codebase:
- Check naming conflicts with existing code
- Verify dependency availability (APIs, libraries, database operations)
- Identify reusable code for AR implementation
- Flag infeasible AR specifications

## Input Artifacts

**Required**:
1. **IR Information**: `ir信息.md` - Initial requirements with 5W2H structure
2. **SR-AR Decomposition**: `SR-AR分解分配表.md` - System and allocated requirements
3. **Code Context** (optional): LSP analysis results or codebase exploration

**How to load**:
```typescript
// Read requirement artifacts
Read("ir信息.md")
Read("SR-AR分解分配表.md")

// Optional: Gather code context
delegate_task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  prompt="Analyze codebase structure: list all exported APIs, class definitions, database schemas, and external library dependencies"
)
```

## Analysis Workflow

### Phase 1: Upward Traceability Analysis

**Step 1: Parse Input Documents**

Extract structured information:
- **From IR**: List all IR requirements with their 5W2H components
- **From SR-AR**: Extract all SRs and their mapped ARs

**Step 2: Build Traceability Matrix**

Create mapping relationships:

```markdown
IR-001 → SR-001, SR-002
IR-002 → SR-003
SR-001 → AR-001-01, AR-001-02
SR-002 → AR-002-01
SR-003 → (no ARs) ⚠️
SR-004 → AR-004-01 (but SR-004 has no IR) ⚠️
```

**Step 3: Identify Issues**

| Issue Type | Detection Logic | Severity |
|------------|----------------|----------|
| **Orphaned SR** | SR exists but no matching IR | High - Possible over-design |
| **Orphaned AR** | AR exists but no matching SR | High - Over-design |
| **Missing AR** | SR exists but no ARs allocated | High - Implementation gap |
| **Missing SR** | IR exists but no SRs created | High - Analysis gap |
| **Weak mapping** | Vague "Why" in SR 5W2H | Medium - Traceability unclear |

### Phase 2: Downward Validation (Optional)

**Step 1: Extract AR Technical Specifications**

For each AR, identify:
- Proposed interface names (classes, functions, APIs)
- Required dependencies (libraries, external services)
- Data model changes (database schemas, DTOs)

**Step 2: Query Codebase Context**

If LSP analysis results available:
```typescript
// Use LSP to check for conflicts
lsp_symbols(filePath="target/module.ts", scope="workspace", query="ProposedClassName")

// Search for existing implementations
grep(pattern="function proposedFunctionName", include="*.ts")
```

If no LSP, use explore agent:
```typescript
delegate_task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  prompt="Find: 1) All exported class/function names matching AR-001-01 proposed interfaces, 2) Existing implementations that could support AR-001-01 scenarios"
)
```

**Step 3: Validate Feasibility**

For each AR, classify:

| Status | Criteria | Action |
|--------|----------|--------|
| **✅ Feasible** | No conflicts, dependencies available | Proceed |
| **⚠️ Needs Modification** | Naming conflict or partial dependency missing | Provide alternatives |
| **❌ Already Exists** | Exact implementation found | Reference existing code |
| **❌ Infeasible** | Critical dependency unavailable | Flag for architecture revision |

**Step 4: Identify Reuse Opportunities**

Suggest existing code that can be reused or extended:
```markdown
AR-001-01 can reuse:
- `src/auth/TokenValidator.ts` - Extend with new validation logic
- `src/middleware/authMiddleware.ts` - Add JWT support here
```

## Output Format

Generate a structured traceability report:

```markdown
# IR-SR-AR 追溯性分析报告

**Project**: [项目名称]
**Analysis Date**: [日期]
**Analyzed Files**:
- IR: ir信息.md
- SR-AR: SR-AR分解分配表.md
- Code Context: [LSP分析结果 / 代码库探索结果]

---

## 一致性评分 (Consistency Score)

**总分: X / 100**

- IR-SR 追溯完整性: X / 40
- SR-AR 追溯完整性: X / 40
- 描述质量 (5W2H): X / 20

---

## 追溯性矩阵 (Traceability Matrix)

### IR → SR Mapping

| IR ID | IR Summary | Mapped SRs | Status |
|-------|-----------|------------|--------|
| IR-001 | [一句话总结] | SR-001, SR-002 | ✅ |
| IR-002 | [一句话总结] | (none) | ❌ 缺少SR分解 |

### SR → AR Mapping

| SR ID | SR Name | Mapped ARs | IR Source | Status |
|-------|---------|------------|-----------|--------|
| SR-001 | [SR名称] | AR-001-01, AR-001-02 | IR-001 | ✅ |
| SR-003 | [SR名称] | (none) | IR-002 | ❌ 无AR实现 |
| SR-004 | [SR名称] | AR-004-01 | (none) | ⚠️ 无IR支撑 |

---

## 一致性问题警示 (Consistency Warnings)

### 高优先级 - 过度设计 (Over-Design)

**SR-004: [SR名称]**
- **问题**: 该SR无法追溯到任何IR需求
- **影响**: 可能是需求范围蔓延或误解客户需求
- **建议**: 
  1. 确认是否为隐含需求,若是则补充IR
  2. 若非必需,考虑移除该SR及其ARs

**AR-002-03: [AR名称]**
- **问题**: 该AR在SR-002中未体现,且无明确场景支撑
- **影响**: 增加开发成本但无明确价值
- **建议**: 移除或合并到相关AR

### 高优先级 - 实现缺失 (Missing Implementation)

**SR-003: [SR名称]**
- **问题**: 该SR已定义但未分配任何AR
- **影响**: 设计阶段遗漏,将导致开发阶段才发现需求缺失
- **建议**: 立即补充AR分解,或确认该SR已通过其他方式实现

**IR-002: [IR一句话总结]**
- **问题**: 该IR未被任何SR覆盖
- **影响**: 客户需求未被系统分析,可能导致交付不满足预期
- **建议**: 补充SR分析,或确认该IR已合并到其他IR

### 中优先级 - 描述质量问题

**SR-005: [SR名称]**
- **问题**: 5W2H中的"Why"字段为"需求要求",未明确指向具体IR
- **影响**: 追溯性弱,难以验证需求合理性
- **建议**: 明确标注"基于IR-003的用户登录需求"

---

## 落地可行性分析 (Feasibility Analysis) [可选]

### AR Feasibility Summary

| AR ID | AR Name | Code Feasibility | Details |
|-------|---------|------------------|---------|
| AR-001-01 | 用户登录接口 | ⚠️ 需修改 | 接口名`/login`已存在于`auth.controller.ts` |
| AR-001-02 | Token验证中间件 | ✅ 可复用 | 可扩展现有`authMiddleware.ts` |
| AR-002-01 | 数据加密存储 | ❌ 依赖缺失 | 需要的`crypto-lib`未安装 |
| AR-003-01 | 用户权限管理 | ✅ 已存在 | 完全实现于`rbac.service.ts` |

### Detailed Validation

#### AR-001-01: 用户登录接口
**Status**: ⚠️ 需修改
- **命名冲突**: 
  - 现有接口: `POST /api/v1/login` (src/auth/auth.controller.ts:42)
  - AR定义: `POST /v1/auth/login`
  - 建议: 使用AR定义的路径以避免冲突
  
- **依赖可行性**: ✅
  - JWT库: `jsonwebtoken` 已安装
  - 数据库: PostgreSQL连接已配置
  
- **复用建议**:
  - 可复用 `src/auth/UserService.validateCredentials()` 进行凭证验证
  - 可复用 `src/utils/TokenGenerator.ts` 生成JWT token

#### AR-002-01: 数据加密存储
**Status**: ❌ 依赖缺失
- **依赖可行性**: ❌
  - AR要求: `crypto-lib` 用于AES-256加密
  - 现状: 该库未在package.json中
  - 建议: 
    1. 添加依赖 `npm install crypto-lib`
    2. 或使用Node.js内置`crypto`模块替代

#### AR-003-01: 用户权限管理
**Status**: ✅ 已存在
- **现有实现**: `src/rbac/rbac.service.ts` 完整实现了基于角色的权限控制
- **建议**: 直接引用现有实现,无需重复开发
- **文档位置**: docs/architecture/rbac-design.md

---

## 修正建议 (Correction Recommendations)

### 建议1: 补充缺失的SR
**优先级**: 🔴 高

针对 IR-002,需补充以下SR:
```markdown
## SR-005: 数据安全管理模块

### SR描述 (5W2H)
- **Who**: 数据安全子系统
- **When**: 用户数据存储和传输时
- **What**: 确保敏感数据的加密存储和安全传输
- **Where**: 数据层和传输层
- **Why**: 基于IR-002的数据安全合规要求
- **How Much**: 覆盖所有敏感字段(密码、个人信息、支付数据)
- **How**: 通过AES-256加密存储,TLS加密传输

### 分配的AR列表
- AR-005-01: 实现数据加密存储服务
- AR-005-02: 实现数据传输加密
```

### 建议2: 移除过度设计的AR
**优先级**: 🟡 中

AR-002-03 "实时数据同步" 无明确SR支撑且无业务场景,建议:
- 若确实需要,追加到SR-002并补充场景说明
- 若非必需,直接移除以降低复杂度

### 建议3: 修正AR命名冲突
**优先级**: 🟡 中

AR-001-01的接口路径与现有代码冲突,建议采用以下方案之一:
1. 使用AR定义的路径 `/v1/auth/login` (推荐)
2. 或重构现有接口到新路径以保持一致性

---

## 总体评估 (Overall Assessment)

**一致性状况**: [良好 / 需改进 / 严重问题]

**主要发现**:
1. [总结关键问题1]
2. [总结关键问题2]
3. [总结关键问题3]

**后续行动**:
- [ ] 补充缺失的SR/AR
- [ ] 移除无根据的过度设计
- [ ] 解决命名冲突
- [ ] 添加缺失的依赖库
- [ ] 更新追溯矩阵

**建议**: [是否通过审查 / 需返工修正]
```

## Scoring Methodology

### Consistency Score Calculation (100 points)

**IR-SR Traceability (40 points)**:
- Perfect mapping (all IRs have SRs, no orphaned SRs): 40
- Each missing SR for IR: -8
- Each orphaned SR (no IR source): -5

**SR-AR Traceability (40 points)**:
- Perfect mapping (all SRs have ARs, no orphaned ARs): 40
- Each missing AR for SR: -8
- Each orphaned AR (no SR source): -5

**Description Quality (20 points)**:
- All SRs have complete 5W2H: 20
- Each SR with weak/missing "Why" field: -3
- Each SR with incomplete 5W2H: -5

**Formula**:
```
Score = min(100, 
            IR_SR_score + 
            SR_AR_score + 
            Description_score)
```

**Thresholds**:
- **90-100**: Excellent - Minor polish only
- **70-89**: Good - Some gaps to address
- **50-69**: Needs Improvement - Significant rework required
- **<50**: Critical Issues - Major revision needed

## Integration with HCritic

This skill is designed for use by the **HCritic agent** during `functionalRefinement` stage review.

**Typical invocation**:
```typescript
// HCritic uses this skill when reviewing SR-AR decomposition
delegate_task(
  category="unspecified-high",
  load_skills=["ir-sr-ar-traceability"],
  description="Validate SR-AR decomposition traceability",
  prompt=`
  Review the SR-AR decomposition quality:
  
  Input files:
  - IR: ir信息.md
  - SR-AR: SR-AR分解分配表.md
  
  Perform full IR-SR-AR traceability analysis:
  1. Check consistency (IR→SR→AR)
  2. Identify over-design and gaps
  3. Generate traceability report with scoring
  
  Output the structured traceability report.
  `,
  run_in_background=false
)
```

## Quality Checklist

Before finalizing traceability report:

- [ ] All IRs mapped to SRs (or justified why not)
- [ ] All SRs mapped to ARs (or justified why not)
- [ ] No orphaned SRs or ARs without parent requirements
- [ ] Consistency score calculated correctly
- [ ] Specific file/line references for code conflicts (if feasibility check performed)
- [ ] Actionable correction recommendations provided
- [ ] Clear pass/fail recommendation given

## Anti-Patterns to Avoid

**Don't**:
- Accept vague "Why" fields like "需求要求" without specific IR reference
- Ignore ARs that seem disconnected from SRs
- Skip feasibility analysis just because code context is incomplete
- Give passing score without checking all traceability links
- Suggest design solutions (that's not your role - only audit)

**Do**:
- Insist on explicit IR references in SR "Why" field
- Flag every orphaned requirement as potential over-design
- Use best-effort code analysis even without full LSP data
- Provide concrete examples of missing mappings
- Focus on traceability quality, not design quality

## Success Criteria

A successful traceability analysis:
- ✅ Identifies all missing requirement links
- ✅ Flags all over-design candidates with clear reasoning
- ✅ Provides quantitative scoring (0-100)
- ✅ Gives specific correction recommendations
- ✅ Validates code feasibility where possible
- ✅ Outputs structured report usable by HCritic
