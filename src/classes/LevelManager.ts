import {
    AnyChannel,
    DiscordAPIError,
    GuildMember,
    GuildMemberManager,
    Message,
    User,
} from 'discord.js';
import Client from '../client/Client';
import { LevelUpThresholds } from '../types/GuildConfig';
import { FullLevelUser, LevelUser } from '../types/UserModels';
import DataManager from './DataManager';
import { TypedEmitter } from 'tiny-typed-emitter';

export interface LevelManagerEvents {
    backgroundValidation: (current: number, total: number) => void;
}

export default class LevelManager extends TypedEmitter<LevelManagerEvents> {
    private _client: Client;
    private _levelData: { [discordID: string]: LevelUser };
    private _spamLockData: { [discordID: string]: true } = {};
    private _levelDataManager: DataManager;

    public constructor(client: Client) {
        super();
        this._client = client;

        const startingData: { [index: string]: LevelUser } = {};

        this._levelDataManager = new DataManager(
            'data/levels/users.json',
            JSON.stringify(startingData, undefined, 4),
        );
        this._levelData = JSON.parse(this._levelDataManager.data);

        client.on('messageCreate', (message) => this.handleMessage(message));
        client.on('guildMemberRemove', (member) => {
            if (this._levelData[member.id] && !this._levelData[member.id]?.leftServer) {
                this._levelData[member.id].leftServer = true;
                this.save();
            }
        });
        client.on('guildMemberAdd', (member) => {
            if (this._levelData[member.id]?.leftServer) {
                this._levelData[member.id].leftServer = false;
                this.save();
            }
        });
    }

    public validationProgress: number = 0;
    public async validateAllUsersInBackground(save: boolean = true) {
        const objKeys = Object.keys(this._levelData);

        if (!objKeys.some((key) => this._levelData[key].leftServer === undefined)) {
            // no validation needed
            this.validationProgress = 100;
            this.emit('backgroundValidation', -1, -1);
            return;
        }

        const len = objKeys.length;
        let progress = 0;

        const allGuilds = await this._client.guilds.fetch();
        if (allGuilds.size === 0) return;
        const mainGuild = allGuilds.get(allGuilds.firstKey()!);
        if (!mainGuild) return;
        const guildMembers = (await mainGuild.fetch()).members;

        for (let i = 0; i < len; i++) {
            const id = objKeys[i];
            await this.validateUser(id, guildMembers, save);
            progress++;
            this.validationProgress = Math.floor((100 * i) / len);
            this.emit('backgroundValidation', progress, len);
        }

        this.emit('backgroundValidation', progress, len);
        this.validationProgress = 100;
    }

    /** Makes sure the user is in the server.
     * @returns {boolean} Whether the user is valid for ranking.
     */
    private async validateUser(
        id: string,
        guildMembers: GuildMemberManager,
        save: boolean = true,
    ): Promise<boolean> {
        if (this._levelData[id]?.leftServer !== undefined) {
            return !this._levelData[id].leftServer;
        }

        try {
            await guildMembers.fetch(id);
            this._levelData[id].leftServer = false;
            if (this._levelData[id]) {
                this._levelData[id].leftServer = false;
            } else {
                this._levelData[id] = { xp: 0, level: 0, leftServer: false };
            }
            if (save) this.save();
            return true;
        } catch (error) {
            if (!(error instanceof DiscordAPIError) || error.message !== 'Unknown Member') {
                console.log(`Uknown error occurred trying to fetch user`);
            } else {
                if (this._levelData[id]) {
                    this._levelData[id].leftServer = true;
                } else {
                    this._levelData[id] = { xp: 0, level: 0, leftServer: true };
                }
                if (save) this.save();
            }
            return false;
        }
    }

    /** Gets number of experience required to reach a certain level.
     * @param {number} levelDesired The level you want to reach.
     * @param {number} currentXP The total amount of experience you currently have.
     * @see [GitHub Source](https://github.com/PsKramer/mee6calc/blob/master/calc.js)
     */
    public static xpToLevel(levelDesired: number, currentXP: number = 0): number {
        // https://github.com/PsKramer/mee6calc/blob/master/calc.js
        const xpNeededFromNone =
            (5 / 6) * levelDesired * (2 * levelDesired ** 2 + 27 * levelDesired + 91);
        return Math.floor(xpNeededFromNone - currentXP);
    }

    private async userLock(memberId: string) {
        this._spamLockData[memberId] = true;
        setTimeout(() => {
            delete this._spamLockData[memberId];
        }, 60 * 1000);
    }

    /** @returns Random amount of XP between 15 and 25 (exclusive)  */
    private static randomXPAmount(multiplier: number = 1): number {
        const baseXP = 15 + Math.floor(Math.random() * 10);
        return baseXP * multiplier;
    }

    private async handleMessage(message: Message) {
        if (message.author.bot || !message?.member) return;
        if (this._spamLockData[message.member.id]) return;

        let user: LevelUser | undefined = this._levelData[message.author.id];
        if (!user) {
            user = { xp: 0, level: 0, leftServer: false };
            this._levelData[message.member.id] = user;
        }

        const addedXP = LevelManager.randomXPAmount();
        user.xp += addedXP;

        let levelChanged = false;
        if (LevelManager.xpToLevel(user.level + 1, user.xp) <= 0) {
            levelChanged = true;
            while (LevelManager.xpToLevel(user.level + 1, user.xp) <= 0) {
                user.level += 1;
            }
        }

        if (levelChanged) {
            this.handleLevelUpMessage(message.member, user.level);
        }

        this.userLock(message.member.id);
        this.save();
    }

    public getUser(userId: string): LevelUser | undefined {
        return this._levelData[userId];
    }

    private async save() {
        this._levelDataManager.data = JSON.stringify(this._levelData, undefined, 4);
    }

    public static makeCoolBarOutOfBingChilling(
        currentProgress: number,
        maxProgress: number,
    ): string {
        const bing = '🥶';
        const chilling = '😬';

        const numOfBing = Math.floor((10 * currentProgress) / maxProgress);

        return (
            new Array(numOfBing).fill(bing).join(' ') +
            '  ' +
            new Array(10 - numOfBing).fill(chilling).join(' ')
        );
    }

    /** Gets the rank of a single user. `rank` does not include people who have left the server, but `rankIncludingLeft` does. */
    public async getExperienceRanking(
        guildMembers: GuildMemberManager,
        experience: number,
    ): Promise<[number, number]> {
        let rank = 0;
        let rankIncludingLeft = 0;

        for (const key in this._levelData) {
            if (this._levelData[key].xp >= experience) {
                rankIncludingLeft += 1;
                if (await this.validateUser(key, guildMembers)) {
                    rank += 1;
                }
            }
        }

        return [rank, rankIncludingLeft];
    }

    /** Gets the top members by experience, doesn't include people who have left the server.
     * @param {GuildMemberManager} guildMembers The guild member manager for the guild,
     * this should always be the Client's primary guild.
     */
    public async getUserRanking(
        guildMembers: GuildMemberManager,
        numUsers: number = 10,
    ): Promise<FullLevelUser[]> {
        const topX: FullLevelUser[] = new Array(numUsers);

        for (const id of Object.keys(this._levelData)) {
            if (!(await this.validateUser(id, guildMembers))) {
                continue;
            }
            const { xp, level, leftServer } = this._levelData[id];
            let insertionIndex = 0;
            while (xp < topX[insertionIndex]?.xp && insertionIndex < numUsers) {
                insertionIndex++;
            }

            if (insertionIndex < numUsers) {
                topX[insertionIndex] = { id, xp, level, leftServer };
            }
        }

        return topX;
    }

    private async messageAryan(member: GuildMember, newLevel: number): Promise<any> {
        try {
            if (
                newLevel !== 2 &&
                newLevel !== 5 &&
                newLevel !== 10 &&
                newLevel !== 20 &&
                newLevel !== 25 &&
                newLevel !== 35 &&
                !this._client.devMode
            ) {
                return;
            }

            const aryan: User = await this._client.users.fetch(
                this._client.devMode ? `240312568273436674` : '342562027539136513',
            );
            const dmChannel = await aryan.createDM();

            dmChannel.send(`Yoza, <@${member.id}> just went up to level ${newLevel}`);
        } catch (error) {
            // lmao
        }
    }

    public async handleLevelUpMessage(member: GuildMember, newLevel: number): Promise<void> {
        this.messageAryan(member, newLevel);
        const guildConfig = this._client.guildConfig.getGuildConfig(member.guild.id);
        if (!guildConfig || !guildConfig.levelUpChannel) return;

        switch (guildConfig.levelUpMessage) {
            case LevelUpThresholds.everyLevel:
                break;
            case LevelUpThresholds.every5thLevel:
                if (newLevel % 5 !== 0) return;
                break;
            case LevelUpThresholds.every10thLevel:
                if (newLevel % 10 !== 0) return;
                break;
            case LevelUpThresholds.everyLevelPast10:
                if (newLevel < 10) return;
                break;
            case LevelUpThresholds.everyLevelPast20:
                if (newLevel < 20) return;
                break;
            case LevelUpThresholds.everyLevelPast30:
                if (newLevel < 30) return;
                break;
            case LevelUpThresholds.none:
                return;
            default:
                console.log(
                    `Got an unknown levelUpMessage configuration (${guildConfig.levelUpMessage}) for guild ${member.guild.name} (${member.guild.id})`,
                );
                return;
        }

        const channel: AnyChannel | null = await this._client.channels.fetch(
            guildConfig.levelUpChannel,
        );
        if (channel === null || channel.type !== 'GUILD_TEXT') return;

        try {
            channel.send(`<@${member.id}> is now level **${newLevel}!**`);
        } catch (error) {
            // sometimes we just cant send a message, and thats ok 🥰
        }
    }
}
