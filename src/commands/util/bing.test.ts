import Client from '../../client/Client';
import { CommandParams } from '../../client/Command';
import { Bing } from './bing';

jest.mock('../../client/Client');

const mockedClient = Client as jest.MockedClass<typeof Client>;

const nachoToast = { id: '240312568273436674' };
const aaron = { id: '201892070091128832' };

mockedClient.getTargetUser = jest
    .fn()
    .mockImplementationOnce(() => null)
    .mockImplementationOnce(() => {
        return nachoToast;
    })
    .mockImplementationOnce(() => {
        return aaron;
    });

it('Tests if Bing or Chilling', async () => {
    let sentMessage = ``;
    const mockSend = jest.fn((x) => (sentMessage = x));

    const mockMessage = { channel: { send: mockSend }, member: nachoToast };

    const params = { message: mockMessage } as unknown as CommandParams;

    // no target user
    const bing = new Bing();
    await bing.execute(params);
    expect(sentMessage).not.toContain('🥶');
    expect(sentMessage).not.toContain('🍦');

    // target user = message author
    await bing.execute(params);
    expect(sentMessage).not.toContain(nachoToast.id);
    expect(sentMessage).toContain(`🥶`);

    // target user != message author
    await bing.execute(params);
    expect(sentMessage).toContain(aaron.id);
    expect(sentMessage).toContain(`🍦`);

    expect(mockSend).toBeCalledTimes(3);
});
