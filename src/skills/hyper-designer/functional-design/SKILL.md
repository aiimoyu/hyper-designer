---
name: functional-design
description: System and module functional design for requirements engineering. Use when workflow state is `systemFunctionalDesign` or `moduleFunctionalDesign`, or when detailed architecture design, technology selection, component design, or API specification is needed. Supports both system-level (architecture, tech stack, data models) and module-level (class design, design patterns, detailed logic) design tasks.
---

# Functional Design Skill

Design system architectures and module implementations based on decomposed requirements. This skill supports both system-level and module-level design with progressive detail.

## Usage

**System-level design**: Generate overall architecture, tech stack selection, data models, and interface specifications.

**Module-level design**: Generate detailed class designs, design patterns, algorithms, and implementation specifications.

## Quick Start

### System Design
For system-level architecture and tech stack design, see [references/system-design.md](references/system-design.md).

### Module Design
For module implementation and detailed component design, see [references/module-design.md](references/module-design.md).

## Inputs

All design tasks require:
- **SR-AR分解分配表** (System/Activity Requirements Decomposition): Located in `.hyper-designer/systemRequirementDecomposition/` or `.hyper-designer/activityRequirementDecomposition/`
- **项目代码**: Context files in the project
- **参考项目代码**: Reference implementations (if available)
- **功能库**: Reusable component library (if available)
- **功能列表文档** (Functional List with SR Mapping and NFR/DFX Summary): Located in `.hyper-designer/functionalList/`. Contains SR mapping table (功能编号 → SR 编号) and consolidated NFR/DFX summary from IR constraints, scenarios, and use cases.

## Outputs

**System design**: `XX功能系统设计说明书.md` in `.hyper-designer/systemFunctionalDesign/`

**Module design**: `XXX模块功能设计说明书.md` in `.hyper-designer/moduleFunctionalDesign/{模块名}/`

## Design Principles

### Evidence-Based Selection
Every architecture decision and technology choice must be justified with:
- Decision drivers (requirements, constraints, NFRs)
- Alternative options considered
- Trade-off analysis (cost, complexity, maintainability, performance)
- Risk assessment

### SOLID + Design Patterns
Module designs must follow SOLID principles:
- **Single Responsibility**: Clear, focused module purpose
- **Open/Closed**: Extensible via interfaces
- **Liskov Substitution**: Interchangeable implementations
- **Interface Segregation**: Narrow, focused interfaces
- **Dependency Inversion**: Depend on abstractions

Apply design patterns appropriately (Strategy, Factory, Observer, Adapter, etc.) and explain why each pattern solves a specific coupling or extensibility problem.

### Progressive Architecture
Start simple, design for evolution:
- Avoid premature optimization
- Build extensibility points
- Document upgrade paths
- Map NFRs to architecture decisions

## Quality Checklist

Before finalizing any design document, verify:

**System design**:
- [ ] Architecture diagram covers all modules and external dependencies
- [ ] Tech stack choices have trade-off records
- [ ] Key data models defined with consistency strategies
- [ ] Interface protocols and auth strategies specified
- [ ] NFRs mapped to implementation strategies
- [ ] Deployment and CI/CD process documented
- [ ] Test strategy covers integration, performance, fault tolerance
- [ ] Risk/trade-off records preserved
- [ ] §0 概要: 系统背景、目标、范围、文档结构
- [ ] §1 设计目标与约束: 功能目标、非功能目标、约束条件（技术/业务/资源）、关键假设
- [ ] §2 总体架构: 架构风格、分层设计、关键模块职责、模块间交互关系
- [ ] §3 技术栈与选型理由: 技术栈列表、选型决策记录（含权衡分析）、风险评估
- [ ] §4 模块设计概要: 模块职责、核心类设计、关键算法设计
- [ ] §5 数据模型: 核心实体、关系图、一致性策略、索引策略
- [ ] §6 交互协议: API 设计、认证授权、错误处理、版本管理
- [ ] §7 非功能实现策略: 性能（缓存、并发）、安全（认证、加密）、可靠性（容错、降级）、可观测性
- [ ] §8 部署与运维: 部署架构、CI/CD 流程、监控告警、故障恢复
- [ ] §9 风险与权衡: 架构权衡记录、技术风险评估、迁移路径
- [ ] §10 测试策略: 单元测试、集成测试、性能测试、故障注入测试
- [ ] §11 参考资料与附录: 参考文献、术语表、变更历史

**Module design**:
- [ ] Module responsibilities clear and non-overlapping
- [ ] Interface specs include error semantics, SLA, and examples
- [ ] Internal component boundaries and responsibilities clear
- [ ] Key algorithms have pseudo-code or flowcharts
- [ ] Data models include fields, indexes, consistency notes
- [ ] Unit/integration/performance test cases cover key scenarios
- [ ] Deployment config and operational checks documented
- [ ] §0 概要: 模块背景、目标、范围、文档结构
- [ ] §1 目标与职责: 功能目标、非功能目标、职责边界、与其他模块关系
- [ ] §2 接口规范: 公共接口定义、输入输出、错误语义、SLA、调用示例
- [ ] §3 内部架构与组件: 组件职责、协作流程、状态管理、关键类设计
- [ ] §4 数据结构与存储: 数据结构定义、存储方案、索引策略、一致性保证
- [ ] §5 非功能要求实现: 性能优化、安全措施、容错机制、可观测性
- [ ] §6 测试与验证: 单元测试、集成测试、性能测试、测试覆盖率
- [ ] §7 部署与运维注意事项: 部署配置、健康检查、监控指标、故障排查
- [ ] §8 开发注意与最佳实践: 代码规范、性能建议、安全建议、常见陷阱
- [ ] §9 附录: 参考资料、术语表、变更历史

## Common Pitfalls

| Pitfall | Recognition Signal | Strategy |
|---------|-------------------|----------|
| Premature optimization | Complex architecture for unproven load | Use evolvable design, implement simple solution with extension points |
| Preference-driven selection | Team preference drives tech choices | Require trade-off tables with evidence (benchmarks, community support) |
| Ignoring operations | Post-deployment observability/recovery issues | Define observability and drill strategies during design |
| Over-coupling | Module frequently calls other module internals | Introduce clearer interfaces, use events/messages for decoupling |
| Missing edge cases | No handling for concurrency or null cases | List boundary conditions, cover in unit tests |
| No fallback mechanism | Third-party failure causes chain unavailability | Implement circuit breakers, retries, and degradation paths |

## Workflow Integration

**When to use this skill**:
- Workflow state is `systemFunctionalDesign` → Use system design
- Workflow state is `moduleFunctionalDesign` → Use module design
- System requirements decomposition completed → Ready for system design
- System functional design completed → Ready for module design

**Document locations**:
- System design drafts: `.hyper-designer/systemFunctionalDesign/draft.md`
- Module design drafts: `.hyper-designer/moduleFunctionalDesign/{模块名}/draft.md`

**Pre-requisites**:
- System design requires: Functional list document with SR mapping table and NFR/DFX summary (from functionalRefinement)
- Module design requires: System functional design document

**Next steps**:
- After system design: Submit to HCritic review, then proceed to activity requirement decomposition
- After module design: Submit to HCritic review, then proceed to implementation
