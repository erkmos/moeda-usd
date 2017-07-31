"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Web3 = require("web3");
const logger = require("winston");
const web3 = new Web3();
function delay(waitTime) {
    return new Promise((resolve) => {
        setTimeout(resolve, waitTime);
    });
}
exports.delay = delay;
function identity(value) {
    return value;
}
exports.identity = identity;
function retry(fn, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        let retries = 0;
        while (retries < 3) {
            try {
                return yield fn(...args);
            }
            catch (error) {
                logger.warn(error.message);
                logger.info('retrying...');
                retries += 1;
            }
        }
        return null;
    });
}
exports.retry = retry;
function pad(num) {
    return web3._extend.utils.padLeft(web3.toHex(num).slice(2), 64);
}
exports.pad = pad;
function toCents(price) {
    return Math.floor(price * 100);
}
exports.toCents = toCents;
function centsToUSD(price) {
    return `$${(price / 100).toFixed(2)}`;
}
exports.centsToUSD = centsToUSD;
//# sourceMappingURL=utils.js.map