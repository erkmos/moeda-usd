import * as utils from './utils';
import { getRate } from './marketData';
import {
  TransactionReceipt, waitUntilMined, getGasPrice,
  sendTransactionAsync, web3, getHttpProvider,
} from './patchedWeb3';

const METHOD_ID = web3.sha3('updateRate(uint256)').slice(0, 10);

let contractAddress;
let ownerAddress;
let password;

// configurable constants
const GAS_COST = 50000;
const TIME_BETWEEN_UPDATES = 2 * 60 * 60 * 1000;
const SMOOTHING_FACTOR = 0.85;
const POLLING_DELAY = 3500;

// number of values to collect before sending first update
const CONVERGENCE_THRESHOLD = 100;

async function sendPriceUpdate(price): Promise<TransactionReceipt | Error> {
  const gasPrice = await getGasPrice();
  const cost = GAS_COST * gasPrice;
  console.log(`Sending price update: ${price} cost: ${web3.fromWei(cost)} ETH`);
  const options = {
    gasPrice,
    to: contractAddress,
    from: ownerAddress,
    gas: GAS_COST,
    data: `${METHOD_ID}${utils.pad(price)}`,
  };

  const txid = await sendTransactionAsync(options, password);
  return waitUntilMined(txid);
}

export function timeElapsedSince(lastUpdate: number): number {
  return (new Date()).getTime() - lastUpdate;
}

export function timeToUpdate(lastUpdate: number): boolean {
  return timeElapsedSince(lastUpdate) > TIME_BETWEEN_UPDATES;
}

export function hasConverged(valueCount: number): boolean {
  return valueCount > CONVERGENCE_THRESHOLD;
}

export function logLine(lastUpdate: number, numValues: number, price: number): void {
  if (hasConverged(numValues)) {
    const timeLeft = Math.max(
      TIME_BETWEEN_UPDATES - timeElapsedSince(lastUpdate), 0);
    console.log(
      'Calculated price:', utils.centsToUSD(price),
      'next update in:', timeLeft / 1000, 'sec');
  } else {
    const timeLeft = (POLLING_DELAY / 1000) * (CONVERGENCE_THRESHOLD - numValues);
    console.log(
      'Calculated price:', utils.centsToUSD(price),
      'first update in', timeLeft, 'sec');
  }
}

export interface Config {
  CONTRACT_ADDRESS: string;
  OWNER_ADDRESS: string;
  ACCOUNT_PASSWORD: string;
}

export function getConfig(): Config {
  const config = {
    CONTRACT_ADDRESS: '',
    OWNER_ADDRESS: '',
    ACCOUNT_PASSWORD: '',
  };

  Object.keys(config).forEach((key) => {
    if (process.env[key] === undefined) {
      throw new Error(`${key} is missing in environment`);
    }

    config[key] = process.env[key];
  });

  return config;
}

function init() {
  const config = getConfig();
  contractAddress = config.CONTRACT_ADDRESS;
  ownerAddress = config.OWNER_ADDRESS;
  password = config.ACCOUNT_PASSWORD;

  web3.setProvider(getHttpProvider('http://localhost:8545'));
}

async function main(): Promise<any> {
  let prod = 0;
  let weight = 0;
  let numValues = 0;
  let price = 0;
  let lastUpdate = 0;

  while (true) {
    [prod, weight, price] = await getRate(prod, weight, SMOOTHING_FACTOR);
    price = utils.toCents(price);
    numValues += 1;

    logLine(lastUpdate, numValues, price);

    if (timeToUpdate(lastUpdate) && hasConverged(numValues)) {
      utils.retry(sendPriceUpdate, price);
      lastUpdate = new Date().getTime();
    }
    await utils.delay(POLLING_DELAY);
  }
}

init();

main().catch((error) => {
  console.error(error.message);
});
