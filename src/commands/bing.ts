import Command, { CommandParams } from '../client/Command';
import seedrandom from 'seedrandom';
import Client from '../client/Client';

class Bing implements Command {
    public name: string = 'bing';
    public aliases?: string[] | undefined = ['chilling'];
    public description: string = 'See whether you are bing or chilling';
    public async execute({ args, message }: CommandParams) {
        const targetUser = await Client.getTargetUser(message, args);

        if (!targetUser)
            return message.channel.send(`https://c.tenor.com/QA_IqSKoWTcAAAAC/the-rock.gif`);

        const holyRNG = Math.floor(seedrandom(targetUser.id)() * 2); // 0 or 1

        if (holyRNG === 0) {
            if (targetUser === message.member) {
                message.channel.send(`You are **Bing** 🥶`);
            } else {
                message.channel.send(`<@${targetUser.id}> is **Bing** 🥶`);
            }
        } else {
            if (targetUser === message.member) {
                message.channel.send(`You are **Chilling** 🍦`);
            } else {
                message.channel.send(`<@${targetUser.id}> is **Chilling** 🍦`);
            }
        }
    }
}

export default new Bing();
