require('dotenv').config()
import {log} from 'witness-essentials-package'
import * as commands from './commands'

export const start = async () => {
  const node = process.argv[2]
  const key = await commands.cmd_update_key('', node, true)
  if (key) log(`Changed key to ${key}`)
}

start()
