/**
 * 参考资料（REFERENCE.md）设置钩子
 *
 * Classic 工作流专用：在首次进入 IR 阶段时执行：
 * 1. 在项目根目录创建 REFERENCE.md 文件（如果不存在）
 * 2. 通过 adapter.sendPrompt 让 agent 询问用户是否已完成填写
 * 3. 阻塞直到用户确认完成
 */

import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { StageHookFn } from '../../../../../workflows/core/types'
import { HyperDesignerLogger } from '../../../../../utils/logger'

/** REFERENCE.md 文件名 */
const REFERENCE_FILENAME = 'REFERENCE.md'

/** REFERENCE.md 文件内容模板 */
const REFERENCE_TEMPLATE = `# 参考资料清单

> 以下是用户填写的各分类的参考资料路径或链接，帮助 Agent 在执行任务中更好地理解项目需求，Agent 在执行任务的过程中应该积极的参考下面内容。

## 1. Codebase (代码库)

| 子类别 | 您的资料（路径/链接/描述） |
| --- | --- |
| Project Code (本项目代码) | |
| Reference Code (参考项目代码) | |

## 2. Domain Analysis Materials (领域分析资料)

| 子类别 | 您的资料 |
| --- | --- |
| Domain Architecture Analysis (领域架构分析) | |
| Domain Threat Analysis (领域威胁分析) | |
| Compliance Management (规范管理) | |
| Special Domain Requirements (特殊领域需求) | |
| Requirement Review Analysis (需求评审分析) | |

## 3. System Requirement Analysis Materials (系统需求分析资料)

| 子类别 | 您的资料 |
| --- | --- |
| Scenario Library (场景库) | |
| FMEA Library (FMEA库) | |
| Function Library (功能库) | |

## 4. System Design Materials (系统设计资料)

| 子类别 | 您的资料 |
| --- | --- |
| Industry Design References (业界设计参考) | |
| System Design Specification (系统设计说明书) | |
| Module Design Specification (模块功能设计说明书) | |
`

/**
 * 创建参考资料设置钩子
 *
 * @returns StageHookFn
 */
export function createReferenceSetupHook(): StageHookFn {
  return async ({ stageKey, stageName, sessionID, adapter }) => {
    if (!adapter || !sessionID) {
      HyperDesignerLogger.warn('ReferenceSetupHook', '缺少 adapter 或 sessionID，跳过参考资料设置', {
        stageKey,
        stageName,
      })
      return
    }

    const referencePath = join(process.cwd(), REFERENCE_FILENAME)

    // 步骤1: 创建 REFERENCE.md 文件（如果不存在）
    if (!existsSync(referencePath)) {
      try {
        writeFileSync(referencePath, REFERENCE_TEMPLATE, 'utf-8')
        HyperDesignerLogger.info('ReferenceSetupHook', '已创建参考资料清单文件', {
          path: referencePath,
          stageKey,
        })
      } catch (error) {
        HyperDesignerLogger.error('ReferenceSetupHook', '创建参考资料清单文件失败', error instanceof Error ? error : new Error(String(error)), {
          path: referencePath,
        })
      }
    } else {
      HyperDesignerLogger.debug('ReferenceSetupHook', '参考资料清单文件已存在，跳过创建', {
        path: referencePath,
        stageKey,
      })
    }

    // 步骤2: 通过 agent 询问用户是否已完成填写
    const promptText = [
      '## 参考资料填写确认',
      '',
      `已在项目根目录创建 \`${REFERENCE_FILENAME}\` 文件。`,
      '',
      '请打开该文件，填写各分类的参考资料路径或链接。填写完成后，使用 HD_TOOL_ASK_USER 工具告知用户：',
      '',
      '问题内容：',
      '"请检查项目根目录下的 REFERENCE.md 文件，填写完参考资料后点击确认。"',
      '',
      '选项：',
      '- label: "已完成，进入下一步"',
      '',
      '## 重要约束',
      '',
      '1. 你只能使用 HD_TOOL_ASK_USER 工具询问用户，不能进行其他任何操作',
      '2. 用户确认后，你只需要回复："参考资料填写完毕，进入下一步。"',
      '3. 不要添加任何额外的解释或废话',
    ].join('\n')

    HyperDesignerLogger.info('ReferenceSetupHook', '等待用户填写参考资料', {
      stageKey,
      stageName,
      referencePath,
    })

    await adapter.sendPrompt({
      sessionId: sessionID,
      agent: 'HArchitect',
      text: promptText,
    })
  }
}

/**
 * 预创建的参考资料设置钩子实例
 */
export const referenceSetupHook = createReferenceSetupHook()