import * as dsteem from '@hivechain/dhive'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let CURRENT_SIGNING_KEY = ''
export let ACTIVE_KEY = ''

export let config = require('../configs/config.js').get()

export let current_node: string = config.RPC_NODES[0]
export let client: dsteem.Client = new dsteem.Client(current_node, {
  timeout: 8 * 1000,
}) //TESTNET: dsteem.Client.testnet({ timeout: 8 * 1000 })

export let log_lines = ''
export let usd_lines = ''
