// eslint-disable-next-line @typescript-eslint/no-var-requires
const convict = require('convict')

const config = convict({
  RPC_NODES: {
    doc: 'Array of RPC-Nodes',
    format: '*',
    default: [],
    arg: 'rpc',
  },
  WITNESS: {
    doc: 'Witness Name',
    format: String,
    default: 'witness-name',
    arg: 'witness',
  },
  ACTIVE_KEY: {
    doc: 'Active Key',
    format: String,
    default: '',
  },
  SIGNING_KEYS: {
    doc: 'Array of Signing-Keys (besides currently active)',
    format: '*',
    default: [
      {
        public: '',
        private: '',
      },
    ],
    arg: 'keys',
  },
  TELEGRAM_BOT_TOKEN: {
    doc: 'Telegram Bot Token',
    format: String,
    default: '',
  },
  TELEGRAM_PASSWORD: {
    doc: 'Password to confirm commands',
    format: String,
    default: '',
  },
  TELEGRAM_USER_ID: {
    doc: 'Telegram User ID',
    format: String,
    default: '',
  },
})

config.loadFile('./configs/config.json')
config.validate({allowed: 'strict'})

module.exports = config
