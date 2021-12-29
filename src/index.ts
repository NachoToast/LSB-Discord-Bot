import { ActivityTypes } from 'discord.js/typings/enums';
import Client from './client/Client';

const startTime = Date.now();
const client = new Client();

client.on('ready', () => {
    console.log(
        `${client.user?.tag} logged in (\x1b[35m${(Date.now() - startTime) / 1000}s\x1b[0m)`,
    );
    console.log(`Loaded ${client.commands.size} commands (${client.aliases.size} aliases)`);
});

client.on('error', (error) => {
    console.log(error);
});

client.login(client.token);
