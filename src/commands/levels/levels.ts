import { MessageEmbed } from 'discord.js';
import Command, { CommandParams } from '../../client/Command';

export class Levels implements Command {
    public name: string = 'level';
    public aliases?: string[] | undefined = ['levels', 'leveltop'];
    public description: string = 'List the 10 highest levelled users in the server';
    public async execute({ client, message }: CommandParams) {
        if (client.levels.validationProgress !== 100) {
            message.channel.send(
                `⚠️  Please try again once first-time-load has been completed (${client.levels.validationProgress}%)`,
            );
            return;
        }

        const top10 = await client.levels.getUserRanking(message.guild!.members);

        const messageEmbed = new MessageEmbed()
            .setColor('LUMINOUS_VIVID_PINK')
            .setTitle(`🏆  ${message.guild?.name || ''} Rankings`)
            .setThumbnail(message.guild?.iconURL() || client.user?.avatarURL() || '');

        const desc: string[] = [];

        for (let i = 0, len = top10.length; i < len; i++) {
            if (!top10[i]) continue;
            const { id, level } = top10[i];

            desc.push(
                `${i < 3 ? Levels.medalGiver(i) + ' ' : `${i + 1}.`} <@${id}> - Level **${level}**`,
            );
        }

        messageEmbed.setDescription('\u200b\n' + desc.join('\n\n'));

        message.channel.send({ embeds: [messageEmbed] });
    }

    public static medalGiver(position: number): string {
        // TODO: move this to global util/helper
        if (position === 0) return '🥇';
        if (position === 1) return '🥈';
        return '🥉';
    }
}

export default new Levels();
