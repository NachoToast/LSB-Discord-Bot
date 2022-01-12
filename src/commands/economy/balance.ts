import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';
import { EconomyUser } from '../../types/Economy';

class SetBalance implements Command {
    public readonly name: string = 'setbalance';
    public readonly description: string =
        "Set's the balance of a specified user (warning: this will clear their transactions and balance history)";
    public readonly aliases?: string[] | undefined = ['setbal', 'balset'];
    public exampleUsage(chosenPrefix: string): string {
        return `${chosenPrefix}setbalance <@925613504118022204> 100`;
    }
    public async execute({ client, message, args }: CommandParams) {
        if (!message.member?.permissions.has('ADMINISTRATOR')) return;

        if (args.length < 2) return message.channel.send(`Please specify user and amount`);

        const targetUser = await Client.getTargetUser(message, args);
        const targetAmount = Number(args[1]);

        if (targetUser === null)
            return message.channel.send(`Invalid user, '${Client.filterMentions(args[0])}'`);
        if (!Number.isInteger(targetAmount))
            return message.channel.send(`${Client.filterMentions(args[1])} is not a valid integer`);

        let user = client.economy.getOrMakeUser(targetUser.id);

        client.economy.updateUserBalance(user, targetAmount);
    }
}

class Balance implements Command {
    public readonly name: string = 'balance';
    public readonly description: string =
        'Check the number of Param Pupees you or someone else has';
    public readonly aliases: string[] | undefined = ['bal'];

    public async execute({ client, message, args }: CommandParams) {
        const targetUser = await Client.getTargetUser(message, args);
        if (!targetUser) {
            return message.channel.send(`That user doesn't exist, or isn't in the server`);
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
