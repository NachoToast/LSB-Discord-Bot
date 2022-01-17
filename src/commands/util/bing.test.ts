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

describe('!bing', () => {
    const send = jest.fn();
    const message = { channel: { send }, member: nachoToast };

    const params = { message } as unknown as CommandParams;

    const bing = new Bing();

    it('handles no target user', async () => {
        await bing.execute(params);
        expect(send).toBeCalledWith(expect.not.stringContaining('🥶') && expect.not.stringContaining('🍦'));
    });

    it('handles message author being bing', async () => {
        await bing.execute(params);
        expect(send).toBeCalledWith(expect.stringContaining('🥶') && expect.not.stringContaining(nachoToast.id));
    });

    it('handles target user being chilling', async () => {
        await bing.execute(params);
        expect(send).toBeCalledWith(expect.stringContaining('🍦') && expect.stringContaining(aaron.id));
    });
});
