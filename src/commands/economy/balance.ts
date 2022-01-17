import { MessageEmbed } from 'discord.js';
import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';
import { EconomyUser } from '../../types/Economy';
import { Levels } from '../levels/levels';

class Baltop implements Command {
    public readonly name: string = 'balancetop';
    public readonly description: string = 'List the 10 richest people from the server';
    public readonly aliases?: string[] | undefined = ['baltop'];

    public async execute({ client, message }: CommandParams) {
        const top10 = client.economy.getTopBalance();

        const messageEmbed = new MessageEmbed()
            .setColor('#32CD32')
            .setTitle(`💸  ${message.guild?.name || ''} Richest People`)
            .setThumbnail(message.guild?.iconURL() || client.user?.avatarURL() || '');

        const desc: string[] = [];

        for (let i = 0, len = top10.length; i < len; i++) {
            if (!top10[i]) continue;
            const { id, balance } = top10[i];

            desc.push(`${i < 3 ? Levels.medalGiver(i) + ' ' : `${i + 1}.`} <@${id}> - **${balance}** Param Pupees`);
        }

        messageEmbed.setDescription('\u200b\n' + desc.join('\n\n'));

        message.channel.send({ embeds: [messageEmbed] });
    }
}

class SetBalance implements Command {
    public readonly name: string = 'setbalance';
    public readonly description: string =
        "Set's the balance of a specified user (warning: this will clear their transactions and balance history)";
    public readonly aliases?: string[] | undefined = ['setbal', 'balset'];
    public readonly adminOnly = true;
    public exampleUsage(chosenPrefix: string): string {
        return `${chosenPrefix}setbalance <@925613504118022204> 100`;
    }
    public async execute({ client, message, args }: CommandParams) {
        if (args.length < 2) return message.channel.send('Please specify user and amount');

        const targetUser = await Client.getTargetUser(message, args);
        const targetAmount = Number(args[1]);

        if (targetUser === null) return message.channel.send(`Invalid user, '${Client.filterMentions(args[0])}'`);
        if (args[1] === '' || Number.isNaN(targetAmount))
            return message.channel.send(`${Client.filterMentions(args[1])} is not a valid numer`);

        const user = client.economy.getOrMakeUser(targetUser.id);

        client.economy.setUserBalance(user, targetAmount);
        message.channel.send(
            `Set <@${targetUser.id}>'s balance to ${user.balance} Param Pupee${user.balance !== 1 ? 's' : ''}`,
        );
    }
}

class Balance implements Command {
    public readonly name: string = 'balance';
    public readonly description: string = 'Check the number of Param Pupees you or someone else has';
    public readonly aliases: string[] | undefined = ['bal'];

    public async execute({ client, message, args }: CommandParams) {
        const targetUser = await Client.getTargetUser(message, args);
        if (!targetUser) {
            return message.channel.send('That user doesn\'t exist, or isn\'t in the server');
        }

        let user = client.economy.getUser(targetUser.id);
        if (!user) {
            // if the user doesn't exist, make one
            client.economy.createUser(targetUser.id);
            user = client.economy.getUser(targetUser.id) as EconomyUser;
        }

        if (targetUser !== message.member)
            message.channel.send(`<@${targetUser.id}> has **${user.balance}** Param Pupees`);
        else message.channel.send(`You have **${user.balance}** Param Pupees`);
    }
}

export const balance = new Balance();
export const setbalance = new SetBalance();
export const baltop = new Baltop();
