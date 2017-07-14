import * as logger from 'winston';
import * as utils from '../src/utils';

describe('utils', () => {
  describe('delay', () => {
    it('should resolve after given time', (done) => {
      const before = new Date().getTime();
      const waitTime = 30;
      jasmine.clock().install();

      utils.delay(waitTime).then(() => {
        done();
        jasmine.clock().uninstall();
      });
      jasmine.clock().tick(waitTime + 1);
    });
  });

  describe('identity', () => {
    it('should return its argument unmodified', () => {
      const data = { foo: 2 };
      expect(utils.identity(data)).toBe(data);
    });
  });

  describe('retry', () => {
    it('should retry up to 3 times on failure', async () => {
      spyOn(logger, 'info');
      spyOn(logger, 'warn');
      const willFail = () => Promise.reject(new Error('foo'));

      const ret = await utils.retry(willFail);

      expect(logger.info).toHaveBeenCalledTimes(3);
      expect(ret).toBe(null);
    });

    it('should pass arguments', async () => {
      const willCall = jasmine.createSpy('willCall');

      await utils.retry(willCall, 'foo', 'bar');

      expect(willCall).toHaveBeenCalledWith('foo', 'bar');
    });

    it('should return function return value', async () => {
      const fn = () => 'foo';
      const ret = await utils.retry(fn);

      expect(ret).toEqual('foo');
    });
  });

  describe('pad', () => {
    it('should convert number to hex and pad it to 64 bytes', () => {
      expect(utils.pad(123)).toBe(
        '000000000000000000000000000000000000000000000000000000000000007b');
    });
  });

  describe('toCents', () => {
    it('should convert number to cents', () => {
      expect(utils.toCents(123.15)).toBe(12315);
    });
  });

  describe('centsToUsd', () => {
    it('should convert number in cents to USD string', () => {
      expect(utils.centsToUSD(12345)).toEqual('$123.45');
    });
  });
});
