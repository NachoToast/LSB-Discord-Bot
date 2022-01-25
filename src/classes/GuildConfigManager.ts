import GuildConfig, { LevelUpThresholds } from '../types/GuildConfig';
import DataManager from './DataManager';

export default class GuildConfigManager {
    private _guildConfigData: { [guildID: string]: GuildConfig };
    private _guildConfigDataManager: DataManager;

    public constructor() {
        this._guildConfigDataManager = new DataManager(
            'data/guildConfig/guilds.json',
            JSON.stringify({}, undefined, 4),
        );
        this._guildConfigData = JSON.parse(this._guildConfigDataManager.data);
    }

    private get _defaultConfig(): GuildConfig {
        const config: GuildConfig = {
            levelUpChannel: null,
            levelUpMessage: LevelUpThresholds.everyLevelPast20,
            gamblingChannel: null,
            miningChannels: null,
        };
        return config;
    }

    private async save() {
        this._guildConfigDataManager.data = JSON.stringify(this._guildConfigData, undefined, 4);
    }

    public getOrMakeGuildConfig(guildId: string): GuildConfig {
        let existingConfig: GuildConfig | null = this.getGuildConfig(guildId);

        if (!existingConfig) {
            existingConfig = this._defaultConfig;
            this._guildConfigData[guildId] = existingConfig;
            this.save();
        }
        return existingConfig;
    }

    public getGuildConfig(guildId: string): GuildConfig | null {
        const guildConfig = this._guildConfigData[guildId];
        if (guildConfig === undefined) return null;

        const defaultConfig = this._defaultConfig;
        let mutated = false;
        const configKeys = Object.keys(guildConfig);
        for (const key of Object.keys(defaultConfig) as (keyof GuildConfig)[]) {
            if (!configKeys.includes(key)) {
                mutated = true;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                guildConfig[key] = defaultConfig[key];
            }
        }

        if (mutated) this.save();

        return guildConfig;
    }

    public setGuildConfig(guildId: string, config: GuildConfig): void {
        this._guildConfigData[guildId] = config;
        this.save();
    }
}
