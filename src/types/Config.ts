export default interface Config {
    prefixes: string[];
    economy: {
        initialBalance: number;
        maxTransactionsRecorded: number;
    };
}
