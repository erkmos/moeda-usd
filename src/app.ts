import * as utils from './utils';
import * as marketData from './marketData';
import * as eth from './patchedWeb3';
import * as logger from 'winston';
import {
  GAS_COST, TIME_BETWEEN_UPDATES, POLLING_DELAY,
} from './constants';

const METHOD_ID = eth.web3.sha3('updateRate(uint256)').slice(0, 10);

export async function buildTransaction(config: Config, price) {
  const gasPrice = await eth.getGasPrice();
  return {
    gasPrice,
    to: config.CONTRACT_ADDRESS,
    from: config.OWNER_ADDRESS,
    gas: GAS_COST,
    data: `${METHOD_ID}${utils.pad(price)}`,
  };
}

export function getErrorMessage(error: any): string {
  if (error && error.message) {
    return error.message;
  }

  return error;
}

export async function sendPriceUpdate(
  config: Config, price: number,
): Promise<eth.TransactionReceipt | void> {
  const transaction = await buildTransaction(config, price);
  const cost = transaction.gas * transaction.gasPrice;

  logger.info(
    `Sending price update: ${utils.centsToUSD(price)}`,
    `cost: ${eth.web3.fromWei(cost)} ETH...`);

  try {
    const txid = await eth.sendTransactionAsync(
      transaction, config.ACCOUNT_PASSWORD);
    const receipt = await eth.waitUntilMined(txid);
    logger.info(
      `Update to ${utils.centsToUSD(price)} ` +
      `in tx: ${receipt.transactionHash} was successful.`);
    return receipt;
  } catch (error) {
    logger.error(getErrorMessage(error));
    return undefined;
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
  eth.web3.setProvider(eth.getHttpProvider('http://localhost:8545'));
  logger.add(
    logger.transports.File, { filename: 'moeda-usd.log', level: 'debug' });
}

export async function main(runOnce = false): Promise<any> {
  init();

  const config = getConfig();

  while (true) {
    const price = utils.toCents(await marketData.getRate());
    await utils.retry(sendPriceUpdate, config, price);
    logger.info(`Next update in ${TIME_BETWEEN_UPDATES / 1000} sec`);

    if (runOnce) {
      break;
    }

    await utils.delay(TIME_BETWEEN_UPDATES);
  }
}
