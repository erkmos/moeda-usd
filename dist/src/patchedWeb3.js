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
const PERCENTILE = 0.7;
exports.web3 = new Web3();
exports.web3._extend({
    property: 'parity',
    methods: [
        new exports.web3._extend.Method({
            name: 'gasPriceHistory',
            call: 'parity_gasPriceHistogram',
            params: 0,
            outputFormatter: formatter,
        }),
    ],
});
function promisify(fn) {
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
exports.promisify = promisify;
function formatter(data) {
    data.bucketBounds = data.bucketBounds.map(exports.web3._extend.utils.toDecimal);
    const length = data.counts.length;
    return data.counts.map((value, index) => {
        let bucketEnd = data.bucketBounds[index + 1] - 1;
        if (index === length - 1) {
            bucketEnd = data.bucketBounds[index + 1];
        }
        return [value, data.bucketBounds[index], bucketEnd];
    });
}
exports.gasPriceHistoryAsync = promisify(exports.web3.parity.gasPriceHistory);
exports.sendTransactionAsync = promisify(exports.web3.personal.sendTransaction);
function getGasPrice() {
    return __awaiter(this, void 0, void 0, function* () {
        const history = yield exports.gasPriceHistoryAsync();
        return history.map((val) => {
            const bucketMedian = Math.floor((val[1] + val[2]) / 2);
            return bucketMedian;
        })[Math.floor((history.length - 1) * PERCENTILE)];
    });
}
exports.getGasPrice = getGasPrice;
function waitUntilMined(txid) {
    const filter = exports.web3.eth.filter('latest');
    return new Promise((resolve, reject) => {
        filter.watch((error) => {
            if (error) {
                filter.stopWatching();
                return reject(error);
            }
            exports.web3.eth.getTransactionReceipt(txid, (innerError, receipt) => {
                if (innerError) {
                    filter.stopWatching();
                    return reject(innerError);
                }
                if (!receipt) {
                    return;
                }
                filter.stopWatching();
                if (receipt.logs.length > 0) {
                    return resolve(receipt);
                }
                return reject(new Error('Update failed'));
            });
        });
    });
}
exports.waitUntilMined = waitUntilMined;
function getHttpProvider(url) {
    return new Web3.providers.HttpProvider(url);
}
exports.getHttpProvider = getHttpProvider;
//# sourceMappingURL=patchedWeb3.js.map