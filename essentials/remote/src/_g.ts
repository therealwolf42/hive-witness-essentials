/* eslint-disable prefer-const */
import {Client} from '@hivechain/dhive'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let config = require('../configs/config.js').get()

export let current_node: string = config.RPC_NODES[0]
export let client: Client = new Client(current_node, {timeout: 8 * 1000})

export let witness_data = {
  witness: config.WITNESS,
  props: config.PROPS || {
    account_creation_fee: '0.100 HIVE',
    maximum_block_size: 65536,
    hbd_interest_rate: 0,
  },
  url: 'https://hive.blog',
}

export let telegram_data = {
  bot_token: config.TELEGRAM_BOT_TOKEN,
  user_id: config.TELEGRAM_USER_ID,
}
