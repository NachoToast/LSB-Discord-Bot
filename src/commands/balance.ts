import Client from '../client/Client';
import Command, { CommandParams } from '../client/Command';
import { selfNotInMarket, themNotInMarket } from '../messages/basicFeedback';

class Balance implements Command {
    public readonly name: string = 'balance';
    public readonly description: string =
        'Check the number of Param Pupees you or someone else has';
    public readonly aliases: string[] | undefined = ['bal'];

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
        if (user === undefined) {
            if (external) {
                message.channel.send(themNotInMarket(searchTerm));
            } else {
                message.channel.send(selfNotInMarket);
            }
        } else {
            if (external) {
                message.channel.send(`<@${searchTerm}> has **${user.balance}** Param Pupees`);
            } else {
                message.channel.send(`You have **${user.balance}** Param Pupees`);
            }
        }
    }
}

export default new Balance();
