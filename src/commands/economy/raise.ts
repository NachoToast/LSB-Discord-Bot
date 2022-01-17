import Command, { CommandParams } from '../../client/Command';

class Raise implements Command {
    public name = 'raise';
    public description = 'See if you can get a raise';

    public async execute({ message }: CommandParams) {
        message.channel.send('No raise for you');
    }
}

export default new Raise();
