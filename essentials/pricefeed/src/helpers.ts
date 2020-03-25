import * as essentials from 'witness-essentials-package'
import * as dsteem from '@hivechain/dhive'
const _g = require('./_g')

interface Options {
  node?: string
  retries?: number
  set_properties?: boolean
}

export let publish_feed = async (
  price: number,
  key: string,
  options: Options = {retries: 0},
) => {
  try {
    if (!options.retries) options.retries = 0
    const PEG = _g.config.PEG ? _g.config.PEG : 1

    let base: dsteem.Asset = dsteem.Asset.fromString(`${price.toFixed(3)} HBD`)
    let quote: dsteem.Asset = dsteem.Asset.fromString(
      (1 / PEG).toFixed(3) + ' HIVE',
    )

    let exchange_rate: dsteem.PriceType = new dsteem.Price(base, quote)

    let props: any = {sbd_exchange_rate: exchange_rate}
    let result
    if (options.set_properties) {
      result = await essentials.witness_set_properties(
        _g.client,
        _g.config.WITNESS,
        _g.CURRENT_SIGNING_KEY,
        props,
        key,
      )
    } else {
      let op: dsteem.FeedPublishOperation = [
        'feed_publish',
        {exchange_rate, publisher: _g.config.WITNESS},
      ]
      result = await _g.client.broadcast.sendOperations(
        [op],
        dsteem.PrivateKey.from(key),
      )
    }

    essentials.log(
      `Published Pricefeed: ${base.amount.toFixed(3)}$\nNext feed in ${
        _g.config.INTERVAL
      } Minutes\n`,
    )
  } catch (error) {
    console.error(error)
    if (options.retries < 2) {
      await essentials.timeout(1)
      options.retries += 1
      await publish_feed(price, key, options)
    } else {
      failover()
      options.retries = 0
      await publish_feed(price, key, options)
    }
  }
}

export let get_witness = async (options: Options = {retries: 0}) => {
  try {
    if (!options.retries) options.retries = 0

    let client = _g.client
    if (options.node)
      client = new dsteem.Client(options.node, {timeout: 8 * 1000})

    let witness = await essentials.get_witness_by_account(
      client,
      _g.config.WITNESS,
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

export let calculate_usd_price = async (prices: Array<number>) => {
  try {
    let length = 0
    let price = 1
    let sum = 0
    for (let x of prices) {
      if (x && x > 0) {
        length++
        sum += x
      }
    }
    price = sum / length > 0 ? sum / length : 1
    return price
  } catch (error) {
    console.error('calculate_usd_price', error)
    return 1
  }
}

// Convert exchanges object for console display
export const get_exchanges_for_display = (exchanges, active) => {
  let list = []
  for (let key in exchanges) {
    if (exchanges[key] === active) {
      list.push(key)
    }
  }
  return list
}

export let failover = async () => {
  _g.current_node = essentials.failover_node(
    _g.config.RPC_NODES,
    _g.current_node,
  )
  essentials.log(`Switched Node: ${_g.current_node}`)
  _g.client = new dsteem.Client(_g.current_node, {timeout: 8 * 1000})
}
