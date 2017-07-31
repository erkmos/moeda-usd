import * as eth from './patchedWeb3';
export declare function buildTransaction(config: Config, price: any): Promise<{
    gasPrice: any;
    to: string;
    from: string;
    gas: number;
    data: string;
}>;
export declare function getErrorMessage(error: any): string;
export declare function sendPriceUpdate(config: Config, price: number): Promise<eth.TransactionReceipt | void>;
export interface Config {
    CONTRACT_ADDRESS: string;
    OWNER_ADDRESS: string;
    ACCOUNT_PASSWORD: string;
}
export declare function getConfig(): Config;
export declare function main(runOnce?: boolean): Promise<any>;
