export interface LevelUser {
    xp: number;
    level: number;
    leftServer?: boolean;
}

export interface FullLevelUser extends LevelUser {
    id: string;
}
