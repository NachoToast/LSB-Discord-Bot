import { GuildEmojiManager } from 'discord.js';
import { promisify } from 'util';
import EconomyManager from '../../classes/EconomyManager';
import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';

const wait = promisify(setTimeout);

class Slots implements Command {
    public name: string = 'slots';
    public description: string = 'Play some slots';

    public async execute({ client, message, args }: CommandParams) {
        if (!args[0] || !Number.isInteger(Number(args[0])) || Number(args[0]) <= 0) {
            return message.channel.send(`Please specify a valid amount of Param Pupees to bet`);
        }

        const amountToBet = Number(args[0]);
        let amountWon = 0;

        const economyUser = client.economy.getOrMakeUser(message.author.id);

        if (economyUser.balance < amountToBet) {
            return EconomyManager.insufficientBalance(message, { have: economyUser.balance });
        }

        if (amountToBet < 5) {
            return message.channel.send(`Bruh u gotta at least bet 5`);
        }

        const setNumber = Math.floor(Math.random() * this._slotSets.length);
        const set = await this.get5guildEmojis(message.guild!.emojis);
        while (set.length < 5) {
            // if there aren't enough guild emojis, fill it up with normal emojis
            set.push(
                this._slotSets[setNumber][
                    Math.floor(Math.random() * this._slotSets[setNumber].length)
                ],
            );
        }

        const rolls: string[] = [this.roll(set)];
        const sentMessage = await message.channel.send(rolls.join(''));
        await wait(1000);
        rolls.push(this.roll(set));
        await sentMessage.edit(rolls.join(''));
        await wait(1000);
        rolls.push(this.roll(set));
        await sentMessage.edit(rolls.join(''));

        if (rolls[0] === rolls[1] && rolls[1] === rolls[2]) {
            message.channel.send(
                `3x ${rolls[0]}, poggers! You won **${amountToBet * 4}** Param Pupees!`,
            );
            this.giveCuts(client, amountToBet * 4);
            amountWon = amountToBet * 4;
        } else {
            message.channel.send(`unlucky (-${amountToBet})`);
        }

        client.economy.slots(economyUser, amountToBet, amountWon);
    }

    private async get5guildEmojis(emojis: GuildEmojiManager): Promise<string[]> {
        const guildEmojis = (await emojis.fetch()).map(({ name, id }) => `<:${name}:${id}>`);
        if (guildEmojis.length <= 5) return guildEmojis;
        let chosenEmojis: string[] = [];
        while (chosenEmojis.length < 5) {
            const randomIndex = Math.floor(Math.random() * guildEmojis.length);
            chosenEmojis.push(guildEmojis[randomIndex]);
            guildEmojis.splice(randomIndex, 1);
        }

        return chosenEmojis;
    }

    private giveCuts(client: Client, amountWon: number) {
        const cutToAryan = amountWon * 0.1;
        const cutToTanishk = amountWon * 0.04;

        const aryan = client.economy.getOrMakeUser('342562027539136513');
        const tanishk = client.economy.getOrMakeUser('252953727126732800');

        aryan.balance += cutToAryan;
        tanishk.balance += cutToTanishk;
        client.economy.userBalanceChecks(aryan);
        client.economy.userBalanceChecks(tanishk);
        client.economy.save();
    }

    private roll(slotset: string[]): string {
        return slotset[Math.floor(Math.random() * slotset.length)];
    }

    private _slotSets: string[][] = [
        ['🍒', '🍋', '🍊', '🍎', '🍉'],
        ['👑', '⭐', '💎', '🍀', '❤️'],
        ['💥', '☄️', '💀', '🥶', '🍦'],
    ];

    public exampleUsage(chosenPrefix: string): string {
        return `${chosenPrefix}slots 10`;
    }
}

export default new Slots();

/* cuts
4% tanishk
10% aryan
 */
