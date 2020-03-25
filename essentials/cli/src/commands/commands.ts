import { update_witness, get_witness, request_active_key } from '../helpers'
import * as essentials from 'witness-essentials-package'
import _g = require('../_g')

export let cmd_update_key = async (key: string, node: string, rotate = false) => {
  let set_properties = false

  // Get Initial Witness Object
  let res = await get_witness({ node })
  _g.witness_data.props = res.props
  _g.witness_data.url = res.url
  _g.CURRENT_SIGNING_KEY = res.signing_key
  
  // If key should be rotated
  if(!key && rotate) {
    let next_key = essentials.get_next_key(_g.config.SIGNING_KEYS, _g.CURRENT_SIGNING_KEY, true)
    key = next_key.public
  }

  // If not key has been given without wanting to rotate
  if (!key || !key.startsWith('ST')) return console.log('Invalid Key')

  // Get the private key from either the signing keys or the active key
  let transaction_signing_key = essentials.choose_transaction_key(res.signing_key, _g.config.ACTIVE_KEY, _g.config.SIGNING_KEYS)

  if (!transaction_signing_key) {
    // Request input of active key from user
    transaction_signing_key = request_active_key(transaction_signing_key)
    if(!transaction_signing_key) return console.error(`Invalid Signing Key Pairs in config. Or witness is disabled, which requires your private active key.`)
  } else {
    set_properties = transaction_signing_key !== _g.config.ACTIVE_KEY
  }

  // Update witness
  let props: any = { new_signing_key: key }
  await update_witness(_g.CURRENT_SIGNING_KEY, transaction_signing_key, props, { set_properties })
  return key
}