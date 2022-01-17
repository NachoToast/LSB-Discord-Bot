import { Message } from 'discord.js';
import Client from './Client';

export interface CommandParams {
    client: Client;
    message: Message;
    args: string[];
    chosenPrefix: string;
}

export default interface Command {
    name: string;
    description: string;
    aliases?: string[];
    adminOnly?: boolean;

    execute: (params: CommandParams) => Promise<unknown>;
    exampleUsage?: (chosenPrefix: string) => string;
}
