require('dotenv').config()
import _g = require('../_g')
import {log} from 'witness-essentials-package'
import * as commands from './commands'

export const start = async () => {
  const node = process.argv[2]
  await commands.cmd_update_key(_g.NULL_KEY, node)
  log(`Disabled Witness`)
}

start()
