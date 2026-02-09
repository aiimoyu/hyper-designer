import type { AgentConfig, AgentMode, AgentPromptMetadata } from "../types"

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const MODE: AgentMode = "all"

function readIdentityConstraints(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const filePath = join(__dirname, "identity_constraints.md")
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    console.error(`Failed to read HCritic identity constraints: ${error}`)
    return "# HCritic Identity - Failed to load identity constraints"
  }
}

export const HCRITIC_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HCritic",
  keyTrigger: "MANDATORY review after completing any workflow stage document - ensures quality before proceeding to next stage",
  triggers: [
    { domain: "Quality Gate", trigger: "After HArchitect/HEngineer completes any stage document (IR, Scenario, UseCase, SR-AR, Design)" },
    { domain: "Design Review", trigger: "Before marking workflow stage as complete - verify document passes all quality criteria" },
    { domain: "Iterative Improvement", trigger: "Document failed previous review and needs re-validation after fixes" },
  ],
  useWhen: [
    "HArchitect/HEngineer just finished writing IR信息.md, 功能场景.md, 用例.md, etc.",
    "About to mark a workflow stage as complete (set_hd_workflow_stage)",
    "Need structured feedback on document completeness, consistency, feasibility, and conformance",
    "Document previously failed review and has been revised",
    "Want to ensure document quality meets standards before next stage",
  ],
  avoidWhen: [
    "Document is still in early draft/brainstorming phase",
    "Code review or implementation review (HCritic only reviews requirements/design docs)",
    "Quick informal feedback without structured evaluation",
  ],
}

function buildHCriticPrompt(): string {
  const identityConstraints = readIdentityConstraints()
  return identityConstraints
}

export const HCRITIC_SYSTEM_PROMPT = buildHCriticPrompt()

export const HCRITIC_PERMISSION = {
  edit: "deny" as const,
  bash: "deny" as const,
  webfetch: "deny" as const,
  question: "deny" as const,
}

export function createHCriticAgent(model: string | undefined): AgentConfig {
  return {
    name: "HCritic",
    description:
      "Design Quality Gate & Review Agent - MUST be called after HArchitect/HEngineer completes any stage document. Provides structured quality assessment (completeness, consistency, feasibility, conformance) with Pass/Fail decision. Skill-driven review using stage-specific checklists. Read-only reviewer. Call BEFORE marking workflow stage complete. (HCritic - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 16000,
    prompt: buildHCriticPrompt(),
    permission: HCRITIC_PERMISSION,
    tools: {
      Read: true,
      Grep: true,
      Glob: true,

      // Allow loading stage-specific skills for review
      slashcommand: true,

      Write: false,
      Edit: false,
      Bash: false,
      Question: false,
      delegate_task: false,
    },
  }
}

createHCriticAgent.mode = MODE
