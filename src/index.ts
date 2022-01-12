import { ActivityTypes } from 'discord.js/typings/enums';
import Client from './client/Client';
import { CommandParams } from './client/Command';
import Colours from './types/Colours';

const startTime = Date.now();
const client = new Client();

client.on('ready', () => {
    console.log(
        `${client.user?.tag} logged in (${Colours.FgMagenta}${(Date.now() - startTime) / 1000}s${
            Colours.Reset
        })`,
    );
});

client.on('error', (error) => {
    console.log(error);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.member) return;

    let chosenPrefix: string | null = null;
    for (const prefix of client.prefixes) {
        if (message.content.startsWith(prefix)) {
            chosenPrefix = prefix;
            break;
        }
    }
    if (!chosenPrefix) return;

    const [command, ...args] = message.content.slice(chosenPrefix.length).split(' ');
    const foundCommand = client.commands.get(command) || client.aliases.get(command);

    if (foundCommand) {
        const params: CommandParams = { client, message, args, chosenPrefix };
        try {
            foundCommand.execute(params);
        } catch (error) {
            console.log(`An error occurred executing the ${foundCommand.name} command:`);
            console.log(error);
            if (error instanceof Error) {
                message.channel.send(`An error occurred executing that command: ${error.message}`);
            } else {
                message.channel.send(`An unknown error occurred executing that command`);
            }
        }
    } else {
        message.react('❔');
    }
});

client.login(client.token);
