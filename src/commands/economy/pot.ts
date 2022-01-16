import moment from 'moment';
import Command, { CommandParams } from '../../client/Command';
import { Pot } from '../../types/Economy';

class GetPot implements Command {
    public name: string = 'pot';
    public description: string = 'See how big the winnings pot is';
    public aliases?: string[] = ['getpot'];

    public async execute({ client, message }: CommandParams) {
        const { amount, attempts, createdAt }: Pot =
            client.economy.getPot(message.guildId!) || client.economy.defaultPot;

        message.channel.send(
            `Current Pot: **${amount}** Param Pupees\nAttempts: **${attempts}**\nStarted: ${moment(
                createdAt,
            ).fromNow()}`,
        );
    }
}

export default new GetPot();
