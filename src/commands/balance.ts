import Client from '../client/Client';
import Command, { CommandParams } from '../client/Command';

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

        const balance = client.dataManager.getUserBalance(searchTerm);
        if (balance === undefined) {
            if (external) {
                message.channel.send(
                    Client.filterMentions(`<@${searchTerm}> hasn't joined the market yet`, true),
                );
            } else {
                message.channel.send(
                    `You haven't joined the market yet, type \`!join\` to get started`,
                );
            }
        } else {
            if (external) {
                message.channel.send(`<@${searchTerm}> has **${balance}** Param Pupees`);
            } else {
                message.channel.send(`You have **${balance}** Param Pupees`);
            }
        }
    }
}

export default new Balance();
