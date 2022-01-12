import Client from '../client/Client';
import GuildConfig from '../types/GuildConfig';
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

    private async save() {
        this._guildConfigDataManager.data = JSON.stringify(this._guildConfigData, undefined, 4);
    }

    public getGuildConfig(guildId: string): GuildConfig | undefined {
        return this._guildConfigData[guildId];
    }

    public setGuildConfig(guildId: string, config: GuildConfig): void {
        this._guildConfigData[guildId] = config;
        this.save();
    }
}
