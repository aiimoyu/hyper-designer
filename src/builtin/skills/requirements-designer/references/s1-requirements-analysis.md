---
metadata:
  pattern: pipeline
  stages: 2
  sub_patterns: [inversion, generator]
---

# S1 Requirements Analysis

Transform raw inputs (GitHub Issues, product requirements, verbal descriptions, etc.) into a structured requirements specification.
Use the **Inversion pattern** to progressively confirm requirements, then the **Generator pattern** to produce the document.

## Core Principles

| Principle | Practice | Anti-pattern |
|-----------|----------|--------------|
| **Stay Curious** | Ask naturally emerging questions | ❌ Interrogate from a checklist |
| **Open Threads** | Present multiple exploration directions; let the user choose | ❌ Force a single Q&A path |
| **Adapt Flexibly** | Adjust direction immediately when new information appears | ❌ Cling to a preset framework |
| **Be Patient** | Let the problem contour emerge naturally | ❌ Jump to conclusions prematurely |
| **Ground in Reality** | Explore deeply into the codebase and existing materials | ❌ Pure theoretical reasoning |

## Stage Objectives

Complete the following six identification and confirmation items, then generate the document:

1. Business context & problem definition
2. Stakeholder identification & role analysis
3. Functional requirements
4. Non-functional requirements
5. Constraints & assumptions
6. Requirements prioritization

**This stage has 2 process nodes. Follow the [Proc] sequence below strictly — no skipping.**

---

## [Proc1] Requirements Elicitation (Inversion Pattern)

> **Iron Rule**: **Do NOT generate any document** until requirements are fully understood.

### 1.1 Initial Understanding

After receiving user input, first provide a concise, natural-language summary of your current understanding state in the following format:

> "我目前理解的是：___；暂时还不够明确的是：___。"

At this stage, proceed with clarification in a natural conversational manner — **do not rush into structured organization or solution output**.

Based on the ambiguities that currently exist, issue a **single batch** of confirmation questions to the user, including at least the following two types:

- **Q1: Understanding Confirmation**
  "我目前的理解是：___，这样理解是否正确？"

- **Q2: Ambiguity Clarification**
  "目前还不够明确的是：___。对此我有以下几种理解，请你确认更接近哪一种：___。"

### 1.2 Identify Business Context & Stakeholders

**Business Context**:
- The specific challenges or pain points currently faced
- Business value and success criteria for the project

**Stakeholders**:
- Key roles (users, customers, development team, operations team, etc.)
- Core usage scenarios for each role

After completing the analysis, issue the following confirmation question to the user **in a single batch**:

> **Q1**："我识别到的业务背景为 ___，涉及干系人包括 ___，是否有遗漏或偏差？"

### 1.3 Scenario & Requirements Refinement

**Scenario Mapping**:
- Primary success scenarios (Happy Path)
- Key failure / exception scenarios

**Supporting Capability Derivation**: Derive which supporting capabilities the system must possess through scenario walkthrough. Identify any capability the user may not have considered but is required for the system to function.

**Functional Requirements**: Features and services the system needs to implement

**Non-functional Requirements**: Performance, scalability, security, usability, etc.

After completing the analysis, issue the following three confirmation questions to the user **in a single batch**:

> **Q1**："我识别到的核心场景为：[谁 → 在什么情况下 → 做了什么 → 系统如何响应 → 最终结果]，是否准确？"
>
> **Q2**："主要功能需求为 ___，是否有遗漏？"
>
> **Q3**："非功能性需求为 ___，优先级是否合理？"

### 1.4 Constraints & Assumptions

- **Technical Constraints**: Tech stack, platform, language, compatibility requirements
- **Security & Compliance**: Data privacy, regulatory compliance, permission requirements
- **Resource Constraints**: Time, staffing, budget limitations
- **Assumptions**: Implicit assumptions made during the analysis

After completing the analysis, issue the following two confirmation questions to the user **in a single batch**:

> **Q1**："识别到的技术约束为 ___，是否有补充？"
>
> **Q2**："分析过程中的假设为 ___，是否成立？"

### 1.5 Inversion Completion Criteria

All of the following conditions must be met before proceeding to the document generation stage:

- [ ] User has confirmed all questions from 1.3 – 1.5
- [ ] No unresolved ambiguities or conflicts remain
- [ ] Requirements boundaries (what to do / what NOT to do) are clearly defined

---

## [Proc2] Document Generation (Generator Pattern)

### 2.1 Generation Workflow

1. Must load the document template `assets/requirements-analysis-template.md`
2. If any unconfirmed items or conflicts remain, **ask the user first; complete confirmation before generating**
3. Populate the template structure with content; generate the document to the designated location
4. Execute the quality self-check
5. Output a document summary for the user to review quickly

### 2.2 Quality Self-Check Checklist

**Requirements Clarification**:

- [ ] User requirements have been fully understood
- [ ] Requirements have been deeply explored; confirmed no omitted or ambiguous capability

**Business Context & Stakeholders**:

- [ ] Business value description is specific and traceable to the business root cause (not vague statements)
- [ ] Requirements description defines clear boundaries — states both "what to do" and "what NOT to do"

**Functional Requirements**:

- [ ] Functional requirements fully cover major business scenarios
- [ ] Feature descriptions include core behaviors and user value
- [ ] Business rules and constraints are explicit (validation logic, state transitions, preconditions, etc.)

**Non-functional Requirements**:

- [ ] Non-functional requirements include quantifiable acceptance criteria
- [ ] Key quality attributes such as availability and reliability are covered

**Scenarios & Acceptance**:

- [ ] Primary success scenarios are fully described (role → trigger → action → response → outcome)
- [ ] Supporting capabilities the user may not have considered have been derived

**Constraints & Assumptions**:

- [ ] Technical constraints are explicit (tech stack, platform, compatibility, etc.)
- [ ] Compliance and security requirements are listed with verification methods noted
- [ ] Assumptions made during analysis are recorded and confirmed