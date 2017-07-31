import * as agent from 'superagent';
import * as MarketData from '../src/marketData';
import * as logger from 'winston';
const mockData = require('./data/marketData.json');

describe('MarketData', () => {
  describe('gemini', () => {
    it('should make get request to gemini', async () => {
      superAgentspy(mockData.gemini);

      const result = await MarketData.gemini();

      expect(result).toEqual([239180.16170535, 200.54]);
      expect(agent.get).toHaveBeenCalledWith(
        'https://api.gemini.com/v1/pubticker/ethusd');
    });
  });

  describe('gdax', () => {
    it('should get volume, price and convert to numbers', async () => {
      superAgentspy(mockData.gdax);

      const result = await MarketData.gdax();

      expect(result[0]).toBe(357403.99540574);
      expect(result[1]).toBe(200.26);
    });
  });

  describe('bitfinex', () => {
    it('should get volume, price and convert to numbers', async () => {
      superAgentspy(mockData.bitfinex);

      const result = await MarketData.bitfinex();

      expect(result[0]).toBe(305417.86949845);
      expect(result[1]).toBe(198.17);
    });
  });

  describe('kraken', () => {
    it('should get volume, price and convert to numbers', async () => {
      superAgentspy(mockData.kraken);

      const result = await MarketData.kraken();

      expect(result[0]).toBe(166726.78509865);
      expect(result[1]).toBe(200.99950);
    });
  });

  describe('filterErrors', () => {
    beforeEach(() => {
      spyOn(logger, 'info');
      spyOn(logger, 'warn');
    });

    it('should return values from functions that were successful', async () => {
      const fn1 = () => Promise.resolve(1);
      const fn2 = () => Promise.reject(2);
      const fn3 = () => Promise.resolve(3);

      const result = await MarketData.filterErrors(fn1, fn2, fn3);

      expect(result).toEqual([1, 3]);
    });

    it('should return empty array if all functions failed', async () => {
      const fn1 = () => Promise.reject(1);

      const result = await MarketData.filterErrors(fn1);

      expect(result).toEqual([]);
    });
  });

  describe('getDotProduct', () => {
    it('should return the weighted sum of given values', () => {
      const data = [[2, 3], [5, 7]];

      expect(MarketData.getDotProduct(data)).toEqual(41);
    });
  });

  describe('getWeight', () => {
    it('should return the sum of first value in each subarray', () => {
      const data = [[2, 3], [5, 7]];
      expect(MarketData.getWeight(data)).toEqual(7);
    });
  });

  describe('getRateInCents', () => {
    it('should return rate in cents', async () => {
      spyOn(logger, 'debug');
      spyOn(agent, 'get').and.returnValues(
        Promise.resolve({ body: mockData.gemini }),
        Promise.resolve({ body: mockData.gdax }),
        Promise.resolve({ body: mockData.bitfinex }),
        Promise.resolve({ body: mockData.kraken }));

      const price = await MarketData.getRateInCents();
      expect(price).toBe(19984);
    });
  });

  describe('getRate', () => {
    it('should throw error if no prices can be retrieved', async () => {
      spyOn(logger, 'info');
      spyOn(logger, 'warn');
      spyOn(agent, 'get').and.returnValue(Promise.reject(new Error('foo')));

      try {
        await MarketData.getRate();
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual(
          'unable to fetch any price data from exchanges!');
      }
    });

    it('should calculate price', async () => {
      spyOn(logger, 'debug');
      spyOn(agent, 'get').and.returnValues(
        Promise.resolve({ body: mockData.gemini }),
        Promise.resolve({ body: mockData.gdax }),
        Promise.resolve({ body: mockData.bitfinex }),
        Promise.resolve({ body: mockData.kraken }));

      const price = await MarketData.getRate();

      expect(price).toBe(199.84075571699273);
      expect(logger.debug).toHaveBeenCalledWith('Raw data:', JSON.stringify([
        [239180.16170535, 200.54],
        [357403.99540574, 200.26],
        [305417.86949845, 198.17],
        [166726.78509865, 200.9995],
      ]));
    });
  });
});


function superAgentspy(returnValue) {
  spyOn(agent, 'get').and.returnValue(Promise.resolve({
    body: returnValue,
  }));
}
