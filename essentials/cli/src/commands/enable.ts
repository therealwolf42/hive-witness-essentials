require('dotenv').config()
import { log } from 'witness-essentials-package'
import * as commands from './commands'

export let start = async () => {
  let key = process.argv[2]
  let node = process.argv[3]
  await commands.cmd_update_key(key, node)
  log(`Changed key to ${key}`)
}

start()