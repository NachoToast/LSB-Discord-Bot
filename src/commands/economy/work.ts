import { Channel, Message, MessageManager, TextChannel } from 'discord.js';
import moment from 'moment';
import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';

class Work implements Command {
    public readonly name: string = 'work';
    public readonly description: string = 'Work in the Cobalt mines to get some Param Pupees';
    public readonly aliases?: string[] = ['mine'];

    public async execute({ message, client }: CommandParams) {
        const didMine = client.economy.mine(message.author.id);

        if (typeof didMine === 'number') {
            return message.channel.send(
                `Still on cooldown (${
                    didMine > 60
                        ? `${Math.floor(didMine / 60)} minute${
                              Math.floor(didMine / 60) !== 1 ? 's' : ''
                          } and ${didMine % 60} second${didMine % 60 !== 1 ? 's' : ''} remaining`
                        : `${didMine} second${didMine !== 1 ? 's' : ''} remaining`
                })`,
            );
        }

        let { amount, saveCallback } = didMine;

        const afterNasaBonus = await this.afterNasaBonus(client, message.channel.messages);
        const topOfTheHourBonus = this.topOfTheHourBonus();
        const elonBonus = this.elonBonus();

        const output: string[] = [
            `⛏️  You mined **${amount}** Param Pupee${amount !== 1 ? 's' : ''}`,
        ];

        let netAmount = amount;

        if (afterNasaBonus) {
            output.push(`🔥  **x2** multiplier (Nasa bonus)`);
            netAmount *= 2;
        }
        if (topOfTheHourBonus) {
            output.push(`🕛  **+10** Param Pupees (top of the hour bonus)`);
            netAmount += 10;
        }

        if (elonBonus) {
            output.push(`💎  **+100** Param Pupees (Elon bonus)`);
            netAmount += 100;
        }

        if (netAmount !== amount) {
            output.push(`Total: **${netAmount}** Param Pupees`);
        }

        const user = client.economy.getOrMakeUser(message.author.id);
        user.balance += netAmount;
        saveCallback();

        message.channel.send(output.join('\n'));
    }

    private async afterNasaBonus(client: Client, messages: MessageManager): Promise<boolean> {
        const recentMessages = await messages.fetch();
        const secondLastMessage = recentMessages.at(1);
        return (
            secondLastMessage?.author.id ===
            (client.devMode ? '240312568273436674' : '239562978037465088')
        );
    }

    private topOfTheHourBonus(): boolean {
        return new Date().getMinutes() === 0;
    }

    private elonBonus(): boolean {
        const randInt = 1 + Math.floor(Math.random() * 100); // 1 to 100 (inclusive)
        return randInt === 1; // 1% chance
    }
}

export default new Work();