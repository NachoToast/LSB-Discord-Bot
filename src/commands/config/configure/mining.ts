import { Message } from 'discord.js';
import Client from '../../../client/Client';
import Command, { CommandParams } from '../../../client/Command';

class ConfigureMining implements Command {
    public name = 'mining';
    public description = 'Configure what channel to allow mining in';
    public async execute({ client, message }: CommandParams) {
        const existingConfig = client.guildConfig.getOrMakeGuildConfig(message.guildId!);

        const mainMessage = await message.channel.send(
            `${
                existingConfig.miningChannels
                    ? `Current mining channels: <#${existingConfig.miningChannels.join('>, <#')}>`
                    : 'No current mining channels'
            }\nTag new channels (1 per message) to add them to the list, and tag existing ones to remove them. You can type \`none\` to clear the list entirely. Type \`done\` when done.`,
        );

        const filter = (collectedMessage: Message) => collectedMessage.author === message.author;
        const collector = message.channel.createMessageCollector({ filter, time: 30 * 1000 });
        collector.on('collect', async (m) => {
            switch (m.content) {
                case 'done':
                    m.react('⏩');
                    collector.stop('got_result');
                    break;
                case 'none':
                    existingConfig.miningChannels = null;
                    m.react('✅');
                    await mainMessage.edit(
                        'No current mining channels\nTag new channels to add them to the list, and tag existing ones to remove them. You can type `none` to clear the list entirely. Type `done` when done.',
                    );
                    break;
                default:
                    if (Client.tagsChannel.test(m.content)) {
                        const filteredChannel = Client.filterChannel(m.content);
                        if (await client.channels.fetch(filteredChannel)) {
                            if (existingConfig.miningChannels) {
                                const index = existingConfig.miningChannels.indexOf(filteredChannel);
                                if (index !== -1) {
                                    m.react('❎');
                                    existingConfig.miningChannels.splice(index, 1);
                                    if (!existingConfig.miningChannels.length) {
                                        existingConfig.miningChannels = null;
                                    }
                                } else {
                                    m.react('✅');
                                    existingConfig.miningChannels.push(filteredChannel);
                                }
                            } else {
                                m.react('✅');
                                existingConfig.miningChannels = [filteredChannel];
                            }
                            await mainMessage.edit(
                                `${
                                    existingConfig.miningChannels
                                        ? `Current mining channels: <#${existingConfig.miningChannels.join('>, <#')}>`
                                        : 'No current mining channels'
                                }\nTag new channels to add them to the list, and tag existing ones to remove them. You can type \`none\` to clear the list entirely. Type \`done\` when done.`,
                            );
                        } else {
                            m.react('❌');
                            mainMessage.edit('That channel does not exist, please try again');
                        }
                    }
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'got_result') {
                message.channel.send("❌ Didn't send a response in time");
            } else {
                client.guildConfig.setGuildConfig(message.guildId!, existingConfig);
            }
        });
    }
}

export default new ConfigureMining();
