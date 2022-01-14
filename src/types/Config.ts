export default interface Config {
    prefixes: string[];
    economy: {
        initialBalance: number;
        maxTransactionsRecorded: number;
        mine: {
            cooldown_seconds: number;
            min_yield: number;
            max_yield: number; // exclusive
        };
    };
}
