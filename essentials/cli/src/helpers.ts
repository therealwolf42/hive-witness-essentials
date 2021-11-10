import {
  dhive,
  witness_set_properties,
  update_witness as updateWitnessEssentials,
  timeout,
  get_witness_by_account,
} from 'witness-essentials-package'
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
      client = new dhive.Client(options.node, {
        timeout: 8 * 1000,
        consoleOnFailover: true,
      })

    if (options.set_properties) {
      await witness_set_properties(
        client,
        _g.witness_data.witness,
        current_signing_key,
        props,
        transaction_signing_key,
      )
    } else {
      console.log('updating witness')
      await updateWitnessEssentials(
        client,
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

export const get_witness = async (options: Options = {retries: 0}) => {
  try {
    if (!options.retries) options.retries = 0

    let client = _g.client
    if (options.node)
      client = new dhive.Client(options.node, {
        timeout: 8 * 1000,
        consoleOnFailover: true,
      })

    const witness = await get_witness_by_account(
      client,
      _g.witness_data.witness,
    )

    console.log(witness)
    return witness
  } catch (error) {
    console.error(error)
    if (options.retries < 3) {
      await timeout(1)
      options.retries += 1
      return get_witness(options)
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
