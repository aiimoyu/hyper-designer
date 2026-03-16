/**
 * 工具占位符模块测试
 */

import { describe, it, expect } from 'vitest'
import {
  HD_TOOL_PLACEHOLDERS,
  OPENCODE_TOOL_MAPPING,
  replaceToolPlaceholders,
} from '../../../transform/opencode/tool-transform'

describe('tool-transform', () => {
  describe('HD_TOOL_PLACEHOLDERS', () => {
    it('should define ASK_USER placeholder', () => {
      expect(HD_TOOL_PLACEHOLDERS.ASK_USER).toBe('HD_TOOL_ASK_USER')
    })

    it('should define DELEGATE placeholder', () => {
      expect(HD_TOOL_PLACEHOLDERS.DELEGATE).toBe('HD_TOOL_DELEGATE')
    })
  })

  describe('OPENCODE_TOOL_MAPPING', () => {
    it('should map ASK_USER to question', () => {
      expect(OPENCODE_TOOL_MAPPING[HD_TOOL_PLACEHOLDERS.ASK_USER]).toBe('question')
    })

    it('should map DELEGATE to task', () => {
      expect(OPENCODE_TOOL_MAPPING[HD_TOOL_PLACEHOLDERS.DELEGATE]).toBe('task')
    })
  })

  describe('replaceToolPlaceholders', () => {
    it('should replace single placeholder', () => {
      const text = 'Use HD_TOOL_ASK_USER to ask the user'
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe('Use question to ask the user')
    })

    it('should replace multiple placeholders', () => {
      const text = 'Use HD_TOOL_ASK_USER and HD_TOOL_DELEGATE'
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe('Use question and task')
    })

    it('should replace repeated placeholders', () => {
      const text = 'HD_TOOL_ASK_USER, HD_TOOL_ASK_USER, HD_TOOL_ASK_USER'
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe('question, question, question')
    })

    it('should return original text if no placeholders', () => {
      const text = 'No placeholders here'
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe(text)
    })

    it('should handle empty text', () => {
      const text = ''
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe('')
    })

    it('should handle placeholder in code block', () => {
      const text = '```python\n# Use HD_TOOL_ASK_USER\n```'
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe('```python\n# Use question\n```')
    })

    it('should handle placeholder with backticks', () => {
      const text = 'Call `HD_TOOL_ASK_USER` to interact'
      const result = replaceToolPlaceholders(text, OPENCODE_TOOL_MAPPING)
      expect(result).toBe('Call `question` to interact')
    })
  })
})
