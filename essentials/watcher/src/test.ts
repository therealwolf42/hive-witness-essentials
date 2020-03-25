require('dotenv').config()
import * as readline from 'readline-sync'
import * as essentials from 'witness-essentials-package'

import { send_alerts } from './helpers'

import { start_witness_watcher } from './watcher'

const start = async () => {
  console.log('Initiating Witness Essentials: Watcher Tests')
  let disable = true
  const failover = readline.keyInYN(`Do you want to mimic missing blocks and test failover scenarios? (This will change your signing-keys)`)
  if (failover) disable = readline.keyInYN(`Should the failover test also disable your witness?`)
  const notify = readline.keyInYN(`Do you want to test your notifications?`)

  const run = readline.keyInYN(`\nRun test with following settings? Failover: ${failover} ${failover ? `(Disable Witness: ${disable})` : ''} - Notifications: ${notify}`)
  if (run) {
    await start_witness_watcher(true, notify, failover, disable)
    console.log('Finished tests')
  }
}

start()