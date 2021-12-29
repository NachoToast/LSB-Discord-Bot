import Command, { CommandParams } from '../client/Command';
import { insufficientBalance, selfNotInMarket, themNotInMarket } from '../messages/basicFeedback';

class Pay implements Command {
    public readonly name: string = 'pay';
    public readonly description: string = 'Give someone some Param Pupees';

    public exampleUsage(chosenPrefix: string): string {
        return `${chosenPrefix}pay <@925613504118022204> 100`;
    }

    public async execute({ client, message, args }: CommandParams) {
        if (args.length < 2) {
            return message.channel.send(`Please tag a user to pay and an amount`);
        }
        if (!Number.isInteger(Number(args[1]))) {
            return message.channel.send(`Please specify a valid number of Param Pupees to give`);
        }

        let targetedUser: string = args[0].replace(/[<@!>]/g, '');
        let amountToPay = Number(args[1]);

        const payer = client.dataManager.getUser(message.author.id);
        if (!payer) {
            return message.channel.send(selfNotInMarket);
        }
        if (payer.balance < amountToPay) {
            return message.channel.send(insufficientBalance(payer.balance));
        }

        const payee = client.dataManager.getUser(targetedUser);
        if (!payee) {
            return message.channel.send(themNotInMarket(targetedUser));
        }

        client.dataManager.updateUserBalance(message.author.id, payer.balance - amountToPay);
        client.dataManager.updateUserBalance(targetedUser, payee.balance + amountToPay);
    }
}

export default new Pay();
