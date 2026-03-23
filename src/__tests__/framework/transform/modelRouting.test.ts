import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AgentRuntimeConfig } from '../../../workflows/agentConfig'
import type { HDConfig } from '../../../config/loader'

describe('resolveAgentConfig', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function importWithMock(config: HDConfig) {
    vi.doMock('../../../config/loader', () => ({
      loadHDConfig: () => config,
    }))
    return import('../../../workflows/agentConfig')
  }

  it('returns agent-specific model when configured', async () => {
    const config: HDConfig = {
      agents: {
        HArchitect: {
          model: 'volces/architect-model',
        },
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({
      model: {
        providerID: 'volces',
        modelID: 'architect-model',
      },
    })
  })

  it('returns defaultModel when agent has no model configured', async () => {
    const config: HDConfig = {
      defaultModel: 'volces/default-model',
      agents: {
        HArchitect: {},
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({
      model: {
        providerID: 'volces',
        modelID: 'default-model',
      },
    })
  })

  it('agent model takes priority over defaultModel', async () => {
    const config: HDConfig = {
      defaultModel: 'volces/default-model',
      agents: {
        HArchitect: {
          model: 'volces/architect-model',
        },
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({
      model: {
        providerID: 'volces',
        modelID: 'architect-model',
      },
    })
  })

  it('returns empty object when neither agent model nor defaultModel is configured', async () => {
    const config: HDConfig = {
      agents: {
        HArchitect: {},
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({})
  })

  it('handles model string with multiple slashes', async () => {
    const config: HDConfig = {
      agents: {
        HArchitect: {
          model: 'azure/openai/gpt-4',
        },
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({
      model: {
        providerID: 'azure',
        modelID: 'openai/gpt-4',
      },
    })
  })

  it('returns empty object for invalid model string format', async () => {
    const config: HDConfig = {
      agents: {
        HArchitect: {
          model: 'invalid-model-no-slash',
        },
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({})
  })

  it('returns variant when configured', async () => {
    const config: HDConfig = {
      agents: {
        HArchitect: {
          variant: 'thinking',
        },
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({
      variant: 'thinking',
    })
  })

  it('returns both model and variant when configured', async () => {
    const config: HDConfig = {
      defaultModel: 'volces/default-model',
      agents: {
        HArchitect: {
          variant: 'thinking',
        },
      },
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('HArchitect')

    expect(result).toEqual<AgentRuntimeConfig>({
      model: {
        providerID: 'volces',
        modelID: 'default-model',
      },
      variant: 'thinking',
    })
  })

  it('returns defaultModel for unknown agent when defaultModel is configured', async () => {
    const config: HDConfig = {
      defaultModel: 'volces/default-model',
      agents: {},
    }

    const { resolveAgentConfig } = await importWithMock(config)
    const result = resolveAgentConfig('UnknownAgent')

    expect(result).toEqual<AgentRuntimeConfig>({
      model: {
        providerID: 'volces',
        modelID: 'default-model',
      },
    })
  })
})
