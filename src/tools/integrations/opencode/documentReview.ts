/**
 * OpenCode 平台工具集成
 *
 * 将 documentReview 等抽象工具实现注册到 OpenCode 平台。
 */

import { tool } from "@opencode-ai/plugin"
import { prepareReview } from "../../documentReview/prepareReview"
import { finalizeReview } from "../../documentReview/finalizeReview"
import { HyperDesignerLogger } from "../../../utils/logger"

/**
 * 创建文档审核工具
 */
export function createDocumentReviewTools() {
  return {
    hd_prepare_review: tool({
      description: "拷贝文档到项目根目录供用户审核修改。Agent 形成初稿后调用此工具，然后使用 ask_user 让用户确认修改完成。",
      args: {
        sourcePath: tool.schema.string().describe("源文件路径，如 .hyper-designer/functionalRefinement/xxx.md"),
        reviewPath: tool.schema.string().optional().describe("可选，默认为项目根目录同名文件"),
      },
      async execute(params: { sourcePath: string; reviewPath?: string }) {
        HyperDesignerLogger.debug("DocumentReview", "执行 hd_prepare_review", params)
        const result = await prepareReview(params)
        return JSON.stringify(result, null, 2)
      },
    }),

    hd_finalize_review: tool({
      description: "获取用户修改前后的差异，返回结构化差异数据，并删除临时审核文件。用户确认修改完成后调用。",
      args: {
        sourcePath: tool.schema.string().describe("源文件路径，与 prepare 时相同"),
        reviewPath: tool.schema.string().optional().describe("可选，默认为项目根目录同名文件"),
      },
      async execute(params: { sourcePath: string; reviewPath?: string }) {
        HyperDesignerLogger.debug("DocumentReview", "执行 hd_finalize_review", params)
        const result = await finalizeReview(params)
        return JSON.stringify(result, null, 2)
      },
    }),
  }
}
