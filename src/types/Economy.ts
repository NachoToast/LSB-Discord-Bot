export interface EconomyUser {
    balance: number;
    lifetimeEarnings: number;
    transactions: PupeeTransaction[];
    lowestEverBalance: {
        amount: number;
        achieved: number;
    };
    highestEverBalance: {
        amount: number;
        achieved: number;
    };
    leftServer: boolean;

    miningStats: {
        timesMined: number;
        nasaBonuses: number;
        hourBonuses: number;
        elonBonuses: number;
        totalGainedFromMining: number;
    };

    slotsStats: {
        timesGambled: number;
        amountGambled: number;
        timesWon: number;
        amountWon: number;
    };
}

export interface PupeeTransaction {
    /** The user ID of the giver. */
    fromID: string;
    amount: number;
    /** The user ID of the receiver. */
    toID: string;
    timestamp: number;
}

export enum ActionCooldownTypes {
    mine,
}

export interface Pot {
    amount: number;
    attempts: number;
    createdAt: number;
}
