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
const agent = require("superagent");
const utils_1 = require("./utils");
const logger = require("winston");
function gemini() {
    return agent.get('https://api.gemini.com/v1/pubticker/ethusd')
        .then(({ body }) => [parseFloat(body.volume.ETH), parseFloat(body.last)]);
}
exports.gemini = gemini;
function gdax() {
    return agent.get('https://api.gdax.com/products/ETH-USD/ticker')
        .then(({ body }) => [parseFloat(body.volume), parseFloat(body.price)]);
}
exports.gdax = gdax;
function bitfinex() {
    return agent.get('https://api.bitfinex.com/v1/pubticker/ethusd')
        .then(({ body }) => [parseFloat(body.volume), parseFloat(body.last_price)]);
}
exports.bitfinex = bitfinex;
function kraken() {
    return agent.get('https://api.kraken.com/0/public/Ticker?pair=ETHUSD')
        .then(({ body }) => [
        parseFloat(body.result.XETHZUSD.v[1]),
        parseFloat(body.result.XETHZUSD.c[0]),
    ]);
}
exports.kraken = kraken;
function filterErrors(...functions) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield Promise.all(functions.map(fn => utils_1.retry(fn)));
        return results.filter(utils_1.identity);
    });
}
exports.filterErrors = filterErrors;
function getPriceData() {
    return filterErrors(gemini, gdax, bitfinex, kraken);
}
exports.getPriceData = getPriceData;
function getDotProduct(prices) {
    return prices.reduce((acc, val) => acc + (val[0] * val[1]), 0);
}
exports.getDotProduct = getDotProduct;
function getWeight(prices) {
    return prices.reduce((acc, val) => acc + val[0], 0);
}
exports.getWeight = getWeight;
function getRateInCents() {
    return __awaiter(this, void 0, void 0, function* () {
        const rate = yield getRate();
        return utils_1.toCents(rate);
    });
}
exports.getRateInCents = getRateInCents;
function getRate() {
    return __awaiter(this, void 0, void 0, function* () {
        const prices = yield getPriceData();
        if (prices.length === 0) {
            throw new Error('unable to fetch any price data from exchanges!');
        }
        logger.debug('Raw data:', JSON.stringify(prices));
        return getDotProduct(prices) / getWeight(prices);
    });
}
exports.getRate = getRate;
//# sourceMappingURL=marketData.js.map