export interface EconomyUser {
    balance: number;
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
