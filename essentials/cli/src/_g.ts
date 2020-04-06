/* eslint-disable prefer-const */
import {Client} from '@hivechain/dhive'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let CURRENT_SIGNING_KEY = ''
export let ACTIVE_KEY = ''
export let USED_SIGNING_KEYS = []
export let CURRENT_BACKUP_KEY = ''

export let config = require('../configs/config.js').get()

export let client: Client = new Client(config.RPC_NODES, {
  timeout: 8 * 1000,
  failoverThreshold: 4,
})

export let witness_data = {
  witness: config.WITNESS,
  props: config.PROPS || {
    key: '',
    account_creation_fee: '3.000 HIVE',
    maximum_block_size: 65536,
    hbd_interest_rate: 0,
  },
  url: 'https://hive.blog',
}
