import { Message } from 'discord.js';
import Command, { CommandParams } from '../client/Command';

class Ping implements Command {
    public readonly name: string = 'ping';
    public readonly description: string = 'Check if the bot is working';
    public readonly aliases: string[] | undefined = ['p'];

    public async execute({ client, message }: CommandParams) {
        message.channel.send(
            `Pongers!\nMy latency: ${Math.abs(
                Date.now() - message.createdTimestamp,
            )}ms\nAPI Latency: ${Math.round(client.ws.ping)}`,
        );
    }
}

export default new Ping();
