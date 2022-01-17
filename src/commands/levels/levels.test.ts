import { Message, MessageOptions } from 'discord.js';
import Client from '../../client/Client';
import { CommandParams } from '../../client/Command';
import { FullLevelUser } from '../../types/UserModels';
import { Levels } from './levels';

describe('!levels', () => {
    const rankOneUser: FullLevelUser = {
        id: '1',
        level: 1,
        xp: 100,
        leftServer: false,
    };
    const rankTwoUser: FullLevelUser = {
        id: '2',
        level: 1,
        xp: 80,
        leftServer: false,
    };
    const rankThreeUser: FullLevelUser = {
        id: '3',
        level: 1,
        xp: 70,
        leftServer: false,
    };

    const members: FullLevelUser[] = [rankOneUser, rankTwoUser, rankThreeUser];

    const getUserRanking = jest.fn(() => members);

    let output: MessageOptions = {};
    const send = jest.fn((e: MessageOptions) => (output = e));

    const client = { levels: { getUserRanking, validationProgress: 100 } } as unknown as Client;
    const message = { channel: { send }, guild: { members, iconURL: jest.fn } } as unknown as Message;

    const params = { client, message } as CommandParams;

    const levels = new Levels();

    it('should not go if validation is incomplete', async () => {
        client.levels.validationProgress = 99;
        await levels.execute(params);
        expect(getUserRanking).toBeCalledTimes(0);
        client.levels.validationProgress = 100;
    });

    it('should display the correct order', async () => {
        await levels.execute(params);
        expect(getUserRanking).toBeCalledWith(members);

        const outputLevels = output.embeds[0].description
            .toLowerCase()
            .split('\n')
            .filter((e) => e.includes('level'));
        console.log(outputLevels);

        expect(outputLevels[0]).toContain('<@1>');
        expect(outputLevels[1]).toContain('<@2>');
        expect(outputLevels[2]).toContain('<@3>');
    });
});
