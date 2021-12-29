import { Client as DiscordClient, Collection } from 'discord.js';
import Command from './Command';
import intents from './Intents';
import fs from 'fs';
import path from 'path';

interface Config {
    prefixes: string[];
}

interface Auth {
    token: string;
    devToken?: string;
}

class Client extends DiscordClient {
    public readonly devMode: boolean = process.argv.slice(2).includes('--devmode');
    public readonly token: string;

    public readonly commands: Collection<string, Command> = new Collection();
    public readonly aliases: Map<string, Command> = new Map();
    public readonly prefixes: string[];

    private static readonly tagsEveryone = new RegExp(/@everyone/);
    private static readonly tagsHere = new RegExp(/@here/);
    private static readonly tagsRole = new RegExp(/<@&[0-9]{17,18}>/);
    private static readonly tagsUser = new RegExp(/<@!?[0-9]{17,18}>/);

    public constructor() {
        super({ intents });

        // asynchronously set up data files
        this.makeData();

        // loading stuff from the config.json and auth.json files
        try {
            const config: Config = require('../../config.json');
            this.prefixes = config.prefixes;
            const auth: Auth = require('../../auth.json');
            if (this.devMode && !auth.devToken) {
                console.log(
                    'Running in devmode with no auth token, add a \x1b[36mdevToken\x1b[0m field to the \x1b[35mauth.json\x1b[0m file.',
                );
                process.exit();
            }
            this.token = this.devMode ? auth.devToken! : auth.token;
        } catch (error) {
            let handled = false;
            if (error instanceof Error) {
                if (error.message.includes('config.json')) {
                    console.log(`Missing \x1b[35mconfig.json\x1b[0m file in root directory.`);
                    handled = true;
                } else if (error.message.includes('auth.json')) {
                    console.log(`Missing \x1b[35mauth.json\x1b[0m file in root directory.`);
                    handled = true;
                }
            }
            if (!handled) {
                console.log(`Unknown error occurred loading config and auth files.`);
                console.log(error);
            }
            process.exit();
        }

        // loading commands
        try {
            process.stdout.write('Loading Commands: '); // use stdout because console appends newline
            let fgC = 0; // foreground colour

            let duplicateCommandsMessage: string[] = [];

            let commandPath = path.join(__dirname, '../', 'commands');

            fs.readdirSync(commandPath)
                .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
                .map((file) => {
                    const command: Command = require(path.join(commandPath, file)).default;

                    this.commands.set(command.name, command);

                    if (command?.aliases?.length) {
                        for (const alias of command.aliases) {
                            if (this.aliases.get(alias) !== undefined) {
                                duplicateCommandsMessage.push(
                                    `Alias \x1b[1m${alias}\x1b[0m of the \x1b[${31 + (fgC % 6)}m${
                                        command.name
                                    }\x1b[0m command is already in use by the \x1b[1m${
                                        this.aliases.get(alias)?.name
                                    }\x1b[0m command`,
                                );
                                continue;
                            }
                            this.aliases.set(alias, command);
                        }
                    }

                    process.stdout.write(`\x1b[${31 + (fgC % 6)}m${command.name}\x1b[0m, `);

                    fgC++;
                });

            process.stdout.write('\n');
            if (duplicateCommandsMessage.length) {
                console.log(duplicateCommandsMessage.join('\n'));
            }
        } catch (error) {
            console.log(`Unknown error occurred loading commands.`);
            console.log(error);
            process.exit();
        }
    }

    private async makeData(): Promise<void> {
        const filesToMake: { name: string; directory?: boolean }[] = [
            { name: 'data', directory: true },
            { name: 'data/users.json' },
        ];

        for (const { name, directory } of filesToMake) {
            try {
                if (directory) {
                    fs.mkdirSync(name);
                } else {
                    fs.writeFileSync(name, JSON.stringify([], null, 4));
                }
            } catch (error: any) {
                if (error?.code === 'EEXIST') {
                    continue;
                } else {
                    console.log(`Error making ${name} ${directory ? 'directory' : 'file'}`);
                    process.exit();
                }
            }
        }
    }

    public static filterMentions(message: string): string {
        return message
            .replace(this.tagsEveryone, 'everyone')
            .replace(this.tagsHere, 'here')
            .replace(this.tagsRole, 'role')
            .replace(this.tagsUser, 'user');
    }
}

export default Client;
