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
    doc: 'Private active key',
    format: String,
    default: '',
  },
  SIGNING_KEYS: {
    doc: 'Signing key pairs based on public and private',
    format: Array,
    default: [{public: '', private: ''}],
  },
  EXCHANGES: {
    doc: 'Object of Exchanges',
    format: '*',
    default: {
      bittrex: true,
      binance: true,
      huobi: true,
      upbit: true,
      probit: true,
    },
    arg: 'exchanges',
  },
  EXCHANGES_USDT: {
    doc: 'Object of USDT Exchanges',
    format: '*',
    default: {
      bittrex: true,
      kraken: true,
    },
    arg: 'usdt_exchanges',
  },
  PEG: {
    doc: 'Peg',
    format: Number,
    default: 1,
    arg: 'peg',
  },
  INTERVAL: {
    doc: 'Interval in Minutes.',
    format: Number,
    default: 60,
    arg: 'interval',
  },
  CONVERT_USDT_TO_USD: {
    doc: 'Should USDT be converted to USD?',
    format: Boolean,
    default: false,
  },
})

config.loadFile('./configs/config.json')
config.validate({allowed: 'strict'})

module.exports = config
