/* eslint-disable prefer-const */
import {Client} from '@hivechain/dhive'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let CURRENT_SIGNING_KEY = ''
export let ACTIVE_KEY = ''

export let config = require('../configs/config.js').get()

export let client: Client = new Client(config.RPC_NODES, {
  timeout: 8 * 1000,
  failoverThreshold: 4,
})

export let log_lines = ''
export let usd_lines = ''
