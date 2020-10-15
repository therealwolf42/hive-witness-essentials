/* eslint-disable prefer-const */
import {dhive} from 'witness-essentials-package'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let CURRENT_SIGNING_KEY = ''
export let ACTIVE_KEY = ''

export let config = require('../configs/config.js').get()

export let client: dhive.Client = new dhive.Client(config.RPC_NODES, {
  timeout: 8 * 1000,
  failoverThreshold: 4,
  rebrandedApi: true,
  consoleOnFailover: true,
})

export let log_lines = ''
export let usd_lines = ''
