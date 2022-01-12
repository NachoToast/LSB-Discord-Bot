import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';
import { EconomyUser } from '../../types/Economy';

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

export default new Balance();
