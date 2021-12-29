import moment from 'moment';
import Client from '../client/Client';
import Command, { CommandParams } from '../client/Command';
import { selfNotInMarket, themNotInMarket } from '../messages/basicFeedback';

class Portfolio implements Command {
    public readonly name: string = 'portfolio';
    public readonly description: string = 'Get information about a user in the market';
    public readonly aliases: string[] | undefined = ['profile', 'user'];

    public async execute({ client, message, args }: CommandParams) {
        let searchTerm: string = message.author.id;
        let external: boolean = false;

        if (!!args.length && args[0].startsWith('<@')) {
            const newSearchTerm = args[0].replace(/[<@!>]/g, '');
            if (newSearchTerm !== searchTerm) {
                external = true;
                searchTerm = newSearchTerm;
            }
        }

        const user = client.dataManager.getUser(searchTerm);
        if (!user) {
            if (external) {
                message.channel.send(themNotInMarket(searchTerm));
            } else {
                message.channel.send(selfNotInMarket);
            }
        } else {
            let header = external ? `<@${searchTerm}>'s Portfolio:` : `Your Portfolio:`;
            let balance = `Balance: **${user.balance}**`;
            let joined = `Joined: ${new Date(user.registered).toLocaleDateString()} (${moment(
                user.registered,
            ).fromNow()})`;

            message.channel.send([header, balance, joined].join('\n'));
        }
    }
}

export default new Portfolio();
