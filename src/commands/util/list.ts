import Command, { CommandParams } from '../../client/Command';

class List implements Command {
    public readonly name: string = 'list';
    public readonly description: string = 'List all the commands';
    public readonly aliases: string[] | undefined = ['l'];

    public async execute({ client, message, chosenPrefix }: CommandParams) {
        const allCommands = client.commands.map(
            ({ exampleUsage, name, description, aliases }) =>
                `**${
                    exampleUsage ? exampleUsage(chosenPrefix) : `${chosenPrefix}${name}`
                }** - ${description}${aliases ? ` - Aliases: \`${aliases.join('`, `')}\`` : ''}`,
        );

        message.channel.send(
            `📝 I have ${client.commands.size} commands:\n${allCommands.join('\n')}`,
        );
    }
}

export default new List();
