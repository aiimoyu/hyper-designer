import type { CommandPluginRegistration } from '../../types'
import { createHyperEndCommand } from './hyperEnd'

export const BUILTIN_COMMAND_PLUGINS: CommandPluginRegistration[] = [
  {
    name: 'hyper-end',
    factory: () => createHyperEndCommand(),
  },
]
