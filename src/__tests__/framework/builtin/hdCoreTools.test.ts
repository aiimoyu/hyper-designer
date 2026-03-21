import { describe, it, expect } from 'vitest'

import { createHdCoreToolDefinitions } from '../../../builtin/tools/hdCoreTools'

describe('createHdCoreToolDefinitions', () => {
  it('exports core workflow tool definitions', () => {
    const definitions = createHdCoreToolDefinitions()
    const names = definitions.map(definition => definition.name)

    expect(names).toContain('hd_workflow_state')
    expect(names).toContain('hd_workflow_list')
    expect(names).toContain('hd_workflow_detail')
    expect(names).toContain('hd_workflow_select')
    expect(names).toContain('hd_handover')
    expect(names).toContain('hd_record_milestone')
    expect(names).toContain('hd_force_next_step')
  })
})
