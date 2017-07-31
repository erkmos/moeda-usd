export declare const web3: any;
export interface FilterLog {
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
export declare function promisify(fn: Function): (...args: any[]) => Promise<any>;
export declare const gasPriceHistoryAsync: (...args: any[]) => Promise<any>;
export declare const sendTransactionAsync: (...args: any[]) => Promise<any>;
export declare function getGasPrice(): Promise<any>;
export declare function waitUntilMined(txid: any): Promise<TransactionReceipt>;
export declare function getHttpProvider(url: any): any;
