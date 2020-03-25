import axios from 'axios'
import {log} from 'witness-essentials-package'
const httpClient = axios.create()
httpClient.defaults.timeout = 5000
const _g = require('./_g')

export let bittrex_price = async () => {
  try {
    let BTC_USD = (
      await httpClient.get(
        'https://bittrex.com/api/v1.1/public/getticker?market=USDT-BTC',
      )
    ).data.result
    let BTC_HIVE = (
      await httpClient.get(
        'https://bittrex.com/api/v1.1/public/getticker?market=BTC-HIVE',
      )
    ).data.result

    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).Last
    BTC_HIVE = JSON.parse(JSON.stringify(BTC_HIVE)).Last

    _g.log_lines += `Bittrex: ${(BTC_HIVE * BTC_USD).toFixed(3)}$, `
    return BTC_HIVE * BTC_USD
  } catch (error) {
    console.error(`bittrex_price`, error)
    return 0
  }
}

/* export let probit_price = async () => {
  try {
    let USD_HIVE = (await httpClient.get('https://api.probit.com/api/exchange/v1/ticker?market_ids=HIVE-USDT')).data.result
    console.log(USD_HIVE)
   BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).Last
    BTC_HIVE = JSON.parse(JSON.stringify(BTC_HIVE)).Last

    _g.log_lines += `Bittrex: ${(BTC_HIVE * BTC_USD).toFixed(3)}$, `
    return BTC_HIVE * BTC_USD
  } catch (error) {
    console.error(`bittrex_price`, error)
    return 0
  }
}*/

/* export let binance_price = async () => {
  try {
    let BTC_USD = (await httpClient.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')).data
    let BTC_HIVE = (await httpClient.get('https://api.binance.com/api/v3/ticker/price?symbol=STEEMBTC')).data

    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).price
    BTC_HIVE = JSON.parse(JSON.stringify(BTC_HIVE)).price

    _g.log_lines += `Binance: ${(BTC_HIVE * BTC_USD).toFixed(3)}$, `
    return BTC_HIVE * BTC_USD
  } catch (error) {
    console.error(`binance_price`, error)
    return 0
  }
}

export let huobi_price = async () => {
  try {

    let BTC_USD = (await httpClient.get('https://api.huobi.pro/market/detail/merged?symbol=btcusdt')).data
    let BTC_HIVE = (await httpClient.get('https://api.huobi.pro/market/detail/merged?symbol=steembtc')).data


    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).tick.close
    BTC_HIVE = JSON.parse(JSON.stringify(BTC_HIVE)).tick.close

    _g.log_lines += `Huobi: ${(BTC_HIVE * BTC_USD).toFixed(3)}$, `
    return BTC_HIVE * BTC_USD
  } catch (error) {
    console.error(`huobi_price`, error)
    return 0
  }
}


export let upbit_price = async () => {
  try {

    let BTC_USD = (await httpClient.get('https://crix-api-endpoint.upbit.com/v1/crix/candles/minutes/1?code=CRIX.UPBIT.USDT-BTC')).data[0]
    let BTC_HIVE = (await httpClient.get('https://crix-api-endpoint.upbit.com/v1/crix/candles/minutes/1?code=CRIX.UPBIT.BTC-STEEM')).data[0]

    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).tradePrice
    BTC_HIVE = JSON.parse(JSON.stringify(BTC_HIVE)).tradePrice

    _g.log_lines += `Upbit: ${(BTC_HIVE * BTC_USD).toFixed(3)}$, `
    return BTC_HIVE * BTC_USD
  } catch (error) {
    console.error(`upbit_price`, error.message)
    return 0
  }
}*/

export let bittrex_usd_price = async () => {
  try {
    let data = (
      await httpClient.get(
        'https://bittrex.com/api/v1.1/public/getticker?market=usd-usdt',
      )
    ).data.result
    let price = parseFloat(data.Last)
    _g.usd_lines += `Bittrex: ${price.toFixed(3)}, `
    return price
  } catch (error) {
    console.error(`kraken_usd_price`, error.message)
    return 0
  }
}

export let kraken_usd_price = async () => {
  try {
    let data = (
      await httpClient.get(
        'https://api.kraken.com/0/public/Ticker?pair=USDTUSD',
      )
    ).data.result.USDTZUSD

    let price = parseFloat(data.c[0])

    _g.usd_lines += `Kraken: ${price.toFixed(3)}, `
    return price
  } catch (error) {
    console.error(`kraken_usd_price`, error.message)
    return 0
  }
}
