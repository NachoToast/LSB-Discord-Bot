import { GuildEmojiManager, Snowflake } from 'discord.js';
import { promisify } from 'util';
import EconomyManager from '../../classes/EconomyManager';
import Command, { CommandParams } from '../../client/Command';

const wait = promisify(setTimeout);

class Slots implements Command {
    public name = 'slots';
    public description = 'Play some slots';
    public readonly aliases?: string[] | undefined = ['gamble', 'bet'];

    private _cooldowns: { [userId: Snowflake]: boolean } = {};

    public async execute({ client, message, args }: CommandParams) {
        const guildConfig = client.guildConfig.getGuildConfig(message.guildId!);
        if (guildConfig?.gamblingChannel) {
            if (message.channelId !== guildConfig.gamblingChannel) {
                return message.react('❌');
            }
        }

        if (this._cooldowns[message.author.id] !== undefined) {
            return message.channel.send('Please wait for your current slots to finish');
        }

        if (args[0] !== undefined) {
            message.channel.send("You don't need to bet amounts anymore, it's always 10 Param Pupees");
        }

        const economyUser = client.economy.getOrMakeUser(message.author.id);

        if (economyUser.balance < 10) {
            return EconomyManager.insufficientBalance(message, { have: economyUser.balance });
        }

        this._cooldowns[message.author.id] = true;
        const pot = client.economy.getOrMakePot(message.guildId!);
        client.economy.addToPot(pot, economyUser, 10);

        // actual slots logic
        const setNumber = Math.floor(Math.random() * this._slotSets.length);
        const emojiSet = await this.get7guildEmojis(message.guild!.emojis);
        while (emojiSet.length < 7) {
            // if there aren't enough guild emojis, fill it up with normal emojis
            emojiSet.push(this._slotSets[setNumber][Math.floor(Math.random() * this._slotSets[setNumber].length)]);
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
                `3x ${rolls[0]}, poggers! <@${message.author.id}> you won **${pot.amount}** Param Pupees!`,
            );
            client.economy.winPot(pot, economyUser, message.guildId!);
        } else {
            await message.channel.send('unlucky (-10)');
        }

        delete this._cooldowns[message.author.id];
    }

    // yes, this is the reason you suddenly win so much more rarely
    // good job on taking the initiative and reading the code :)
    private async get7guildEmojis(emojis: GuildEmojiManager): Promise<string[]> {
        const guildEmojis = (await emojis.fetch()).map(({ name, id }) => `<:${name}:${id}>`);
        if (guildEmojis.length <= 7) return guildEmojis;
        const chosenEmojis: string[] = [];
        while (chosenEmojis.length < 7) {
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
        ['🍒', '🍋', '🍊', '🍎', '🍉', '🥶', '🍦'],
        ['👑', '⭐', '💎', '🍀', '❤️', '💥', '☄️'],
    ];
}

export default new Slots();
