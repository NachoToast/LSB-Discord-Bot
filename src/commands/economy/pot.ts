import moment from 'moment';
import Command, { CommandParams } from '../../client/Command';
import { Pot } from '../../types/Economy';

class GetPot implements Command {
    public name = 'pot';
    public description = 'See how big the winnings pot is';
    public aliases?: string[] = ['getpot'];

    public async execute({ client, message }: CommandParams) {
        const { amount, attempts, createdAt }: Pot =
            client.economy.getPot(message.guildId!) || client.economy.defaultPot;

        message.channel.send(
            `Current Pot: **${Math.floor(
                amount - 0.02 * amount,
            )}** Param Pupees\nAttempts: **${attempts}**\nStarted: ${moment(createdAt).fromNow()}`,
        );
    }
}

export default new GetPot();
