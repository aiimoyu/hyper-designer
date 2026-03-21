import { describe, it, expect } from 'vitest'

import { createHdTools } from '../../../workflows/tools/hdTools'

describe('createHdTools', () => {
  it('exports core workflow tools surface', () => {
    const tools = createHdTools()

    expect(tools).toHaveProperty('hd_workflow_state')
    expect(tools).toHaveProperty('hd_workflow_list')
    expect(tools).toHaveProperty('hd_workflow_detail')
    expect(tools).toHaveProperty('hd_workflow_select')
    expect(tools).toHaveProperty('hd_handover')
    expect(tools).toHaveProperty('hd_record_milestone')
    expect(tools).toHaveProperty('hd_force_next_step')
  })
})
