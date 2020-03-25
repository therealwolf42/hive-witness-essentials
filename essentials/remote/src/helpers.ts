import * as essentials from 'witness-essentials-package'
import * as dhive from '@hivechain/dhive'
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
      await essentials.witness_set_properties(
        _g.client,
        _g.witness_data.witness,
        current_signing_key,
        props,
        transaction_signing_key,
      )
    } else {
      await essentials.update_witness(
        _g.client,
        props.new_signing_key.toString(),
        _g.witness_data,
        transaction_signing_key,
      )
    }
  } catch (error) {
    console.error(error)
    if (options.retries < 2) {
      await essentials.timeout(1)
      options.retries += 1
      await update_witness(
        current_signing_key,
        transaction_signing_key,
        props,
        options,
      )
    } else {
      failover()
      options.retries = 0
      await update_witness(
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
    if (node) client = new dhive.Client(node, {timeout: 8 * 1000})

    return await essentials.get_witness_by_account(
      client,
      _g.witness_data.witness,
    )
  } catch (error) {
    console.error(error)
    if (retries < 2) {
      await essentials.timeout(1)
      await get_witness(node, (retries += 1))
    } else {
      failover()
      await get_witness(node, 0)
    }
  }
}

export const failover = async () => {
  _g.current_node = essentials.failover_node(
    _g.config.RPC_NODES,
    _g.current_node,
  )
  essentials.log(`Switched Node: ${_g.current_node}`)
  _g.client = new dhive.Client(_g.current_node, {timeout: 8 * 1000})
}

export const set_initial_witness = (x) => {
  _g.witness_data.url = x.url
  _g.witness_data.props = x.props

  if (
    _g.config.SIGNING_KEYS.filter((y) => y.public === x.signing_key).length <= 0
  ) {
    _g.config.SIGNING_KEYS.push({public: x.signing_key, private: ''})
  }

  _g.config.SIGNING_KEYS = essentials.order_keys(
    _g.config.SIGNING_KEYS,
    x.signing_key,
  )
}
