import * as agent from 'superagent';
import { identity, retry } from './utils';
import * as logger from 'winston';

export type PriceData = number[];

export function gemini(): Promise<PriceData> {
  return agent.get('https://api.gemini.com/v1/pubticker/ethusd')
    .then(({ body }) => [parseFloat(body.volume.ETH), parseFloat(body.last)]);
}

export function gdax(): Promise<PriceData> {
  return agent.get('https://api.gdax.com/products/ETH-USD/ticker')
    .then(({ body }) => [parseFloat(body.volume), parseFloat(body.price)]);
}

export function bitfinex(): Promise<PriceData> {
  return agent.get('https://api.bitfinex.com/v1/pubticker/ethusd')
    .then(({ body }) => [parseFloat(body.volume), parseFloat(body.last_price)]);
}

export function kraken(): Promise<PriceData> {
  return agent.get('https://api.kraken.com/0/public/Ticker?pair=ETHUSD')
    .then(({ body }) => [
      parseFloat(body.result.XETHZUSD.v[1]),
      parseFloat(body.result.XETHZUSD.c[0]),
    ]);
}

export async function filterErrors(...functions): Promise<any[]> {
  const results = await Promise.all(functions.map(fn => retry(fn)));

  return results.filter(identity);
}

export function getPriceData(): Promise<PriceData[]> {
  return filterErrors(gemini, gdax, bitfinex, kraken);
}

export function getDotProduct(prices: PriceData[]): number {
  return prices.reduce((acc, val) => acc + (val[0] * val[1]), 0);
}

export function getWeight(prices: PriceData[]): number {
  return prices.reduce((acc, val) => acc + val[0], 0);
}

export async function getRate(): Promise<number> {
  const prices = await getPriceData();
  if (prices.length === 0) {
    throw new Error('unable to fetch any price data from exchanges!');
  }

  logger.debug('Raw data:', JSON.stringify(prices));

  return getDotProduct(prices) / getWeight(prices);
}
