import * as logger from 'winston';
import {
  web3, promisify, gasPriceHistoryAsync,
  sendTransactionAsync, getGasPrice, waitUntilMined, getHttpProvider,
} from '../src/patchedWeb3';
const mockData = require('./data/parityData.json');

describe('Patched Web3', () => {
  describe('monkey patches', () => {
    it('should have parity gasprice histogram', () => {
      expect(web3.parity.gasPriceHistory).toEqual(
        jasmine.any(Function));
    });
  });

  describe('promisify', () => {
    it('should wrap callback function with promise', async () => {
      const fn = (foo, bar, callback) => callback(undefined, bar);
      const wrappedFn = promisify(fn);

      const result = await wrappedFn(1, 2);
      expect(result).toBe(2);
    });

    it('should reject when first parameter is error', async () => {
      const fn = (foo, callback) => callback(new Error(foo));
      const wrappedFn = promisify(fn);

      try {
        await wrappedFn('baz');
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('baz');
      }
    });
  });

  describe('getGasPrice', () => {
    it('should return 70th percentile gas price', async () => {
      const mockProvider = {
        send: () => null,
        sendAsync: (payload, callback) => callback(null, mockData),
      };
      web3.setProvider(mockProvider);

      const result = await getGasPrice();

      expect(result).toBe(97780000006);
    });

    afterEach(() => {
      web3.setProvider(undefined);
    });
  });

  describe('waitUntilMined', () => {
    it('should reject if filter returns error', async () => {
      const stopWatchingSpy = jasmine.createSpy('stopWatching');
      spyOn(web3.eth, 'filter').and.returnValue({
        watch: callback => callback(new Error('foo')),
        stopWatching: stopWatchingSpy,
      });

      try {
        await waitUntilMined('bar');
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('foo');
        expect(stopWatchingSpy).toHaveBeenCalled();
      }
    });

    it('should reject if fetching transaction receipt fails', async () => {
      const stopWatchingSpy = jasmine.createSpy('stopWatching');
      spyOn(web3.eth, 'filter').and.returnValue({
        watch: callback => callback(),
        stopWatching: stopWatchingSpy,
      });

      spyOn(web3.eth, 'getTransactionReceipt').and.callFake((txid, callback) => {
        callback(new Error('baz'));
      });

      try {
        await waitUntilMined('bar');
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('baz');
        expect(stopWatchingSpy).toHaveBeenCalled();
      }
    });

    it('should reject if tx did not result in any log entries', async () => {
      const stopWatchingSpy = jasmine.createSpy('stopWatching');
      spyOn(web3.eth, 'filter').and.returnValue({
        watch: callback => callback(),
        stopWatching: stopWatchingSpy,
      });

      const receipt = {
        logs: [],
      };

      spyOn(web3.eth, 'getTransactionReceipt').and.callFake((txid, callback) => {
        callback(undefined, receipt);
      });

      try {
        await waitUntilMined('bar');
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('Update failed');
        expect(stopWatchingSpy).toHaveBeenCalled();
      }
    });

    it('should return receipt on success', async () => {
      const stopWatchingSpy = jasmine.createSpy('stopWatching');
      spyOn(web3.eth, 'filter').and.returnValue({
        watch: callback => callback(),
        stopWatching: stopWatchingSpy,
      });

      const receipt = {
        transactionHash: '0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238',
        transactionIndex: 1,
        blockNumber: 12414,
        blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
        cumulativeGasUsed: 123456,
        gasUsed: 1113,
        contractAddress: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
        logs: [{
          logIndex: 1,
          blockNumber: 12414,
          blockHash: '0x8216c5785ac562ff41e2dcfdf5785ac562ff41e2dcfdf829c5a142f1fccd7d',
          transactionHash: '0xdf829c5a142f1fccd7d8216c5785ac562ff41e2dcfdf5785ac562ff41e2dcf',
          transactionIndex: 0,
          address: '0x16c5785ac562ff41e2dcfdf829c5a142f1fccd7d',
          data: '0x0000000000000000000000000000000000000000000000000000000000000000',
          topics: ['0x59ebeb90bc63057b6515673c3ecf9438e5058bca0f92585014eced636878c9a5'],
        }],
      };

      spyOn(web3.eth, 'getTransactionReceipt').and.callFake((txid, callback) => {
        callback(undefined, receipt);
      });

      const result = await waitUntilMined('bar');
      expect(result).toEqual(receipt);
      expect(stopWatchingSpy).toHaveBeenCalled();
    });
  });
});
