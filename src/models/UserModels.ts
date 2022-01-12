export interface EconomyUser {
    balance: number;
}

export interface LevelUser {
    xp: number;
    level: number;
}

export interface FullLevelUser extends LevelUser {
    id: string;
}