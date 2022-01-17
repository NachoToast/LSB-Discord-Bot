import { MessageEmbed } from 'discord.js';
import LevelManager from '../../classes/LevelManager';
import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';

class Rank implements Command {
    public readonly name: string = 'rank';
    public readonly description: string = 'Check your level and rank on the server';

    public async execute({ client, message, args }: CommandParams) {
        const targetUser = await Client.getTargetUser(message, args);

        if (!targetUser) {
            return message.channel.send('Can\'t find that user lmoa');
        }

        let user = client.levels.getUser(targetUser.id);
        if (!user) {
            user = { level: 0, xp: 0, leftServer: false };
        }

        const experienceThroughCurrentLevel = Math.abs(LevelManager.xpToLevel(user.level, user.xp));
        const experienceToNextLevel = LevelManager.xpToLevel(user.level + 1, user.xp);
        const totalLevelXP = experienceThroughCurrentLevel + experienceToNextLevel;

        const messageEmbed = new MessageEmbed()
            .setColor('LUMINOUS_VIVID_PINK')
            .setTitle(targetUser.user.username)
            .setThumbnail(targetUser.user.avatarURL() || '')
            .setFooter(`Total XP: ${user.xp > 10000 ? `${Math.round(user.xp / 1000)}k` : user.xp}`);

        const [rank, rankIncludingLeft] = await client.levels.getExperienceRanking(
            message.guild!.members,
            user.xp,
        );

        const description: string[] = [
            `Level: **${user.level}**`,
            `Rank: **${rank}** (${rankIncludingLeft})`,
            `XP: **${experienceThroughCurrentLevel}**/${totalLevelXP} [${Math.floor(
                (100 * experienceThroughCurrentLevel) / totalLevelXP,
            )}%]`,
            LevelManager.makeCoolBarOutOfBingChilling(experienceThroughCurrentLevel, totalLevelXP),
        ];

        messageEmbed.setDescription(description.join('\n'));

        if (user) {
            message.channel.send({ embeds: [messageEmbed] });
        }
    }
}

export default new Rank();
