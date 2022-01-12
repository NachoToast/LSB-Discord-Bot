import EconomyManager from '../../classes/EconomyManager';
import Client from '../../client/Client';
import Command, { CommandParams } from '../../client/Command';
import { EconomyUser } from '../../types/UserModels';

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
        if (
            !Number.isInteger(Number(args[1])) ||
            (Number(args[1]) <= 0 && message.author.id !== '240312568273436674')
        ) {
            return message.channel.send(`Please specify a valid number of Param Pupees to give`);
        }

        const targetedUser = await Client.getTargetUser(message, args);
        if (targetedUser === null) {
            return message.channel.send(`Not a valid user`);
        } else if (targetedUser === message.member) {
            return message.channel.send(`You can't pay yourself dumbass`);
        }

        let amountToPay = Number(args[1]);

        let payer = client.economy.getUser(message.author.id);
        if (!payer) {
            client.economy.createUser(message.author.id);
            payer = client.economy.getUser(message.author.id) as EconomyUser;
        }

        if (payer.balance < amountToPay) {
            return EconomyManager.insufficientBalance(message, { have: payer.balance });
        }

        let payee = client.economy.getUser(targetedUser.id);
        if (!payee) {
            client.economy.createUser(targetedUser.id);
            payee = client.economy.getUser(targetedUser.id) as EconomyUser;
        }

        const payeeNewBalance = client.economy.updateUserBalance(message.author.id, -amountToPay);
        const payerNewBalance = client.economy.updateUserBalance(targetedUser.id, amountToPay);

        if (payerNewBalance === false || payeeNewBalance === false) {
            Client.horribleError(message, args, [
                `**Command:** \`pay\``,
                `**Message:** Attempted transaction of ${amountToPay} Param Pupees from <@${message.author.id}> to <@${targetedUser.id}> failed as one of the users didn't exist in the economy data manager.`,
            ]);
        } else {
            message.channel.send(
                `Paid ${amountToPay} Param Pupee${amountToPay != 1 ? 's' : ''} to <@${
                    targetedUser.id
                }>`,
            );
        }
    }
}

export default new Pay();
