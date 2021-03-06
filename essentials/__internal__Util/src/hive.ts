import * as dhive from '@hiveio/dhive'
import * as hive from '@hiveio/hive-js'
import {convert_nai_precision} from './util'

export interface WitnessData {
  witness: string
  props: {
    account_creation_fee: string
    maximum_block_size: number
    hbd_interest_rate: number
  }
  url: string
}

export interface WitnessProperties {
  witness: string
  props: any //Array<[string, Buffer]>
}

/**
 * Update the witness data
 * @param key Signing Key
 * @param command Whether it is a command which will not trigger alerts
 * @param change_key Is the signing-key being changed?
 */
export const update_witness = async (
  client: dhive.Client,
  signing_key: string,
  witness_data: WitnessData,
  transaction_signing_key: string,
  fee = '0.000',
) => {
  witness_data.props = cleanWitnessProps(witness_data.props)
  const op: dhive.WitnessUpdateOperation = [
    'witness_update',
    {
      block_signing_key: signing_key,
      fee: `${fee} HIVE`,
      owner: witness_data.witness,
      props: witness_data.props,
      url: witness_data.url,
    },
  ]

  return await client.broadcast.sendOperations(
    [op],
    dhive.PrivateKey.from(transaction_signing_key),
  )
}

/**
 * Update witness properties with signing-key (NEW IN HF20)
 */
export const witness_set_properties = async (
  client: dhive.Client,
  owner: string,
  current_signing_key: string,
  props: dhive.utils.WitnessProps,
  transaction_signing_key: string,
) => {
  props = cleanWitnessProps(props)
  props.key = current_signing_key
  const op = dhive.utils.buildWitnessUpdateOp(owner, props)
  op[1].props.sort((a, b) => a[0].localeCompare(b[0]))
  return await client.broadcast.sendOperations(
    [op],
    dhive.PrivateKey.from(transaction_signing_key),
  )
}

export const get_witness_by_account = async (client: dhive.Client, witness) => {
  //return await client.call('condenser_api', 'get_witness_by_account', [witness]) Disabled as it was giving back cached/invalid data
  const x = await client.call('database_api', 'find_witnesses', {
    owners: [witness],
  })
  if (x) {
    const witness = x['witnesses'][0]
    const account_creation_fee: any = convert_nai_precision(
      x['witnesses'][0].props.account_creation_fee.amount,
      x['witnesses'][0].props.account_creation_fee.precision,
    )
    witness.props.account_creation_fee = `${account_creation_fee} HIVE`
    witness.props = cleanWitnessProps(witness.props)
    if (witness.sbd_exchange_rate) {
      witness.hbd_exchange_rate = witness.sbd_interest_rate
      delete witness.sbd_interest_rate
    }
    return witness
  }
  return {}
}

export const key_valid = (key, key_auths) => {
  const pub = hive.auth.wifToPublic(key)
  const filter = key_auths.filter((x) => x[0] === pub)
  return filter.length > 0
}

export const get_account = async (client: dhive.Client, name) => {
  const acc = await client.database.getAccounts([name])
  if (!acc) return {}
  return acc[0]
}

export const cleanWitnessProps = (props: any) => {
  if ((props as any).sbd_interest_rate) {
    props.hbd_interest_rate = (props as any).sbd_interest_rate
    delete (props as any).sbd_interest_rate
  }
  return props
}
