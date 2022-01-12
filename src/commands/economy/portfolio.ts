import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';

class Portfolio implements Command {
    public readonly name: string = 'portfolio';
    public readonly description: string = 'Get information about a user in the market';
    public readonly aliases: string[] | undefined = ['profile', 'user'];

    public async execute({ client, message, args }: CommandParams) {
        const targetedUser = await Client.getTargetUser(message, args);
        if (!targetedUser) {
            return message.channel.send(`That user doesn't exist, or isn't in the server`);
        }

        const user = client.economy.getUser(targetedUser.id);
        if (!user) {
            if (targetedUser !== message.member) {
                message.channel.send(`That user doesn't have anything in their portfolio`);
            } else {
                message.channel.send(`You don't have anything in your portfolio`);
            }
        } else {
            let header =
                targetedUser !== message.member
                    ? `<@${targetedUser.id}>'s Portfolio:`
                    : `Your Portfolio:`;
            let balance = `Balance: **${user.balance}**`;

            message.channel.send([header, balance].join('\n'));
        }
    }
}

export default new Portfolio();
