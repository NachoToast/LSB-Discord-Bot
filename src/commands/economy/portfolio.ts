import { MessageEmbed } from 'discord.js';
import moment, { min } from 'moment';
import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';

class Portfolio implements Command {
    public readonly name: string = 'portfolio';
    public readonly description: string = 'Get information about a user in the market';
    public readonly aliases: string[] | undefined = ['profile', 'user', 'port', 'wallet'];

    public async execute({ client, message, args }: CommandParams) {
        const targetedUser = await Client.getTargetUser(message, args);
        if (!targetedUser) {
            return message.channel.send(`That user doesn't exist, or isn't in the server`);
        }

        const user = client.economy.getUser(targetedUser.id);
        if (!user) {
            if (targetedUser !== message.member) {
                message.channel.send(`That user doesn't have anything in their portfolio`);
            } else {
                message.channel.send(`You don't have anything in your portfolio`);
            }
            return;
        }

        const description: string[] = [
            `Balance: **${user.balance}** Param Pupee${
                user.balance !== 1 ? 's' : ''
            } (Rank **#${client.economy.getBalanceRanking(user.balance)}**)`,
            `Highest Ever Balance: **${user.highestEverBalance.amount}** Param Pupee${
                user.highestEverBalance.amount !== 1 ? 's' : ''
            } (achieved ${moment(user.highestEverBalance.achieved).fromNow()})`,
            `Lowest Ever Balance: **${user.lowestEverBalance.amount}** Param Pupee${
                user.lowestEverBalance.amount !== 1 ? 's' : ''
            } (achieved ${moment(user.lowestEverBalance.achieved).fromNow()})`,
        ];

        const messageEmbed = new MessageEmbed()
            .setColor('#32CD32')
            .setTitle(`💰 ${targetedUser.user.username}'s Portfolio`)
            .setDescription(description.join('\n'))
            .setThumbnail(targetedUser.user.avatarURL() || '');

        if (user.transactions.length) {
            let shownTransactions = '';
            let displayedCount = 0;
            for (const transaction of user.transactions) {
                const newlyDisplayed =
                    shownTransactions + '\n' + client.economy.transactionReport(user, transaction);
                if (newlyDisplayed.length > 1024) break;
                shownTransactions = newlyDisplayed;
                displayedCount++;
            }
            if (shownTransactions) {
                messageEmbed.addField(`Transaction History (${displayedCount})`, shownTransactions);
            }

            if (displayedCount !== user.transactions.length) {
                messageEmbed.setFooter(
                    `Showing ${displayedCount} of ${user.transactions.length} Recorded Transactions`,
                );
            }
        }

        if (user.miningStats.timesMined > 0) {
            const { timesMined, nasaBonuses, hourBonuses, elonBonuses, totalGainedFromMining } =
                user.miningStats;
            const miningStats: string[] = [`Times Mined: **${timesMined}**`];
            if (nasaBonuses) miningStats.push(`Nasa Bonuses: **${nasaBonuses}**`);
            if (hourBonuses) miningStats.push(`Hour Bonuses: **${hourBonuses}**`);
            if (elonBonuses) miningStats.push(`Elon Bonuses: **${elonBonuses}**`);
            miningStats.push(`Total Mined: **${totalGainedFromMining}**`);

            messageEmbed.addField(`⛏️  Mining Stats`, miningStats.join('\n'), true);
        }

        message.channel.send({ embeds: [messageEmbed] });
    }
}

export default new Portfolio();
