import { Message } from 'discord.js';
import Client from '../../../client/Client';
import Command, { CommandParams } from '../../../client/Command';
import GuildConfig, { LevelUpThresholds } from '../../../models/GuildConfig';

class ConfigureLevels implements Command {
    public name: string = 'levels';
    public description: string =
        'Configure what channel to send level up notifications to, and when to send them';
    public async execute({ client, message }: CommandParams) {
        let existingConfig = client.guildConfig.getGuildConfig(message.guildId!);
        if (!existingConfig) {
            existingConfig = {
                levelUpChannel: null,
                levelUpMessage: LevelUpThresholds.everyLevelPast20,
            };
        }

        const mainMessage = await message.channel.send(
            `${
                existingConfig.levelUpChannel &&
                existingConfig.levelUpMessage !== LevelUpThresholds.none
                    ? `Currently sending level up messages for **${existingConfig.levelUpMessage}** in <#${existingConfig.levelUpChannel}>`
                    : `Currently not sending level up messages to any channel`
            }\nTag the channel you want to send level up messages in, type \`skip\` to keep the same, or \`none\` to have no channel`,
        );

        const newConfig: GuildConfig = {
            levelUpChannel: existingConfig.levelUpChannel,
            levelUpMessage: existingConfig.levelUpMessage,
        };

        const filter = (collectedMessage: Message) => collectedMessage.author === message.author;
        const collector = message.channel.createMessageCollector({ filter, time: 25 * 1000 });
        collector.on('collect', async (m) => {
            switch (m.content) {
                case 'skip':
                    m.react('⏩');
                    collector.stop('got_result');
                    break;
                case 'none':
                    newConfig.levelUpChannel = null;
                    m.react('✅');
                    collector.stop('got_result');
                    break;
                default:
                    if (Client.tagsChannel.test(m.content)) {
                        const filteredChannel = Client.filterChannel(m.content);
                        console.log(filteredChannel);
                        if (await client.channels.fetch(filteredChannel)) {
                            m.react('✅');
                            collector.stop('got_result');
                            newConfig.levelUpChannel = filteredChannel;
                        } else {
                            m.react('❌');
                            mainMessage.edit(`That channel does not exist, please try again`);
                        }
                    }
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'got_result') {
                mainMessage.edit(`❌ Didn't send a response in time`);
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
                        .map(
                            (e, i) =>
                                `${i + 1}: ${e}${
                                    e === newConfig.levelUpMessage ? ` (current)` : ''
                                }`,
                        )
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
                        newConfig.levelUpMessage = levelUpOptions[Number(m.content) - 1];
                        m.react('✅');
                        collector2.stop('got_result');
                    }
                });

                collector2.on('end', async (_, reason) => {
                    if (reason !== 'got_result') {
                        secondaryMessage.edit(`❌ Didn't send a response in time`);
                    } else {
                        message.channel.send(
                            newConfig.levelUpChannel &&
                                newConfig.levelUpMessage !== LevelUpThresholds.none
                                ? `Now sending level up messages for **${newConfig.levelUpMessage}** in <#${newConfig.levelUpChannel}>`
                                : 'No longer sending level up messages to any channel',
                        );

                        client.guildConfig.setGuildConfig(message.guildId!, newConfig);
                    }
                });
            }
        });
    }
}

export default new ConfigureLevels();
