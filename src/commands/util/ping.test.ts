import { CommandParams } from '../../client/Command';
import { Ping } from './ping';

it('Gets client latency', () => {
    let sentMessage = '';
    const mockSend = jest.fn((x) => (sentMessage = x));

    const mockClient = { ws: { ping: 123 } };
    const mockMessage = { createdTimestamp: Date.now() - 1000, channel: { send: mockSend } };

    const params = { client: mockClient, message: mockMessage } as unknown as CommandParams;

    const ping = new Ping();
    ping.execute(params);
    expect(mockSend).toBeCalledTimes(1);

    expect(sentMessage).toContain('123ms');

    // we do all this to make sure the API latency is accurate,
    // because it doesn't always come out as exactly 1000ms
    const pingNumbers = sentMessage
        .split(/\s/)
        .filter((e) => e.endsWith('ms'))
        .map((e) => Number(e.slice(0, -2)));
    expect(pingNumbers.length).toEqual(2);

    pingNumbers.splice(pingNumbers.indexOf(123), 1);

    expect(pingNumbers[0]).toBeGreaterThanOrEqual(1000);
    expect(pingNumbers[0]).toBeLessThanOrEqual(1050);
});
