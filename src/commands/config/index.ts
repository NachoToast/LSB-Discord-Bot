import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';
import { LevelUpThresholds } from '../../types/GuildConfig';
import levels from './configure/levels';

class Config implements Command {
    public name: string = 'config';
    public description: string = "See this server's bot config";
    public aliases?: string[] | undefined = ['conf', 'settings'];
    public async execute({ client, message, chosenPrefix }: CommandParams) {
        const config = client.guildConfig.getGuildConfig(message.guildId!);
        if (!config) {
            return message.channel.send(
                `I don't have any config set up for this server (use **${chosenPrefix}configure** to set up)`,
            );
        }

        const outputConfig: string[] = [
            `Prefixes: \`${client.prefixes.join(`\`, \``)}\``,
            `**Level Config:**`,
        ];
        if (config.levelUpChannel && config.levelUpMessage !== LevelUpThresholds.none) {
            outputConfig.push(
                `Sending level up messages for **${config.levelUpMessage}** in <#${config.levelUpChannel}>`,
            );
        } else {
            outputConfig.push(`Not sending level up messages`);
        }

        message.channel.send(outputConfig.join('\n'));
    }
}

class Configure implements Command {
    public name: string = 'configure';
    public description: string = 'Configure a specific module for the server';
    public exampleUsage(chosenPrefix: string): string {
        return `${chosenPrefix}configure levels`;
    }
    private configurable: string[] = [`levels`];
    public async execute(params: CommandParams) {
        const { args, message } = params;

        if (!message.member?.permissions.has('ADMINISTRATOR')) {
            return message.channel.send(`You need admin perms to do this`);
        }

        if (!args.length) {
            return message.channel.send(
                `Please specify a valid thing to configure: \`${this.configurable.join('`, `')}\``,
            );
        }

        switch (args[0]) {
            case 'levels':
                return levels.execute(params);
            default:
                return message.channel.send(
                    Client.filterMentions(
                        `Option '${args[0]}' not recognized, try one of: \`${this.configurable.join(
                            `\`, \``,
                        )}\``,
                    ),
                );
        }
    }
}

export const config = new Config();
export const configure = new Configure();
