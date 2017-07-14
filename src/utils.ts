import * as Web3 from 'web3';
import * as logger from 'winston';

const web3 = new Web3();

export function delay(waitTime: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, waitTime);
  });
}

export function identity(value: any): any {
  return value;
}

export async function retry(fn: Function, ...args: any[]): Promise<any> {
  let retries = 0;

  while (retries < 3) {
    try {
      return await fn(...args);
    } catch (error) {
      logger.warn(error.message);
      logger.info('retrying...');
      retries += 1;
    }
  }

  return null;
}

export function pad(num: number): string {
  return web3._extend.utils.padLeft(web3.toHex(num).slice(2), 64);
}

export function toCents(price: number): number {
  return Math.floor(price * 100);
}

export function centsToUSD(price: number): string {
  return `$${(price / 100).toFixed(2)}`;
}
