import { Collection } from 'discord.js';
import { CommandParams } from '../../client/Command';
import { List } from './list';

it('Lists client commands', () => {
    let sentMessage = ``;
    const mockSend = jest.fn((x) => (sentMessage = x));

    const mockCommands = new Collection();
    mockCommands.set(`fakeA`, {
        name: 'fakeA',
        description: 'fakeDescA',
    });
    mockCommands.set(`fakeB`, {
        name: 'fakeB',
        description: 'fakeDescB',
    });

    const mockClient = { commands: mockCommands };
    const mockMessage = { channel: { send: mockSend } };

    const params = {
        client: mockClient,
        message: mockMessage,
        chosenPrefix: '!',
    } as unknown as CommandParams;

    const list = new List();
    list.execute(params);
    expect(mockSend).toBeCalledTimes(1);

    expect(sentMessage).toContain(`fakeA`);
    expect(sentMessage).toContain(`fakeB`);
    expect(sentMessage).toContain(`fakeDescA`);
    expect(sentMessage).toContain(`fakeDescB`);
    expect(sentMessage).toContain(`2`);
});
