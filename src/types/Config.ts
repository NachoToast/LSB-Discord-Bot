export default interface Config {
    prefixes: string[];
    allowAnyoneToSeeConfig: boolean;
    economy: {
        initialBalance: number;
        maxTransactionsRecorded: number;
        mine: {
            cooldown_seconds: number;
            min_yield: number;
            max_yield: number; // exclusive
            elonBonus: number; // 0 to 100 (inclusive)
            nasaBonus: boolean;
            hourBonus: boolean;
            dayBonus: boolean;
        };
        slots: {
            initialPot: number;
        };
    };
}
