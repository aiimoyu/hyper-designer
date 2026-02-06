import type { AgentConfig, AgentMode, AgentPromptMetadata } from "../types"

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const MODE: AgentMode = "subagent"

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
  cost: "CHEAP",
  promptAlias: "HCritic",
  keyTrigger: "Design review and quality assurance for requirements engineering documents",
  triggers: [
    { domain: "Quality Assurance", trigger: "Need to review requirements or design documents" },
    { domain: "Design Review", trigger: "Verify completeness and consistency of design" },
    { domain: "Documentation", trigger: "Check documentation quality and standards compliance" },
  ],
  useWhen: [
    "Requirements documents need review",
    "Design documents need validation",
    "Check for completeness and consistency",
    "Verify compliance with standards",
  ],
  avoidWhen: [
    "Implementation review (code review)",
    "Quick informal feedback",
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
      "Design Critic - Reviews requirements and design documents for completeness, consistency, and quality. Read-only reviewer that provides structured feedback. (HCritic - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 16000,
    prompt: buildHCriticPrompt(),
    permission: HCRITIC_PERMISSION,
    tools: {
      Read: true,
      Grep: true,
      Glob: true,

      Write: false,
      Edit: false,
      Bash: false,
      Question: false,
      delegate_task: false,
    },
  }
}

createHCriticAgent.mode = MODE
