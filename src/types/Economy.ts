export interface EconomyUser {
    balance: number;
    transactions: PupeeTransaction[];
}

export interface PupeeTransaction {
    from: EconomyUser;
    amount: number;
    to: EconomyUser;
}
