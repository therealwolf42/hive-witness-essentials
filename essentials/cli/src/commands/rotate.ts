require('dotenv').config()
import { log } from 'witness-essentials-package'
import * as commands from './commands'

export let start = async () => {
  let node = process.argv[2]
  let key = await commands.cmd_update_key('', node, true)
  if(key) log(`Changed key to ${key}`)
}

start()