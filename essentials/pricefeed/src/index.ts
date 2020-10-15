require('dotenv').config()
import * as essentials from 'witness-essentials-package'
import _g = require('./_g')

import {
  bittrex_price,
  probit_price,
  huobi_price,
  bittrex_usd_price,
  kraken_usd_price,
} from './exchanges'
import {
  get_witness,
  publish_feed,
  calculate_usd_price,
  get_exchanges_for_display,
} from './helpers'

let set_properties = false
let transaction_signing_key: any = ''

const start = async () => {
  try {
    const active_exchanges = get_exchanges_for_display(
      _g.config.EXCHANGES,
      true,
    )
    const inactive_exchanges = get_exchanges_for_display(
      _g.config.EXCHANGES,
      false,
    )
    const active_usdt_exchanges = get_exchanges_for_display(
      _g.config.EXCHANGES_USDT,
      true,
    )
    const inactive_usdt_exchanges = get_exchanges_for_display(
      _g.config.EXCHANGES_USDT,
      false,
    )
    console.log('\n' + '----------------------------' + '\n')
    console.log(`Starting Pricefeed\n`)
    console.log(`Witness: @${_g.config.WITNESS}`)
    console.log(`Active Exchanges: [ ${active_exchanges.join(', ')} ]`)
    console.log(
      `Inactive Exchanges: [ ${
        inactive_exchanges.length > 0 ? inactive_exchanges.join(', ') : '-'
      } ]`,
    )
    console.log(
      `Active USDT Exchanges: [ ${active_usdt_exchanges.join(', ')} ]`,
    )
    console.log(
      `Inactive USDT Exchanges: [ ${
        inactive_usdt_exchanges.length > 0
          ? inactive_usdt_exchanges.join(', ')
          : '-'
      } ]`,
    )
    console.log(
      `Convert USDT > USD: ${
        _g.config.CONVERT_USDT_TO_USD ? 'ENABLED' : 'DISABLED'
      }`,
    )
    if (_g.config.PEG != 1) console.log(`Peg: ${_g.config.PEG}`)
    console.log('\n' + '----------------------------' + '\n')
    await main()
  } catch (error) {
    console.error('start', error)
    start()
  }
}

const main = async () => {
  try {
    while (true) {
      _g.usd_lines = _g.log_lines = ''
      const res = await get_witness()
      if (!res.signing_key) continue
      _g.CURRENT_SIGNING_KEY = res.signing_key

      transaction_signing_key = essentials.choose_transaction_key(
        _g.CURRENT_SIGNING_KEY,
        _g.config.ACTIVE_KEY,
        _g.config.SIGNING_KEYS,
      )

      if (
        !transaction_signing_key ||
        _g.CURRENT_SIGNING_KEY.slice(-39) ===
          '1111111111111111111111111111111114T1Anm'
      ) {
        if (!_g.config.ACTIVE_KEY) {
          return console.error(
            `Invalid signing-key pairs AND no valid private active key.`,
          )
        } else {
          transaction_signing_key = String(_g.config.ACTIVE_KEY)
          set_properties = false
        }
      } else {
        set_properties = transaction_signing_key !== _g.config.ACTIVE_KEY
      }

      const result = await update_pricefeed()
      if (!result) essentials.log('Something went wrong. Retrying in 10 sec.')
      await essentials.timeout(result ? _g.config.INTERVAL * 60 : 10)
    }
  } catch (error) {
    console.error('main', error)
    main()
  }
}

const update_pricefeed = async () => {
  try {
    let promises = []

    if (_g.config.EXCHANGES.bittrex) promises.push(bittrex_price())
    if (_g.config.EXCHANGES.probit) promises.push(probit_price())
    if (_g.config.EXCHANGES.huobi) promises.push(huobi_price())
    /* if (_g.config.EXCHANGES.binance) promises.push(binance_price())
    
    if (_g.config.EXCHANGES.upbit) promises.push(upbit_price())*/

    const x = await Promise.all(promises)
    const prices = []

    for (const p of x) {
      if (p && p > 0 && !isNaN(p)) {
        prices.push(p)
      }
    }

    essentials.log(
      `Exchanges: ${_g.log_lines.substring(0, _g.log_lines.length - 2)}`,
    )

    let price = prices.reduce((x, y) => x + y) / prices.length

    if (_g.config.CONVERT_USDT_TO_USD) {
      promises = []
      if (_g.config.EXCHANGES_USDT.bittrex) promises.push(bittrex_usd_price())
      if (_g.config.EXCHANGES_USDT.kraken) promises.push(kraken_usd_price())

      if (promises.length > 0) {
        const usd_price = await calculate_usd_price(await Promise.all(promises))
        essentials.log(
          `Exchanges (USDT): ${_g.usd_lines.substring(
            0,
            _g.usd_lines.length - 2,
          )}`,
        )
        essentials.log(`Average HIVE/USDT: ${price.toFixed(3)}`)

        if (usd_price && usd_price > 0) {
          price = price * usd_price
          essentials.log(`Average HIVE/USD: ${price.toFixed(3)}`)
        }
      } else {
        essentials.log(`No USDT Exchanges enabled - skipping USDT conversion`)
      }
    }

    if (!isNaN(price) && price > 0) {
      await publish_feed(price, transaction_signing_key, {set_properties})
    }
    return true
  } catch (e) {
    console.error('update_pricefeed', e)
    return false
  }
}

start()
