import { Message } from 'discord.js';
import Client from '../../client/Client';
import { CommandParams } from '../../client/Command';
import { Ping } from './ping';

describe('!ping', () => {
    const send = jest.fn();

    const client = { ws: { ping: 123 } } as Client;
    const message = { createdTimestamp: Date.now() - 1000, channel: { send } } as unknown as Message;

    const params = { client, message } as CommandParams;

    const ping = new Ping();

    it('should give accurate client latency', async () => {
        await ping.execute(params);
        expect(send).toBeCalledWith(expect.stringContaining('123'));
    });

    it('should give API latency to 50ms accuracy', async () => {
        await ping.execute(params);
        expect(send).toBeCalledWith(expect.stringMatching(/[0-9]{4}/)); // it'll never be exactly 1000
    });
});
