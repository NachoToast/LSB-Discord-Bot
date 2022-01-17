import { Message } from 'discord.js';
import Client from '../../../client/Client';
import Command, { CommandParams } from '../../../client/Command';
import { LevelUpThresholds } from '../../../types/GuildConfig';

class ConfigureLevels implements Command {
    public name = 'levels';
    public description = 'Configure what channel to send level up notifications to, and when to send them';
    public async execute({ client, message }: CommandParams) {
        const existingConfig = client.guildConfig.getOrMakeGuildConfig(message.guildId!);

        const mainMessage = await message.channel.send(
            `${
                existingConfig.levelUpChannel && existingConfig.levelUpMessage !== LevelUpThresholds.none
                    ? `Currently sending level up messages for **${existingConfig.levelUpMessage}** in <#${existingConfig.levelUpChannel}>`
                    : 'Currently not sending level up messages to any channel'
            }\nTag the channel you want to send level up messages in, type \`skip\` to keep the same, or \`none\` to have no channel`,
        );

        const filter = (collectedMessage: Message) => collectedMessage.author === message.author;
        const collector = message.channel.createMessageCollector({ filter, time: 25 * 1000 });
        collector.on('collect', async (m) => {
            switch (m.content) {
                case 'skip':
                    m.react('⏩');
                    collector.stop('got_result');
                    break;
                case 'none':
                    existingConfig.levelUpChannel = null;
                    m.react('✅');
                    collector.stop('got_result');
                    break;
                default:
                    if (Client.tagsChannel.test(m.content)) {
                        const filteredChannel = Client.filterChannel(m.content);
                        if (await client.channels.fetch(filteredChannel)) {
                            m.react('✅');
                            collector.stop('got_result');
                            existingConfig.levelUpChannel = filteredChannel;
                        } else {
                            m.react('❌');
                            mainMessage.edit('That channel does not exist, please try again');
                        }
                    }
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'got_result') {
                mainMessage.edit('❌ Didn\'t send a response in time');
            } else {
                const levelUpOptions: LevelUpThresholds[] = [
                    LevelUpThresholds.everyLevel,
                    LevelUpThresholds.every5thLevel,
                    LevelUpThresholds.every10thLevel,
                    LevelUpThresholds.everyLevelPast10,
                    LevelUpThresholds.everyLevelPast20,
                    LevelUpThresholds.everyLevelPast30,
                    LevelUpThresholds.none,
                ];

                const secondaryMessage = await message.channel.send(
                    `Now select how often level up messages should be sent (1-${
                        levelUpOptions.length
                    }), or type \`skip\`to keep the same:\n${levelUpOptions
                        .map((e, i) => `${i + 1}: ${e}${e === existingConfig.levelUpMessage ? ' (current)' : ''}`)
                        .join('\n')}`,
                );
                const filter2 = (m: Message) =>
                    (filter(m) &&
                        Number.isInteger(Number(m.content)) &&
                        Number(m.content) > 0 &&
                        Number(m.content) <= levelUpOptions.length) ||
                    m.content === 'skip';
                const collector2 = message.channel.createMessageCollector({
                    filter: filter2,
                    time: 30 * 1000,
                });
                collector2.on('collect', async (m) => {
                    if (m.content === 'skip') {
                        m.react('⏩');
                        collector2.stop('got_result');
                    } else {
                        existingConfig.levelUpMessage = levelUpOptions[Number(m.content) - 1];
                        m.react('✅');
                        collector2.stop('got_result');
                    }
                });

                collector2.on('end', async (_, reason) => {
                    if (reason !== 'got_result') {
                        secondaryMessage.edit('❌ Didn\'t send a response in time');
                    } else {
                        message.channel.send(
                            existingConfig.levelUpChannel && existingConfig.levelUpMessage !== LevelUpThresholds.none
                                ? `Now sending level up messages for **${existingConfig.levelUpMessage}** in <#${existingConfig.levelUpChannel}>`
                                : 'No longer sending level up messages to any channel',
                        );

                        client.guildConfig.setGuildConfig(message.guildId!, existingConfig);
                    }
                });
            }
        });
    }
}

export default new ConfigureLevels();
