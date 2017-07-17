import * as logger from 'winston';
import {
  getErrorMessage, sendPriceUpdate, buildTransaction, getConfig, main,
} from '../src/app';
import * as eth from '../src/patchedWeb3';
import * as marketData from '../src/marketData';
import { GAS_COST, TIME_BETWEEN_UPDATES } from '../src/constants';
const gasPriceData = require('./data/parityData.json');
const mockConfig = require('./data/config.json');

describe('main', () => {
  describe('buildTransaction', () => {
    beforeEach(async () => {
      const mockProvider = {
        send: () => null,
        sendAsync: () => gasPriceData,
      };
      eth.web3.setProvider(mockProvider);
    });

    afterEach(() => {
      eth.web3.setProvider(undefined);
    });

    it('should set gas and gas price', async () => {
      const transaction = await buildTransaction(mockConfig, 12345);
      expect(transaction.gas).toBe(GAS_COST);
      expect(transaction.gasPrice).toEqual(82860000005);
    });

    it('should set sender, destination', async () => {
      const transaction = await buildTransaction(mockConfig, 12345);

      expect(transaction.from).toBe(mockConfig.OWNER_ADDRESS);
      expect(transaction.to).toBe(mockConfig.CONTRACT_ADDRESS);
    });

    it('should set data', async () => {
      const transaction = await buildTransaction(mockConfig, 12345);

      expect(transaction.data).toBe(
        '0x69ea17710000000000000000000000000000000000' +
        '000000000000000000000000003039');
    });
  });

  describe('getErrorMessage', () => {
    it('should return message property if it exists', () => {
      expect(getErrorMessage(new Error('foo'))).toEqual('foo');
    });

    it('should return message', () => {
      expect(getErrorMessage('bar')).toEqual('bar');
    });
  });

  describe('sendPriceUpdate', () => {
    beforeEach(async () => {
      spyOn(eth, 'getGasPrice').and.returnValue(Promise.resolve(123));
    });

    it('should log metadata on success', async () => {
      const mockFilter = {
        stopWatching: jasmine.createSpy('stopWatching'),
        watch: callback => callback(),
      };
      const fakeReceipt = {
        transactionHash: '0x123',
        transactionIndex: 1,
        blockNumber: 12414,
        blockHash: '0xabc',
        cumulativeGasUsed: 123456,
        gasUsed: 1113,
        contractAddress: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
        logs: [{
          logIndex: 1,
          blockNumber: 12414,
          blockHash: '0xcdf',
          transactionHash: '0xfff',
          transactionIndex: 0,
          address: '0x16c5785ac562ff41e2dcfdf829c5a142f1fccd7d',
          data: '0x0',
          topics: ['0xacbdfe'],
        }],
      };

      spyOn(eth, 'waitUntilMined').and.returnValue(
        Promise.resolve(fakeReceipt));
      spyOn(eth, 'sendTransactionAsync').and.returnValue(Promise.resolve());
      spyOn(logger, 'info');

      const receipt = await sendPriceUpdate(mockConfig, 12345);

      expect(receipt).toEqual(fakeReceipt);
      expect(logger.info['calls'].argsFor(0)).toEqual([
        'Sending price update: $123.45',
        'cost: 0.000000000004305 ETH...']);
      expect(logger.info['calls'].argsFor(1)[0]).toEqual(
        'Update to $123.45 in tx: 0x123 was successful.');
    });

    it('should log error on failure', async () => {
      spyOn(eth, 'sendTransactionAsync').and.returnValue(
        Promise.reject(new Error('foo')));
      spyOn(logger, 'info');
      spyOn(logger, 'error');

      await sendPriceUpdate(mockConfig, 12345);

      expect(logger.error).toHaveBeenCalledWith('foo');
    });
  });

  describe('getConfig', () => {
    it('should read config from environment', () => {
      Object.assign(process.env, mockConfig);
      expect(getConfig()).toEqual(mockConfig);
      delete process.env.CONTRACT_ADDRESS;
      delete process.env.OWNER_ADDRESS;
      delete process.env.ACCOUNT_PASSWORD;
    });

    it('should throw error if any environment variable is unset', () => {
      try {
        getConfig();
      } catch (error) {
        expect(error.message).toEqual(
          'CONTRACT_ADDRESS is missing in environment');
      }
    });
  });

  describe('main', () => {
    it('should call init and get config', async () => {
      spyOn(logger, 'add');
      spyOn(eth.web3, 'setProvider');
      spyOn(marketData, 'getRate').and.returnValue(Promise.resolve(123));

      try {
        await main(true);
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual(
          'CONTRACT_ADDRESS is missing in environment');
      }

      expect(marketData.getRate).not.toHaveBeenCalled();
      expect(eth.web3.setProvider).toHaveBeenCalled();
      expect(logger.add).toHaveBeenCalledWith(
        logger.transports.File, { filename: 'moeda-usd.log', level: 'debug' });
    });

    it('should poll price', async () => {
      Object.assign(process.env, mockConfig);
      spyOn(logger, 'add');
      spyOn(logger, 'info');
      spyOn(eth.web3, 'setProvider');
      spyOn(eth, 'getGasPrice').and.returnValue(Promise.resolve());
      spyOn(eth, 'sendTransactionAsync').and.returnValue(Promise.resolve());
      spyOn(eth, 'waitUntilMined').and.returnValue(Promise.resolve({
        transactionHash: '123' }));
      spyOn(marketData, 'getRate').and.returnValue(Promise.resolve(123));

      await main(true);

      expect(marketData.getRate).toHaveBeenCalled();
      delete process.env.CONTRACT_ADDRESS;
      delete process.env.OWNER_ADDRESS;
      delete process.env.ACCOUNT_PASSWORD;
    });
  });
});
