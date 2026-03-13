import { describe, expect, it } from 'vitest'
import {
  FRAMEWORK_FALLBACK_PROMPT_TOKEN,
} from '../../../workflows/core/runtime'

describe('workflow runtime tokens', () => {
  it('exports builtin fallback token from centralized module', () => {
    expect(FRAMEWORK_FALLBACK_PROMPT_TOKEN).toBe('{HYPER_DESIGNER_WORKFLOW_FALLBACK_PROMPT}')
  })
})
