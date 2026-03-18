import type { AgentPromptMetadata } from "../../../../agents/types"
import type { AgentDefinition } from "../../../../agents/factory"
import { filePrompt, stringPrompt } from "../../../../agents/factory"
import { createAgent } from "../../../../agents/factory"
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
    "System Engineer & Technical Design Specialist - Executes system-level design (SR-AR decomposition + system functional design: architecture, tech stack, data models) and module-level design (detailed class design, algorithms, implementation specs). Takes over from @HArchitect after functional refinement. After completing each stage document, MUST call @HCritic for quality gate review.",
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
    hd_workflow_list: 'deny',
    hd_workflow_select: 'deny',
    hd_workflow_state: "allow",
    hd_handover: "allow",
    hd_force_next_step: "ask",
    hd_record_milestone: "deny",
    call_omo_agent: "deny",
  },
}

export function createHEngineerAgent(model?: string) {
  return createAgent(DEFINITION, model)
}

createHEngineerAgent.mode = DEFINITION.mode
