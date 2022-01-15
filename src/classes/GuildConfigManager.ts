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
        };
        return config;
    }

    private async save() {
        this._guildConfigDataManager.data = JSON.stringify(this._guildConfigData, undefined, 4);
    }

    public getOrMakeGuildConfig(guildId: string): GuildConfig {
        let existingConfig: GuildConfig | undefined = this._guildConfigData[guildId];
        if (!existingConfig) {
            existingConfig = this._defaultConfig;
            this._guildConfigData[guildId] = existingConfig;
            this.save();
        }
        return existingConfig;
    }

    public setGuildConfig(guildId: string, config: GuildConfig): void {
        this._guildConfigData[guildId] = config;
        this.save();
    }
}
