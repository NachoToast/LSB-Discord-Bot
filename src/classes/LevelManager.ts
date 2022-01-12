import { AnyChannel, GuildMember, Message, TextChannel } from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';
import Mee6Player from '../archive/Mee6Player';
import Client from '../client/Client';
import { LevelUpThresholds } from '../models/GuildConfig';
import { FullLevelUser, LevelUser } from '../models/UserModels';
import DataManager from './DataManager';

export default class LevelManager {
    private _client: Client;
    private _levelData: { [discordID: string]: LevelUser };
    private _spamLockData: { [discordID: string]: true } = {};
    private _levelDataManager: DataManager;

    public constructor(client: Client) {
        this._client = client;

        const startingData: { [index: string]: LevelUser } = {};

        try {
            const legacyData: Mee6Player[] = require('../archive/mee6.json');

            for (const { id, level, xp } of legacyData) {
                startingData[id] = { level, xp };
            }
        } catch (error) {
            console.log(`Error loading legacy data`);
        }

        this._levelDataManager = new DataManager(
            'data/levels/users.json',
            JSON.stringify(startingData, undefined, 4),
        );
        this._levelData = JSON.parse(this._levelDataManager.data);

        client.on('messageCreate', (message) => this.handleMessage(message));
    }

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
            user = { xp: 0, level: 0 };
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

        // console.log(
        //     `${message.author.username} got ${addedXP}xp (total ${user.xp})${
        //         levelChanged ? ` reaching level ${user.level}` : ''
        //     }`,
        // );

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

    public getExperienceRanking(experience: number): number {
        let rank = 1;

        for (const key in this._levelData) {
            if (this._levelData[key].xp > experience) {
                rank += 1;
            }
        }

        return rank;
    }

    public getUserRanking(numUsers: number = 10): FullLevelUser[] {
        const topX: FullLevelUser[] = new Array(numUsers);

        for (const id of Object.keys(this._levelData)) {
            const { xp, level } = this._levelData[id];
            let insertionIndex = 0;
            while (xp < topX[insertionIndex]?.xp && insertionIndex < numUsers) {
                insertionIndex++;
            }

            if (insertionIndex < numUsers) {
                topX[insertionIndex] = { id, xp, level };
            }
        }

        return topX;
    }

    public async handleLevelUpMessage(member: GuildMember, newLevel: number): Promise<void> {
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
        channel.send(`<@${member.id}> is now level **${newLevel}!**`);
    }
}
