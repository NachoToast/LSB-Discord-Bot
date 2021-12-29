import Command, { CommandParams } from '../client/Command';

class Join implements Command {
    public readonly name: string = 'join';
    public readonly description: string = 'Join the markest and start trading';
    public readonly aliases: string[] | undefined = ['j'];

    public async execute({ client, message }: CommandParams) {
        const newUser = client.dataManager.createUserBalance(
            message.author.id,
            client.initialBalance,
        );
        if (newUser) {
            message.channel.send(
                `Successfully joined the market, you now have **${client.initialBalance}** Param Pupees!`,
            );
        } else {
            message.channel.send(`Failed to join the market, please contact NachoToast :P`);
        }
    }
}

export default new Join();
