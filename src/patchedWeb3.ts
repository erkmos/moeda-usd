import * as Web3 from 'web3';

// what percentile of previous transaction's gas price to target
const PERCENTILE = 0.7;
export const web3 = new Web3();

interface FilterLog {
  logIndex: number;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  address: string;
  data: string;
  topics?: string[];
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockNumber: number;
  blockHash: string;
  cumulativeGasUsed: number;
  gasUsed: number;
  contractAddress?: string;
  logs: FilterLog[];
}

web3._extend({
  property: 'parity',
  methods: [
    new web3._extend.Method({
      name: 'gasPriceHistory',
      call: 'parity_gasPriceHistogram',
      params: 0,
      outputFormatter: formatter,
    }),
  ],
});

export function promisify(fn: Function): (...args: any[]) => Promise<any> {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      });
    });
  };
}

function formatter(data): number[] {
  data.bucketBounds = data.bucketBounds.map(web3._extend.utils.toDecimal);
  const length = data.counts.length;
  return data.counts.map((value, index) => {
    let bucketEnd = data.bucketBounds[index + 1] - 1;
    if (index === length - 1) {
      bucketEnd = data.bucketBounds[index + 1];
    }
    return [value, data.bucketBounds[index], bucketEnd];
  });
}

export const gasPriceHistoryAsync = promisify(web3.parity.gasPriceHistory);
export const sendTransactionAsync = promisify(web3.personal.sendTransaction);

// guesstimate gas price based on pricing history from parity
export async function getGasPrice() {
  const history = await gasPriceHistoryAsync();

  return history.map((val) => {
    const bucketMedian = Math.floor((val[1] + val[2]) / 2);
    return bucketMedian;
  })[Math.floor((history.length - 1) * PERCENTILE)];
}

export function waitUntilMined(txid): Promise<TransactionReceipt | Error> {
  const filter = web3.eth.filter('latest');
  return new Promise((resolve, reject) => {
    filter.watch((error) => { // triggered for every new block
      if (error) {
        filter.stopWatching();
        return reject(error);
      }

      web3.eth.getTransactionReceipt(txid, (innerError, receipt) => {
        if (innerError) {
          filter.stopWatching();
          return reject(innerError);
        }

        if (!receipt) { // not mined yet
          return;
        }

        filter.stopWatching();
        if (receipt.logs.length > 0) {
          console.log('Update sent successfully');
          return resolve(receipt);
        }

        return reject(new Error('Update failed'));
      });
    });
  });
}

export function getHttpProvider(url) {
  return new Web3.providers.HttpProvider(url);
}
