import * as essentials from 'witness-essentials-package'
import * as dhive from '@hivechain/dhive'
import * as readline from 'readline-sync'
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

    let client = _g.client
    if (options.node)
      client = new dhive.Client(options.node, {timeout: 8 * 1000})

    if (options.set_properties) {
      await essentials.witness_set_properties(
        client,
        _g.witness_data.witness,
        current_signing_key,
        props,
        transaction_signing_key,
      )
    } else {
      console.log('updating witness')
      await essentials.update_witness(
        client,
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

export const get_witness = async (options: Options = {retries: 0}) => {
  try {
    if (!options.retries) options.retries = 0

    let client = _g.client
    if (options.node)
      client = new dhive.Client(options.node, {timeout: 8 * 1000})

    const witness = await essentials.get_witness_by_account(
      client,
      _g.witness_data.witness,
    )
    return witness
  } catch (error) {
    console.error(error)
    if (options.retries < 2) {
      await essentials.timeout(1)
      options.retries += 1
      await get_witness(options)
    } else {
      failover()
      options.retries = 0
      await get_witness(options)
    }
  }
}

export const request_active_key = (transaction_signing_key) => {
  let tries = 0
  console.error(
    `Invalid Signing Key Pairs in config and/or missing private active key.`,
  )
  while (tries < 3 && !transaction_signing_key) {
    const key = readline.question(`Please enter your active-key to continue: `)
    if (key) {
      transaction_signing_key = key
    }
    tries++
  }
  return transaction_signing_key
}

export const failover = async () => {
  _g.current_node = essentials.failover_node(
    _g.config.RPC_NODES,
    _g.current_node,
  )
  essentials.log(`Switched Node: ${_g.current_node}`)
  _g.client = new dhive.Client(_g.current_node, {timeout: 8 * 1000})
}
