require('dotenv').config()
const _g = require('../_g')
import { log } from 'witness-essentials-package'
import * as commands from './commands'

export let start = async () => {
  let node = process.argv[2]
  await commands.cmd_update_key(_g.NULL_KEY, node)
  log(`Disabled Witness`)
}

start()