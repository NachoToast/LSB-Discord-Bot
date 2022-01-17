import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';
import { LevelUpThresholds } from '../../types/GuildConfig';
import levels from './configure/levels';
import gambling from './configure/gambling';

class Config implements Command {
    public name = 'config';
    public description = "See this server's bot config";
    public aliases?: string[] | undefined = ['conf', 'settings', 'guildconfig', 'guildconf'];

    public async execute({ client, message, args }: CommandParams) {
        const guildConfig = client.guildConfig.getOrMakeGuildConfig(message.guildId!);

        if (args.includes('json')) {
            const output: string[] = ['```json'];
            output.push(JSON.stringify(guildConfig, undefined, 4));
            output.push('```');
            return message.channel.send(output.join('\n'));
        }

        const outputConfig: string[] = [`Prefixes: \`${client.prefixes.join('`, `')}\``, '**Level Config:**'];

        if (guildConfig.levelUpChannel && guildConfig.levelUpMessage !== LevelUpThresholds.none) {
            outputConfig.push(
                `Sending level up messages for **${guildConfig.levelUpMessage}** in <#${guildConfig.levelUpChannel}>`,
            );
        } else {
            outputConfig.push('Not sending level up messages');
        }

        outputConfig.push('**Gambling Config:**');
        if (guildConfig.gamblingChannel) {
            outputConfig.push(`Gambling channel: <#${guildConfig.gamblingChannel}>`);
        } else {
            outputConfig.push('No gambling channel');
        }

        message.channel.send(outputConfig.join('\n'));
    }
}

class ClientConfig implements Command {
    public name = 'clientconfig';
    public description = "See the bot's global config";
    public aliases?: string[] = ['clientconf'];
    public async execute({ client, message }: CommandParams) {
        const config = client.config;
        if (!config.allowAnyoneToSeeConfig) return;

        const output: string[] = ['```json'];
        output.push(JSON.stringify(config, undefined, 4));
        output.push('```');

        message.channel.send(output.join('\n'));
    }
}

class Configure implements Command {
    public name = 'configure';
    public description = 'Configure a specific module for the server';
    public aliases?: string[] = ['setconf'];
    public adminOnly = true;
    public exampleUsage(chosenPrefix: string): string {
        return `${chosenPrefix}configure levels`;
    }
    private configurable: string[] = ['levels', 'gambling'];
    public async execute(params: CommandParams) {
        const { args, message } = params;

        if (!args.length) {
            return message.channel.send(
                `Please specify a valid thing to configure: \`${this.configurable.join('`, `')}\``,
            );
        }

        switch (args[0]) {
            case 'levels':
                return levels.execute(params);
            case 'gambling':
                return gambling.execute(params);
            default:
                return message.channel.send(
                    Client.filterMentions(
                        `Option '${args[0]}' not recognized, try one of: \`${this.configurable.join('`, `')}\``,
                    ),
                );
        }
    }
}

export const config = new Config();
export const configure = new Configure();
export const clientConfig = new ClientConfig();

export default [config, configure, clientConfig];
