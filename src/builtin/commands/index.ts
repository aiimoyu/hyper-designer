import type { CommandPluginRegistration } from '../../types'
import { createHyperEndCommand } from './hyperEnd'
import { createHyperHandoverCommand } from './hyperHandover'

export const BUILTIN_COMMAND_PLUGINS: CommandPluginRegistration[] = [
  {
    name: 'hyper-end',
    factory: () => createHyperEndCommand(),
  },
  {
    name: 'hyper-handover',
    factory: () => createHyperHandoverCommand(),
  },
]
