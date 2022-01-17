import { Collection, Message } from 'discord.js';
import Client from '../../client/Client';
import { CommandParams } from '../../client/Command';
import { List } from './list';

describe('!list', () => {
    const send = jest.fn((e) => console.log(e));

    const commands = new Collection();
    commands.set('fakeA', {
        name: 'fakeA',
        description: 'fakeDescA',
        aliases: ['fakeAlias1', 'fakeAlias2'],
    });
    commands.set('fakeB', {
        name: 'fakeB',
        description: 'fakeDescB',
    });

    const client = { commands } as Client;
    const message = { channel: { send } } as unknown as Message;

    const params = {
        client,
        message,
        chosenPrefix: '!',
    } as CommandParams;

    const list = new List();

    it('should contain command names', async () => {
        await list.execute(params);
        expect(send).toBeCalledWith(expect.stringContaining('fakeA') && expect.stringContaining('fakeB'));
    });

    it('should contain command descriptions', async () => {
        await list.execute(params);
        expect(send).toBeCalledWith(expect.stringContaining('fakeDescA') && expect.stringContaining('fakeDescB'));
    });

    it('should list command aliases', async () => {
        await list.execute(params);
        expect(send).toBeCalledWith(expect.stringContaining('fakeAlias1') && expect.stringContaining('fakeAlias2'));
    });
});
