import {
  dhive,
  witness_set_properties,
  log,
  timeout,
  get_witness_by_account,
} from 'witness-essentials-package'
import _g = require('./_g')

interface Options {
  node?: string
  retries?: number
  set_properties?: boolean
}

export const publish_feed = async (
  price: number,
  key: string,
  options: Options = {retries: 0},
) => {
  try {
    if (!options.retries) options.retries = 0
    const PEG = _g.config.PEG ? _g.config.PEG : 1

    const base: dhive.Asset = dhive.Asset.fromString(`${price.toFixed(3)} HBD`)
    const quote: dhive.Asset = dhive.Asset.fromString(
      (1 / PEG).toFixed(3) + ' HIVE',
    )

    const exchange_rate: dhive.PriceType = new dhive.Price(base, quote)

    const props: any = {hbd_exchange_rate: exchange_rate}
    if (options.set_properties) {
      await witness_set_properties(
        _g.client,
        _g.config.WITNESS,
        _g.CURRENT_SIGNING_KEY,
        props,
        key,
      )
    } else {
      const op: dhive.FeedPublishOperation = [
        'feed_publish',
        {exchange_rate, publisher: _g.config.WITNESS},
      ]
      await _g.client.broadcast.sendOperations(
        [op],
        dhive.PrivateKey.fromString(key),
      )
    }

    log(
      `Published Pricefeed: ${base.amount.toFixed(3)}$\nNext feed in ${
        _g.config.INTERVAL
      } Minutes\n`,
    )
  } catch (error) {
    console.error(error)
    if (options.retries < 3) {
      await timeout(1)
      options.retries += 1
      return publish_feed(price, key, options)
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
        rebrandedApi: true,
        consoleOnFailover: true,
      })

    const witness = await get_witness_by_account(client, _g.config.WITNESS)
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

export const calculate_usd_price = async (prices: Array<number>) => {
  try {
    let length = 0
    let price = 1
    let sum = 0
    for (const x of prices) {
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
  const list = []
  for (const key in exchanges) {
    if (exchanges[key] === active) {
      list.push(key)
    }
  }
  return list
}
