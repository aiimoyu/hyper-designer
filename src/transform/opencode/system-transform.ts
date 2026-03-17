import { workflowService } from '../../workflows/core/service'
import { getBlockedSkillsFromConfig, transformSystemMessages } from '../systemTransformer'
import { HyperDesignerLogger } from '../../utils/logger'

const SKILL_BLOCK_PATTERN = /<skill>[\s\S]*?<\/skill>/g
const SKILL_NAME_PATTERN = /<name>([\s\S]*?)<\/name>/
const USING_HYPER_DESIGNER_PATTERN = /<using-hyper-designer>/

function stripBlockedSkills(text: string, blockedSkills: Set<string>): string {
  if (blockedSkills.size === 0) {
    return text
  }

  return text.replace(SKILL_BLOCK_PATTERN, match => {
    const nameMatch = match.match(SKILL_NAME_PATTERN)
    const skillName = nameMatch?.[1]?.trim() ?? ''
    if (blockedSkills.has(skillName)) {
      return ''
    }
    return match
  })
}

function filterBlockedSkills(systemMessages: string[], blockedSkills: Set<string>): void {
  if (blockedSkills.size === 0) {
    return
  }

  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = stripBlockedSkills(systemMessages[index], blockedSkills)
  }
}

function mergeSystemMessages(systemMessages: string[]): void {
  if (systemMessages.length <= 1) {
    return
  }

  // OpenCode 多系统消息可能被丢弃，合并为单条以保证注入内容生效
  systemMessages[0] = systemMessages.join('\n\n')
  systemMessages.splice(1)
}

function hasUsingHyperDesignerTag(systemMessages: string[]): boolean {
  return systemMessages.some(msg => USING_HYPER_DESIGNER_PATTERN.test(msg))
}

export function createSystemTransformer() {
  const blockedSkills = new Set(getBlockedSkillsFromConfig())

  return async (_input: unknown, output: { system: string[] }) => {
    if (!hasUsingHyperDesignerTag(output.system)) {
      HyperDesignerLogger.debug('SystemTransform', 'skipping transform - <using-hyper-designer> tag not found')
      return
    }

    const beforeLength = output.system.length
    const workflow = workflowService.getDefinition()
    const workflowState = workflowService.getState()
    await transformSystemMessages(output.system, workflow, workflowState)
    filterBlockedSkills(output.system, blockedSkills)
    if (output.system.length > beforeLength) {
      mergeSystemMessages(output.system)
    }
  }
}
