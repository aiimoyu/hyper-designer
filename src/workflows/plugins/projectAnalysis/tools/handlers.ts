/**
 * projectAnalysis 工具实现
 *
 * 本文件定义 projectAnalysis 工作流提供的所有工具。
 * 这些工具是平台无关的，框架会自动适配到各平台（OpenCode、Claude Code 等）。
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import type { ToolDefinition } from '../../../core/toolTypes'
import { HyperDesignerLogger } from '../../../../utils/logger'

const MODULE_NAME = 'projectAnalysis:tools'

/** projectAnalysis 元数据基路径 */
const META_BASE = '.hyper-designer/projectAnalysis/_meta'

/** 读取 JSON 文件辅助函数 */
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

/**
 * 读取组件清单
 * 在 componentAnalysis 和 missingCoverageCheck 阶段可用
 */
const readComponentManifest: ToolDefinition = {
  name: 'hd_analysis_read_component_manifest',
  description: '读取 Stage 1 生成的组件清单（component-manifest.json），获取需要分析的组件列表、依赖关系和组件类型。在组件分析阶段用于确定要分析的组件，在缺漏检查阶段用于验证覆盖率。',
  scope: 'stage',
  stages: ['componentAnalysis', 'missingCoverageCheck'],
  params: {
    projectRoot: {
      type: 'string',
      description: '项目根目录路径（包含 .hyper-designer 目录的路径）',
    },
  },
  async execute(params, _ctx) {
    const projectRoot = params.projectRoot as string
    if (!projectRoot) {
      return JSON.stringify({ error: 'projectRoot 参数不能为空' })
    }

    const manifestPath = join(projectRoot, META_BASE, 'component-manifest.json')
    HyperDesignerLogger.debug(MODULE_NAME, '读取组件清单', { manifestPath })

    const manifest = await readJsonFile<Record<string, unknown>>(manifestPath)
    if (!manifest) {
      return JSON.stringify({ error: `无法读取组件清单: ${manifestPath}` })
    }

    return JSON.stringify(manifest, null, 2)
  },
}

/**
 * 读取系统分析清单
 * 在 componentAnalysis 和 missingCoverageCheck 阶段可用
 */
const readSystemAnalysis: ToolDefinition = {
  name: 'hd_analysis_read_system_analysis',
  description: '读取 Stage 1 生成的系统分析清单（system-analysis.json），获取架构维度数据、框架/语言检测结果等系统级分析数据。',
  scope: 'stage',
  stages: ['componentAnalysis', 'missingCoverageCheck'],
  params: {
    projectRoot: {
      type: 'string',
      description: '项目根目录路径',
    },
  },
  async execute(params) {
    const projectRoot = params.projectRoot as string
    if (!projectRoot) {
      return JSON.stringify({ error: 'projectRoot 参数不能为空' })
    }

    const manifestPath = join(projectRoot, META_BASE, 'system-analysis.json')
    HyperDesignerLogger.debug(MODULE_NAME, '读取系统分析清单', { manifestPath })

    const manifest = await readJsonFile<Record<string, unknown>>(manifestPath)
    if (!manifest) {
      return JSON.stringify({ error: `无法读取系统分析清单: ${manifestPath}` })
    }

    return JSON.stringify(manifest, null, 2)
  },
}

/**
 * 读取 API 清单
 * 在 componentAnalysis 和 missingCoverageCheck 阶段可用
 */
const readApiManifest: ToolDefinition = {
  name: 'hd_analysis_read_api_manifest',
  description: '读取 Stage 1 生成的 API 清单（api-manifest.json），获取 API 接口列表、分类和与组件的映射关系。用于验证 API 覆盖率和跨组件引用。',
  scope: 'stage',
  stages: ['componentAnalysis', 'missingCoverageCheck'],
  params: {
    projectRoot: {
      type: 'string',
      description: '项目根目录路径',
    },
  },
  async execute(params) {
    const projectRoot = params.projectRoot as string
    if (!projectRoot) {
      return JSON.stringify({ error: 'projectRoot 参数不能为空' })
    }

    const manifestPath = join(projectRoot, META_BASE, 'api-manifest.json')
    HyperDesignerLogger.debug(MODULE_NAME, '读取 API 清单', { manifestPath })

    const manifest = await readJsonFile<Record<string, unknown>>(manifestPath)
    if (!manifest) {
      return JSON.stringify({ error: `无法读取 API 清单: ${manifestPath}` })
    }

    return JSON.stringify(manifest, null, 2)
  },
}

/**
 * 检查组件分析产出物
 * 在 missingCoverageCheck 阶段可用
 */
const checkComponentOutputs: ToolDefinition = {
  name: 'hd_analysis_check_component_outputs',
  description: '检查 Stage 2 组件分析的产出物完整性。验证每个组件是否都有对应的 markdown 分析文档和 JSON 元数据文件，返回缺失的产出物列表。',
  scope: 'stage',
  stages: ['missingCoverageCheck'],
  params: {
    projectRoot: {
      type: 'string',
      description: '项目根目录路径',
    },
  },
  async execute(params) {
    const projectRoot = params.projectRoot as string
    if (!projectRoot) {
      return JSON.stringify({ error: 'projectRoot 参数不能为空' })
    }

    const manifestPath = join(projectRoot, META_BASE, 'component-manifest.json')
    const manifest = await readJsonFile<{ components?: Array<{ slug: string }> }>(manifestPath)

    if (!manifest?.components) {
      return JSON.stringify({ error: '无法读取组件清单或格式无效' })
    }

    const results: Array<{
      slug: string
      markdownExists: boolean
      metadataExists: boolean
    }> = []

    for (const component of manifest.components) {
      const mdPath = join(projectRoot, '.hyper-designer/projectAnalysis/component', `${component.slug}.md`)
      const jsonPath = join(projectRoot, META_BASE, 'components', `${component.slug}.json`)

      let markdownExists = false
      let metadataExists = false

      try {
        await readFile(mdPath)
        markdownExists = true
      } catch {
        // 文件不存在
      }

      try {
        await readFile(jsonPath)
        metadataExists = true
      } catch {
        // 文件不存在
      }

      results.push({
        slug: component.slug,
        markdownExists,
        metadataExists,
      })
    }

    const missing = results.filter(r => !r.markdownExists || !r.metadataExists)

    return JSON.stringify({
      totalComponents: results.length,
      completeComponents: results.length - missing.length,
      missingComponents: missing,
      details: results,
    }, null, 2)
  },
}

/**
 * 读取分析报告
 * 在 missingCoverageCheck 阶段可用
 */
const readAnalysisReport: ToolDefinition = {
  name: 'hd_analysis_read_report',
  description: '读取指定的分析报告文件。用于 Stage 3 缺漏检查阶段读取架构分析报告或组件分析文档，验证分析质量。',
  scope: 'stage',
  stages: ['missingCoverageCheck'],
  params: {
    projectRoot: {
      type: 'string',
      description: '项目根目录路径',
    },
    reportType: {
      type: 'string',
      description: '报告类型',
      enum: ['architecture', 'component'],
    },
    componentSlug: {
      type: 'string',
      description: '组件 slug（仅 reportType=component 时需要）',
      optional: true,
    },
  },
  async execute(params) {
    const projectRoot = params.projectRoot as string
    const reportType = params.reportType as string
    const componentSlug = params.componentSlug as string | undefined

    if (!projectRoot) {
      return JSON.stringify({ error: 'projectRoot 参数不能为空' })
    }

    let filePath: string
    if (reportType === 'architecture') {
      filePath = join(projectRoot, '.hyper-designer/projectAnalysis/architecture.md')
    } else if (reportType === 'component') {
      if (!componentSlug) {
        return JSON.stringify({ error: 'componentSlug 参数在 reportType=component 时必填' })
      }
      filePath = join(projectRoot, '.hyper-designer/projectAnalysis/component', `${componentSlug}.md`)
    } else {
      return JSON.stringify({ error: `不支持的报告类型: ${reportType}` })
    }

    try {
      const content = await readFile(filePath, 'utf-8')
      return JSON.stringify({
        path: filePath,
        content,
        size: content.length,
      }, null, 2)
    } catch {
      return JSON.stringify({ error: `无法读取报告文件: ${filePath}` })
    }
  },
}

/**
 * projectAnalysis 工作流提供的所有工具
 */
export const projectAnalysisTools: ToolDefinition[] = [
  readComponentManifest,
  readSystemAnalysis,
  readApiManifest,
  checkComponentOutputs,
  readAnalysisReport,
]
