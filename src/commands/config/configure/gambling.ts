import { Message } from 'discord.js';
import Client from '../../../client/Client';
import Command, { CommandParams } from '../../../client/Command';

class ConfigureGambling implements Command {
    public name = 'gambling';
    public description = 'Configure what channel to allow slots and other gambling commands in';
    public async execute({ client, message }: CommandParams) {
        const existingConfig = client.guildConfig.getOrMakeGuildConfig(message.guildId!);

        const mainMessage = await message.channel.send(
            `${
                existingConfig.gamblingChannel
                    ? `Current gambling channel: <#${existingConfig.gamblingChannel}>`
                    : 'No current gambling channel'
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
                    existingConfig.gamblingChannel = null;
                    m.react('✅');
                    collector.stop('got_result');
                    break;
                default:
                    if (Client.tagsChannel.test(m.content)) {
                        const filteredChannel = Client.filterChannel(m.content);
                        if (await client.channels.fetch(filteredChannel)) {
                            m.react('✅');
                            existingConfig.gamblingChannel = filteredChannel;
                            collector.stop('got_result');
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
                message.channel.send(
                    existingConfig.gamblingChannel
                        ? `Set the gambling channel to <#${existingConfig.gamblingChannel}>`
                        : 'No longer have a gambling channel',
                );

                client.guildConfig.setGuildConfig(message.guildId!, existingConfig);
            }
        });
    }
}

export default new ConfigureGambling();
