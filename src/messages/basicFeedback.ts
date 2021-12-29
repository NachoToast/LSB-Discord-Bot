import Client from '../client/Client';

export const selfNotInMarket = `You haven't joined the market yet, type \`!join\` to get started`;
export const themNotInMarket = (id: string) =>
    Client.filterMentions(`<@${id}> hasn't joined the market yet`, true);

export const insufficientBalance = (have: number, need?: number) =>
    `You don't have enough Param Pupees to do this (have ${have}${need ? `, need ${need}` : ''})`;
