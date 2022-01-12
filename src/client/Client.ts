import { Client as DiscordClient, Collection, GuildMember, Message } from 'discord.js';
import Command, { CommandParams } from './Command';
import intents from './Intents';
import Config from '../types/Config';
import Auth from '../types/Auth';
import Colours, { colourCycle } from '../types/Colours';
import EconomyManager from '../classes/EconomyManager';
import commands from '../commands';
import LevelManager from '../classes/LevelManager';
import GuildConfigManager from '../classes/GuildConfigManager';
import { EventEmitter } from 'stream';

class Client extends DiscordClient {
    public readonly devMode: boolean = process.argv.slice(2).includes('--devmode');
    private readonly _startTime = Date.now();

    public readonly commands: Collection<string, Command> = new Collection();
    public readonly aliases: Map<string, Command> = new Map();
    public readonly prefixes: string[];
    // public readonly initialBalance: number;

    private static readonly tagsEveryone = new RegExp(/@everyone/);
    private static readonly tagsHere = new RegExp(/@here/);
    private static readonly tagsRole = new RegExp(/<@&[0-9]{17,18}>/);
    private static readonly tagsUser = new RegExp(/<@!?[0-9]{17,18}>/);

    public static readonly tagsChannel = new RegExp(/<#[0-9]{17,18}>/);
    private static readonly decorators = new RegExp(/[<#!&>]/g);
    public static readonly filterChannel = (channelTag: string): string =>
        channelTag.replaceAll(Client.decorators, '');

    public readonly economy: EconomyManager;
    public readonly levels = new LevelManager(this);
    public readonly guildConfig = new GuildConfigManager();

    public constructor() {
        super({ intents });
        let token: string;

        // loading stuff from the config.json and auth.json files
        try {
            const config: Config = require('../../config.json');
            this.prefixes = config.prefixes;
            this.economy = new EconomyManager(config.initialBalance);
            const auth: Auth = require('../../auth.json');
            if (this.devMode && !auth.devToken) {
                console.log(
                    `Running in devmode with no auth token, add a ${Colours.FgCyan}devToken${Colours.Reset} field to the ${Colours.FgMagenta}auth.json${Colours.Reset} file.`,
                );
                process.exit();
            }
            token = this.devMode ? auth.devToken! : auth.token;
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('config.json')) {
                    console.log(
                        `Missing ${Colours.FgMagenta}config.json${Colours.Reset} file in root directory`,
                    );
                } else if (error.message.includes('auth.json')) {
                    console.log(
                        `Missing ${Colours.FgMagenta}auth.json${Colours.Reset} file in root directory`,
                    );
                } else {
                    console.log(`Unknown error occurred loading config and auth files`);
                    console.log(error);
                }
            }
            process.exit();
        }

        // loading commands
        try {
            process.stdout.write(`Loading ${commands.length} Commands: `); // use stdout because console appends newline

            let duplicateCommandsMessage: string[] = [];
            const colourCycler = colourCycle();

            commands.map((command) => {
                this.commands.set(command.name, command);

                const colour = colourCycler.next().value;

                process.stdout.write(`${colour}${command.name}${Colours.Reset}, `);

                if (command.aliases?.length) {
                    for (const alias of command.aliases) {
                        if (this.aliases.get(alias) !== undefined) {
                            duplicateCommandsMessage.push(
                                `Alias ${Colours.Bright}${alias}${Colours.Reset} of the ${colour}${
                                    command.name
                                }${Colours.Reset} command is already in use by the ${
                                    Colours.Bright
                                }${this.aliases.get(alias)?.name}${Colours.Reset} command`,
                            );
                        } else {
                            this.aliases.set(alias, command);
                        }
                    }
                }
            });

            process.stdout.write('\n');
            if (duplicateCommandsMessage.length) {
                console.log(duplicateCommandsMessage.join('\n'));
            }
        } catch (error) {
            console.log(`Unknown error occurred loading commands`);
            console.log(error);
            process.exit();
        }

        // adding event listeners
        this.on('ready', this.onReady);
        this.on('error', this.onError);
        this.on('messageCreate', this.onMessageCreate);

        // finally we can login
        this.login(token);
    }

    private async onReady() {
        console.log(
            `${this.user?.tag} logged in (${Colours.FgMagenta}${
                (Date.now() - this._startTime) / 1000
            }s${Colours.Reset})`,
        );

        this.user?.setActivity(`Masterchef`, {
            type: 'STREAMING',
            url: 'https://www.twitch.tv/xqcow',
        });

        await this.levels.validateAllUsersInBackground();
    }

    private async onError(error: Error) {
        console.log(error);
    }

    private async onMessageCreate(message: Message) {
        if (message.author.bot || !message.guild || !message.member) return;

        let chosenPrefix: string | null = null;
        for (const prefix of this.prefixes) {
            if (message.content.startsWith(prefix)) {
                chosenPrefix = prefix;
                break;
            }
        }
        if (!chosenPrefix) return;

        const [command, ...args] = message.content.slice(chosenPrefix.length).split(' ');
        const foundCommand = this.commands.get(command) || this.aliases.get(command);

        if (foundCommand) {
            const params: CommandParams = { client: this, message, args, chosenPrefix };
            try {
                foundCommand.execute(params);
            } catch (error) {
                console.log(`An error occurred executing the ${foundCommand.name} command:`);
                console.log(error);
                if (error instanceof Error) {
                    message.channel.send(
                        `An error occurred executing that command: ${error.message}`,
                    );
                } else {
                    message.channel.send(`An unknown error occurred executing that command`);
                }
            }
        }
    }

    public static filterMentions(message: string, allowUserMentions: boolean = false): string {
        let newMessage = message
            .replace(this.tagsEveryone, 'everyone')
            .replace(this.tagsHere, 'here')
            .replace(this.tagsRole, 'role');
        if (!allowUserMentions) {
            newMessage = newMessage.replace(this.tagsUser, 'user');
        }
        return newMessage;
    }

    public static async getTargetUser(
        message: Message,
        args: string[],
        allowBots: boolean = false,
    ): Promise<GuildMember | null> {
        if (!args.length || !this.tagsUser.test(args[0])) return message.member;
        const member =
            (await message.guild?.members?.fetch(args[0].replace(/[<@!>]/g, ''))) ?? null;
        if (allowBots) return member;
        if (member?.user.bot) return null;
        return member;
    }

    public static async horribleError(message: Message, args: string[], extraInfo?: string[]) {
        let msg = `⚠️ Something terribly wrong happened, you should never see this error.`;

        const nachoToast: GuildMember | null =
            (await message.guild?.members.fetch('240312568273436674')) ?? null;
        if (!nachoToast) {
            msg += `\nPlease contact NachoToast`;
        } else {
            const dmChannel = await nachoToast.createDM();
            dmChannel.sendTyping();
            const errorInfo: string[] = [
                `**Args:** \`${args.join('`, `')}\``,
                `**Author:** ${message.author.username} (${message.author.id})`,
            ];
            if (message.guild) {
                errorInfo.push(`**Guild:** ${message.guild?.name} (${message.guildId})`);
            }
            if (extraInfo) {
                errorInfo.push(...extraInfo);
            }
            dmChannel.send(`Big Error Occurred\n${errorInfo.join('\n')}`);
        }

        message.channel.send(msg);
    }
}

export default Client;
