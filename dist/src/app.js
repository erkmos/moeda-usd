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
const utils = require("./utils");
const marketData = require("./marketData");
const eth = require("./patchedWeb3");
const logger = require("winston");
const constants_1 = require("./constants");
const METHOD_ID = eth.web3.sha3('updateRate(uint256)').slice(0, 10);
function buildTransaction(config, price) {
    return __awaiter(this, void 0, void 0, function* () {
        const gasPrice = yield eth.getGasPrice();
        return {
            gasPrice,
            to: config.CONTRACT_ADDRESS,
            from: config.OWNER_ADDRESS,
            gas: constants_1.GAS_COST,
            data: `${METHOD_ID}${utils.pad(price)}`,
        };
    });
}
exports.buildTransaction = buildTransaction;
function getErrorMessage(error) {
    if (error && error.message) {
        return error.message;
    }
    return error;
}
exports.getErrorMessage = getErrorMessage;
function sendPriceUpdate(config, price) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = yield buildTransaction(config, price);
        const cost = transaction.gas * transaction.gasPrice;
        logger.info(`Sending price update: ${utils.centsToUSD(price)}`, `cost: ${eth.web3.fromWei(cost)} ETH...`);
        try {
            const txid = yield eth.sendTransactionAsync(transaction, config.ACCOUNT_PASSWORD);
            const receipt = yield eth.waitUntilMined(txid);
            logger.info(`Update to ${utils.centsToUSD(price)} ` +
                `in tx: ${receipt.transactionHash} was successful.`);
            return receipt;
        }
        catch (error) {
            logger.error(getErrorMessage(error));
            return undefined;
        }
    });
}
exports.sendPriceUpdate = sendPriceUpdate;
function getConfig() {
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
exports.getConfig = getConfig;
function init() {
    eth.web3.setProvider(eth.getHttpProvider('http://localhost:8545'));
    logger.add(new logger.transports.File({ filename: 'moeda-usd.log', level: 'debug' }));
}
function main(runOnce = false) {
    return __awaiter(this, void 0, void 0, function* () {
        init();
        const config = getConfig();
        while (true) {
            const price = utils.toCents(yield marketData.getRate());
            yield utils.retry(sendPriceUpdate, config, price);
            logger.info(`Next update in ${constants_1.TIME_BETWEEN_UPDATES / 1000} sec`);
            if (runOnce) {
                break;
            }
            yield utils.delay(constants_1.TIME_BETWEEN_UPDATES);
        }
    });
}
exports.main = main;
//# sourceMappingURL=app.js.map