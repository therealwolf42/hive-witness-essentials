const convict = require('convict')

let config = convict({
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
})

config.loadFile('./configs/config.json')
config.validate({allowed: 'strict'})

module.exports = config
