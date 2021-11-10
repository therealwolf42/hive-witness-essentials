import {
  dhive,
  witness_set_properties,
  update_witness as updateWitnessEssentials,
  timeout,
  order_keys,
  get_witness_by_account,
} from 'witness-essentials-package'
import _g = require('./_g')

interface Options {
  node?: string
  retries?: number
  set_properties?: boolean
}

export const update_witness = async (
  current_signing_key: string,
  transaction_signing_key: string,
  props: dhive.utils.WitnessProps,
  options: Options = {},
) => {
  try {
    if (!options.retries) options.retries = 0

    if (options.set_properties) {
      await witness_set_properties(
        _g.client,
        _g.witness_data.witness,
        current_signing_key,
        props,
        transaction_signing_key,
      )
    } else {
      await updateWitnessEssentials(
        _g.client,
        props.new_signing_key.toString(),
        _g.witness_data,
        transaction_signing_key,
      )
    }
  } catch (error) {
    console.error(error)
    if (options.retries < 3) {
      await timeout(1)
      options.retries += 1
      return update_witness(
        current_signing_key,
        transaction_signing_key,
        props,
        options,
      )
    }
  }
}

export const get_witness = async (node = '', retries = 0) => {
  try {
    let client = _g.client
    if (node)
      client = new dhive.Client(node, {
        timeout: 8 * 1000,
        consoleOnFailover: true,
      })

    return await get_witness_by_account(client, _g.witness_data.witness)
  } catch (error) {
    console.error(error)
    if (retries < 3) {
      await timeout(1)
      await get_witness(node, (retries += 1))
    }
  }
}

export const set_initial_witness = (x) => {
  _g.witness_data.url = x.url
  _g.witness_data.props = x.props

  if (
    _g.config.SIGNING_KEYS.filter((y) => y.public === x.signing_key).length <= 0
  ) {
    _g.config.SIGNING_KEYS.push({public: x.signing_key, private: ''})
  }

  _g.config.SIGNING_KEYS = order_keys(_g.config.SIGNING_KEYS, x.signing_key)
}
