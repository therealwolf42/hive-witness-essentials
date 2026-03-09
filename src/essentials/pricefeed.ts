import axios from 'axios';
import { Asset, FeedPublishOperation, Price, PriceType, PrivateKey } from '@hiveio/dhive';
import { config, getWitnessByAccount, chooseTransactionKey, timeout, updateWitnessProperties, client } from '../utils';
import retry from 'p-retry';

const httpClient = axios.create({
  timeout: 5000,
});

let setProperties = false;
let transactionSigningKey: any = '';
let logLines = '';
let usdLines = '';
let currentSigningKey = '';

export const startPricefeed = async (isTesting = false, shouldBroadcast = true) => {
  try {
    const active_exchanges = getExchangesForDisplay(config.get('PRICEFEED.EXCHANGES'), true);
    const inactive_exchanges = getExchangesForDisplay(config.get('PRICEFEED.EXCHANGES'), false);
    const active_usdt_exchanges = getExchangesForDisplay(config.get('PRICEFEED.EXCHANGES_USDT'), true);
    const inactive_usdt_exchanges = getExchangesForDisplay(config.get('PRICEFEED.EXCHANGES_USDT'), false);
    console.log('\n' + '----------------------------' + '\n');
    logNT(`Starting Pricefeed\n`);
    logNT(`Witness: @${config.get('WITNESS')}`);
    logNT(`Active Exchanges: [ ${active_exchanges.join(', ')} ]`);
    logNT(`Inactive Exchanges: [ ${inactive_exchanges.length > 0 ? inactive_exchanges.join(', ') : '-'} ]`);
    logNT(`Active USDT Exchanges: [ ${active_usdt_exchanges.join(', ')} ]`);
    logNT(`Inactive USDT Exchanges: [ ${inactive_usdt_exchanges.length > 0 ? inactive_usdt_exchanges.join(', ') : '-'} ]`);
    logNT(`Convert USDT > USD: ${config.get('PRICEFEED.CONVERT_USDT_TO_USD') ? 'ENABLED' : 'DISABLED'}`);
    if (config.get('PRICEFEED.PEG') != 1) logNT(`Peg: ${config.get('PRICEFEED.PEG')}`);
    console.log('\n' + '----------------------------' + '\n');
    await main(isTesting, shouldBroadcast);
  } catch (error) {
    console.error('start', error);
    startPricefeed(isTesting, shouldBroadcast);
  }
};

const main = async (isTesting: boolean, shouldBroadcast: boolean) => {
  try {
    while (true) {
      usdLines = logLines = '';
      const res = await retry(async () => getWitnessByAccount(config.get('WITNESS')), { retries: 3 });
      if (!res?.signing_key) continue;
      currentSigningKey = res.signing_key;

      transactionSigningKey = chooseTransactionKey(currentSigningKey, config.get('ACTIVE_KEY'), config.get('SIGNING_KEYS'));

      if (!transactionSigningKey || currentSigningKey.slice(-39) === '1111111111111111111111111111111114T1Anm') {
        if (!config.get('ACTIVE_KEY')) {
          return console.error(`Invalid signing-key pairs AND no valid private active key.`);
        } else {
          transactionSigningKey = String(config.get('ACTIVE_KEY'));
          setProperties = false;
        }
      } else {
        setProperties = transactionSigningKey !== config.get('ACTIVE_KEY');
      }

      const result = await updatePricefeed(isTesting, shouldBroadcast);
      if (!result) log('Something went wrong. Retrying in 10 sec.');
      if (isTesting) {
        break;
      }
      await timeout(result ? Number(config.get('PRICEFEED.INTERVAL')) * 60 : 10);
    }
  } catch (error) {
    console.error('main', error);
    main(isTesting, shouldBroadcast);
  }
};

const updatePricefeed = async (isTesting: boolean, shouldBroadcast: boolean) => {
  try {
    let promises = [];

    const exchanges: any = config.get('PRICEFEED.EXCHANGES');
    if (exchanges.binance !== false) promises.push(getBinancePrice());
    if (exchanges.upbit !== false) promises.push(getUpbitPrice());
    if (exchanges.mexc !== false) promises.push(getMexcPrice());
    if (exchanges.bitmart !== false) promises.push(getBitmartPrice());
    if (exchanges.biconomy !== false) promises.push(getBiconomyPrice());
    if (exchanges.xt !== false) promises.push(getXtPrice());

    const x = await Promise.all(promises);
    const prices = [];

    for (const p of x) {
      if (p && p > 0 && !isNaN(p)) {
        prices.push(p);
      }
    }

    log(`Exchanges: ${logLines.substring(0, logLines.length - 2)}`);

    let price = prices.reduce((x, y) => x + y) / prices.length;

    if (config.get('PRICEFEED.CONVERT_USDT_TO_USD')) {
      promises = [];
      const usdt_exchanges: any = config.get('PRICEFEED.EXCHANGES_USDT');
      if (usdt_exchanges.kraken !== false) promises.push(getKrakenUsdPrice());
      if (usdt_exchanges.binance !== false) promises.push(getBinanceUsdPrice());
      if (usdt_exchanges.bitstamp !== false) promises.push(getBitstampUsdPrice());
      if (usdt_exchanges.coinbase !== false) promises.push(getCoinbaseUsdPrice());

      if (promises.length > 0) {
        const usd_price = await calculateUsdPrice(await Promise.all(promises));
        log(`Exchanges (USDT): ${usdLines.substring(0, usdLines.length - 2)}`);
        log(`Average HIVE/USDT: ${price.toFixed(3)}`);

        if (usd_price && usd_price > 0) {
          price = price * usd_price;
          log(`Average HIVE/USD: ${price.toFixed(3)}`);
        }
      } else {
        log(`No USDT Exchanges enabled - skipping USDT conversion`);
      }
    }

    if (!shouldBroadcast) {
      log(`TEST-MODE: Skipping pricefeed publication`);
    } else if (!isNaN(price) && price > 0) {
      await publishFeed(price, transactionSigningKey, setProperties);
    }
    return true;
  } catch (e) {
    console.error('update_pricefeed', e);
    return false;
  }
};

interface ExchangeResponse {
  price: number;
  error?: any;
}

const handleExchangeError = (exchange: string, error: any): ExchangeResponse => {
  console.error(`${exchange}_price`, error);
  return { price: 0, error };
};

/// EXCHANGES

const getBinancePrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://api.binance.com/api/v3/ticker/price?symbol=HIVEUSDT');
    const price = Number(data.price);

    logLines += `Binance: ${price.toFixed(3)}$, `;
    return price;
  } catch (error) {
    return handleExchangeError('binance', error).price;
  }
};

const getUpbitPrice = async (): Promise<number> => {
  try {
    const [btcUsdResponse, btcHiveResponse] = await Promise.all([
      httpClient.get('https://crix-api-endpoint.upbit.com/v1/crix/candles/minutes/1?code=CRIX.UPBIT.USDT-BTC'),
      httpClient.get('https://crix-api-endpoint.upbit.com/v1/crix/candles/minutes/1?code=CRIX.UPBIT.BTC-HIVE'),
    ]);

    const btcUsdPrice = btcUsdResponse.data[0].tradePrice;
    const btcHivePrice = btcHiveResponse.data[0].tradePrice;
    const price = btcHivePrice * btcUsdPrice;

    logLines += `Upbit: ${price.toFixed(3)}$, `;
    return price;
  } catch (error) {
    return handleExchangeError('upbit', error).price;
  }
};

const getMexcPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://api.mexc.com/api/v3/ticker/price?symbol=HIVEUSDT');
    const price = Number(data.price);

    logLines += `MEXC: ${price.toFixed(3)}$, `;
    return price;
  } catch (error) {
    return handleExchangeError('mexc', error).price;
  }
};

const getBitmartPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://api-cloud.bitmart.com/spot/quotation/v3/ticker?symbol=HIVE_USDT');
    const price = Number(data.data.last);

    logLines += `BitMart: ${price.toFixed(3)}$, `;
    return price;
  } catch (error) {
    return handleExchangeError('bitmart', error).price;
  }
};

const getBiconomyPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://www.biconomy.com/api/v1/tickers');
    const ticker = data.ticker.find((t: any) => t.symbol === 'HIVE_USDT');
    const price = Number(ticker.last);

    logLines += `Biconomy: ${price.toFixed(3)}$, `;
    return price;
  } catch (error) {
    return handleExchangeError('biconomy', error).price;
  }
};

const getXtPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://sapi.xt.com/v4/public/ticker/price?symbol=hive_usdt');
    const price = Number(data.result[0].p);

    logLines += `XT: ${price.toFixed(3)}$, `;
    return price;
  } catch (error) {
    return handleExchangeError('xt', error).price;
  }
};

const getKrakenUsdPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://api.kraken.com/0/public/Ticker?pair=USDTUSD');
    const price = parseFloat(data.result.USDTZUSD.c[0]);

    usdLines += `Kraken: ${price.toFixed(3)}, `;
    return price;
  } catch (error) {
    return handleExchangeError('kraken_usd', error).price;
  }
};

const getBinanceUsdPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://api.binance.com/api/v3/ticker/price?symbol=USDTUSD');
    const price = Number(data.price);

    usdLines += `Binance: ${price.toFixed(3)}, `;
    return price;
  } catch (error) {
    return handleExchangeError('binance_usd', error).price;
  }
};

const getBitstampUsdPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://www.bitstamp.net/api/v2/ticker/usdtusd/');
    const price = Number(data.last);

    usdLines += `Bitstamp: ${price.toFixed(3)}, `;
    return price;
  } catch (error) {
    return handleExchangeError('bitstamp_usd', error).price;
  }
};

const getCoinbaseUsdPrice = async (): Promise<number> => {
  try {
    const { data } = await httpClient.get('https://api.coinbase.com/v2/prices/USDT-USD/spot');
    const price = Number(data.data.amount);

    usdLines += `Coinbase: ${price.toFixed(3)}, `;
    return price;
  } catch (error) {
    return handleExchangeError('coinbase_usd', error).price;
  }
};

export const publishFeed = async (price: number, transactionSigningKey: string, setProperties: boolean = false) => {
  const PEG = config.get('PRICEFEED.PEG') ? config.get('PRICEFEED.PEG') : 1;

  const base: Asset = Asset.fromString(`${price.toFixed(3)} HBD`);
  const quote: Asset = Asset.fromString((1 / PEG).toFixed(3) + ' HIVE');

  const exchange_rate: PriceType = new Price(base, quote);

  const props: any = { hbd_exchange_rate: exchange_rate };
  if (setProperties) {
    await updateWitnessProperties(config.get('WITNESS'), currentSigningKey, props, transactionSigningKey);
  } else {
    const op: FeedPublishOperation = ['feed_publish', { exchange_rate, publisher: config.get('WITNESS') }];
    await client.broadcast.sendOperations([op], PrivateKey.fromString(transactionSigningKey));
  }

  log(`Published Pricefeed: ${base.amount.toFixed(3)}$\nNext feed in ${config.get('PRICEFEED.INTERVAL')} Minutes\n`);
};

export const calculateUsdPrice = async (prices: Array<number>) => {
  try {
    let length = 0;
    let price = 1;
    let sum = 0;
    for (const x of prices) {
      if (x && x > 0) {
        length++;
        sum += x;
      }
    }
    price = sum / length > 0 ? sum / length : 1;
    return price;
  } catch (error) {
    console.error('calculate_usd_price', error);
    return 1;
  }
};

// Convert exchanges object for console display
export const getExchangesForDisplay = (exchanges: any, active: boolean) => {
  const list = [];
  for (const key in exchanges) {
    if (exchanges[key] === active) {
      list.push(key);
    }
  }
  return list;
};

const log = (...args: any[]): void => console.log(`[PRICEFEED] ${new Date().toISOString()} - ${args}`);
const logNT = (...args: any[]): void => console.log(`[PRICEFEED] ${args}`);
