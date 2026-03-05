/**
 * HEngineer 代理模块
 * 
 * 系统工程师和技术设计专家，负责：
 * 1. 系统级设计：系统需求分解（SR-AR）和系统功能设计（架构、技术栈、数据模型）
 * 2. 模块级设计：详细类设计、算法、实现规范
 * 3. 在 HArchitect 完成功能细化后接管工作
 * 4. 完成每个设计阶段后必须调用 @HCritic 进行质量门评审
 */

import type { AgentPromptMetadata } from "../types"
import type { AgentDefinition } from "../factory"
import { filePrompt, stringPrompt } from "../factory"
import { createAgent } from "../factory"
import { join } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type HEngineerPhase = "interview" | "design" | "full"

export const HENGINEER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HEngineer",
  keyTrigger: "System and module detailed design - takes over after HArchitect completes functional refinement. MUST call @HCritic after completing each design stage.",
  triggers: [
    { domain: "System Design", trigger: "Need system requirement decomposition (SR-AR) and system functional design (architecture, tech stack, data models)" },
    { domain: "Module Design", trigger: "Need module functional design (detailed class design, algorithms, implementation specs)" },
    { domain: "Technical Specification", trigger: "Require implementable technical design documents ready for coding" },
  ],
  useWhen: [
    "HArchitect has completed functional refinement and handed over to HEngineer",
    "Need to decompose system requirements into module-level SRs and implementation-level ARs",
    "Require system architecture design with technology stack selection and data models",
    "Need detailed module specifications with class design, algorithms, and implementation guidance",
    "Working on design phases after requirements analysis is complete",
  ],
  avoidWhen: [
    "Requirements analysis phase (IR, Scenario, UseCase, Functional Refinement - use @HArchitect instead)",
    "Simple feature implementation without formal design process",
    "Upstream requirements not yet complete or approved",
  ],
}

const DEFINITION: AgentDefinition = {
  name: "HEngineer",
  description:
    "System Engineer & Technical Design Specialist - Executes system-level design (SR-AR decomposition + system functional design: architecture, tech stack, data models) and module-level design (detailed class design, algorithms, implementation specs). Takes over from @HArchitect after functional refinement. After completing each stage document, MUST call @HCritic for quality gate review. (HEngineer - OhMyOpenCode)",
  mode: "primary",
  color: "#31B5C6",
  defaultTemperature: 0.4,
  promptGenerators: [
    filePrompt(join(__dirname, "prompts", "identity.md")),
    stringPrompt("{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}"),
    filePrompt(join(__dirname, "prompts", "step.md")),
    filePrompt(join(__dirname, "prompts", "file.md")),
    filePrompt(join(__dirname, "prompts", "interview.md")),
    filePrompt(join(__dirname, "prompts", "constraints.md")),
    stringPrompt("{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}"),
  ],
  defaultPermission: {
    bash: "deny",
    edit: "allow",
    skill: "allow",
    todoread: "allow",
    webfetch: "deny",
    websearch: "deny",
    question: "allow",
    task: "allow",
    external_directory: "allow",
  },
  defaultTools: {
    bash: false,
    edit: true,
    write: true,
    read: true,
    grep: true,
    glob: true,
    list: true,
    patch: true,
    skill: true,
    todowrite: true,
    todoread: true,
    webfetch: false,
    websearch: false,
    question: true,
    task: true,
    hd_workflow_state: true,
    hd_handover: true,
    hd_submit_evaluation: false,
  },
}

export function createHEngineerAgent(model?: string) {
  return createAgent(DEFINITION, model)
}

createHEngineerAgent.mode = DEFINITION.mode
