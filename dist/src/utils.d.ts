export declare function delay(waitTime: number): Promise<void>;
export declare function identity(value: any): any;
export declare function retry(fn: Function, ...args: any[]): Promise<any>;
export declare function pad(num: number): string;
export declare function toCents(price: number): number;
export declare function centsToUSD(price: number): string;
