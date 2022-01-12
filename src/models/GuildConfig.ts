/** Every "level past" includes that level as well. */
export enum LevelUpThresholds {
    everyLevel = 'every level',
    every5thLevel = 'every 5 levels',
    every10thLevel = 'every 10 levels',
    everyLevelPast10 = 'every level past 10',
    everyLevelPast20 = 'every level past 20 (default)',
    everyLevelPast30 = 'every level past 30',
    none = 'no levels',
}

export default interface GuildConfig {
    levelUpChannel: string | null;
    levelUpMessage: LevelUpThresholds;
}
