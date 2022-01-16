import { GuildEmojiManager, Snowflake } from 'discord.js';
import { promisify } from 'util';
import EconomyManager from '../../classes/EconomyManager';
import Command, { CommandParams } from '../../client/Command';

const wait = promisify(setTimeout);

class Slots implements Command {
    public name: string = 'slots';
    public description: string = 'Play some slots';

    private _cooldowns: { [userId: Snowflake]: boolean } = {};

    public async execute({ client, message, args }: CommandParams) {
        const guildConfig = client.guildConfig.getGuildConfig(message.guildId!);
        if (guildConfig?.gamblingChannel) {
            if (message.channelId !== guildConfig.gamblingChannel) {
                return message.react('❌');
            }
        }

        if (this._cooldowns[message.author.id] !== undefined) {
            return message.channel.send(`Please wait for your current slots to finish`);
        }

        this._cooldowns[message.author.id] = true;

        if (!args[0] || !Number.isInteger(Number(args[0])) || Number(args[0]) <= 0) {
            return message.channel.send(`Please specify a valid amount of Param Pupees to bet`);
        }

        const amountToBet = Number(args[0]);

        const economyUser = client.economy.getOrMakeUser(message.author.id);

        if (economyUser.balance < amountToBet) {
            return EconomyManager.insufficientBalance(message, { have: economyUser.balance });
        }

        if (amountToBet < 5) {
            return message.channel.send(`Bruh u gotta at least bet 5`);
        }

        const pot = client.economy.getOrMakePot(message.guildId!);
        client.economy.addToPot(pot, economyUser, amountToBet);

        // actual slots logic
        const setNumber = Math.floor(Math.random() * this._slotSets.length);
        const emojiSet = await this.get5guildEmojis(message.guild!.emojis);
        while (emojiSet.length < 5) {
            // if there aren't enough guild emojis, fill it up with normal emojis
            emojiSet.push(
                this._slotSets[setNumber][
                    Math.floor(Math.random() * this._slotSets[setNumber].length)
                ],
            );
        }

        const rolls: string[] = [this.roll(emojiSet)];
        const sentMessage = await message.channel.send(rolls.join(''));
        await wait(1000);
        rolls.push(this.roll(emojiSet));
        await sentMessage.edit(rolls.join(''));
        await wait(1000);
        rolls.push(this.roll(emojiSet));
        await sentMessage.edit(rolls.join(''));

        if (rolls[0] === rolls[1] && rolls[1] === rolls[2]) {
            await message.channel.send(
                `3x ${rolls[0]}, poggers! You won **${pot.amount}** Param Pupees!`,
            );
            client.economy.winPot(pot, economyUser, message.guildId!);
        } else {
            await message.channel.send(`unlucky (-${amountToBet})`);
        }

        delete this._cooldowns[message.author.id];
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
