import * as dhive from '@hivechain/dhive'
import * as moment from 'moment'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let ORIG_KEY = ''
export let TRANSACTION_SIGNING_KEY = ''
export let USED_SIGNING_KEYS: Array<string> = []
export let CURRENT_BACKUP_KEY: { public: string, private: string } = { public: 'STM1111111111111111111111111111111114T1Anm', private: '' }

export let MISSED_BLOCK_FLAG = false
export let last_confirmed_block_num = 0

export let rotation_round = 0

export let start_total_missed = 99999
export let current_total_missed = 99999
export let last_missed = moment.utc().valueOf()

export let config = require('../configs/config.js').get()

export let current_node: string = config.RPC_NODES[0]
export let client: dhive.Client = new dhive.Client(current_node, { timeout: 8 * 1000 })

export let witness_data = {
  witness: config.WITNESS,
  props: { account_creation_fee: '3.000 STEEM', maximum_block_size: 65536, sbd_interest_rate: 0 },
  url: ''
}

export let telegram_data = {
  bot_token: config.TELEGRAM.BOT_TOKEN,
  user_id: config.TELEGRAM.USER_ID
}

export let mail_data = {
  mail_account: config.EMAIL.GOOGLE_MAIL_ACCOUNT,
  mail_password: config.EMAIL.GOOGLE_MAIL_PASSWORD,
  to: config.EMAIL.EMAIL_RECEIVER
}

export let provider_data = {
  api_key: config.SMS.API_KEY,
  api_secret: config.SMS.API_SECRET,
  phone_number: config.SMS.PHONE_NUMBER,
  from_number: config.SMS.FROM_NUMBER
}
