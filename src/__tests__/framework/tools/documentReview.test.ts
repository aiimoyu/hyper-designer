/**
 * 文档审核工具测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import { prepareReview } from '../../../tools/documentReview/prepareReview'
import { finalizeReview } from '../../../tools/documentReview/finalizeReview'
import { convertToHunks } from '../../../tools/documentReview/diffUtils'

describe('documentReview', () => {
  const tempDir = path.join(process.cwd(), '.test-temp', 'document-review-tests')
  const sourceDir = path.join(tempDir, 'source')
  const sourceFilePath = path.join(sourceDir, '测试文档.md')

  beforeEach(async () => {
    await fs.mkdir(sourceDir, { recursive: true })
    const initialContent = `# 测试文档

## 功能描述
这是一个测试功能。

## 功能规则
1. 规则一
2. 规则二
`
    await fs.writeFile(sourceFilePath, initialContent, 'utf-8')
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('prepareReview', () => {
    it('should copy source file to project root', async () => {
      const result = await prepareReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      expect(result.success).toBe(true)
      expect(result.sourcePath).toBe(sourceFilePath)
      expect(result.reviewPath).toBe(path.join(tempDir, '测试文档.md'))
      expect(result.message).toContain('已拷贝')

      const reviewContent = await fs.readFile(result.reviewPath, 'utf-8')
      const sourceContent = await fs.readFile(sourceFilePath, 'utf-8')
      expect(reviewContent).toBe(sourceContent)
    })

    it('should fail when source file does not exist', async () => {
      const result = await prepareReview({
        sourcePath: path.join(sourceDir, '不存在.md'),
        projectRoot: tempDir
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('不存在')
    })

    it('should use custom reviewPath when provided', async () => {
      const customReviewPath = path.join(tempDir, 'custom-name.md')
      const result = await prepareReview({
        sourcePath: sourceFilePath,
        reviewPath: customReviewPath,
        projectRoot: tempDir
      })

      expect(result.success).toBe(true)
      expect(result.reviewPath).toBe(customReviewPath)
    })
  })

  describe('finalizeReview', () => {
    it('should return diff when file is modified', async () => {
      await prepareReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      const reviewPath = path.join(tempDir, '测试文档.md')
      const modifiedContent = `# 测试文档

## 功能描述
这是一个修改后的测试功能。

## 功能规则
1. 规则一
2. 规则二
3. 规则三
`
      await fs.writeFile(reviewPath, modifiedContent, 'utf-8')

      const result = await finalizeReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      expect(result.success).toBe(true)
      expect(result.hasChanges).toBe(true)
      expect(result.hunks.length).toBeGreaterThan(0)
      expect(result.summary.additions).toBeGreaterThan(0)
      expect(result.message).toContain('修改')

      const reviewFileExists = await fs.access(reviewPath).then(() => true).catch(() => false)
      expect(reviewFileExists).toBe(false)
    })

    it('should return empty diff when file is not modified', async () => {
      await prepareReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      const result = await finalizeReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      expect(result.success).toBe(true)
      expect(result.hasChanges).toBe(false)
      expect(result.hunks).toHaveLength(0)
      expect(result.summary.additions).toBe(0)
      expect(result.summary.deletions).toBe(0)
      expect(result.message).toContain('未检测到修改')
    })

    it('should fail when review file is deleted', async () => {
      await prepareReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      const reviewPath = path.join(tempDir, '测试文档.md')
      await fs.unlink(reviewPath)

      const result = await finalizeReview({
        sourcePath: sourceFilePath,
        projectRoot: tempDir
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('已被删除')
    })
  })

  describe('diffUtils', () => {
    it('should detect additions', () => {
      const oldContent = 'line1\nline2\n'
      const newContent = 'line1\nline2\nline3\nline4\n'

      const hunks = convertToHunks(oldContent, newContent)

      expect(hunks).toHaveLength(1)
      expect(hunks[0].type).toBe('add')
      expect(hunks[0].newContent).toContain('line3')
      expect(hunks[0].newContent).toContain('line4')
    })

    it('should detect deletions', () => {
      const oldContent = 'line1\nline2\nline3\n'
      const newContent = 'line1\nline2\n'

      const hunks = convertToHunks(oldContent, newContent)

      expect(hunks).toHaveLength(1)
      expect(hunks[0].type).toBe('delete')
      expect(hunks[0].oldContent).toContain('line3')
    })

    it('should detect modifications', () => {
      const oldContent = 'line1\nold line\nline3'
      const newContent = 'line1\nnew line\nline3'

      const hunks = convertToHunks(oldContent, newContent)

      expect(hunks).toHaveLength(1)
      expect(hunks[0].type).toBe('modify')
      expect(hunks[0].oldContent).toContain('old line')
      expect(hunks[0].newContent).toContain('new line')
    })

    it('should handle multiple changes', () => {
      const oldContent = 'line1\nline2\nline3\nline4'
      const newContent = 'line1\nmodified\nline3\nadded'

      const hunks = convertToHunks(oldContent, newContent)

      expect(hunks.length).toBeGreaterThanOrEqual(2)
    })

    it('should return empty array for identical content', () => {
      const content = 'line1\nline2\nline3'
      const hunks = convertToHunks(content, content)

      expect(hunks).toHaveLength(0)
    })
  })
})
