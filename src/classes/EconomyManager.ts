import { Message } from 'discord.js';
import moment from 'moment';
import Config from '../types/Config';
import { EconomyUser, PupeeTransaction } from '../types/Economy';
import DataManager from './DataManager';
export default class EconomyManager {
    private _userData: { [discordID: string]: EconomyUser };
    private _userDataManager: DataManager;
    public initialBalance: number;
    public maxTransactionsRecorded: number;

    public constructor({ initialBalance, maxTransactionsRecorded }: Config['economy']) {
        this.initialBalance = initialBalance;
        this.maxTransactionsRecorded = maxTransactionsRecorded;

        this._userDataManager = new DataManager(
            'data/economy/users.json',
            JSON.stringify({}, undefined, 4),
        );

        this._userData = JSON.parse(this._userDataManager.data);
    }

    /** This is used for when fields are missing. */
    private makeDefaultEconomyUser(): EconomyUser {
        const economyUser: EconomyUser = {
            balance: this.initialBalance,
            transactions: [],
            lowestEverBalance: {
                amount: this.initialBalance,
                achieved: Date.now(),
            },
            highestEverBalance: {
                amount: this.initialBalance,
                achieved: Date.now(),
            },
            leftServer: false,
        };
        return economyUser;
    }

    /** Gets a user if they exist, undefined otherwise. */
    public getUser(id: string): EconomyUser | undefined {
        const user = this._userData[id];
        if (user === undefined) {
            return;
        }

        const defaultUser = this.makeDefaultEconomyUser();

        let mutatedUser = false;
        let userKeys = Object.keys(user);
        for (const key of Object.keys(defaultUser) as (keyof EconomyUser)[]) {
            if (!userKeys.includes(key)) {
                mutatedUser = true;
                // @ts-ignore
                user[key] = defaultUser[key];
            }
        }
        if (mutatedUser) this.save();
        return user;
    }

    public getOrMakeUser(id: string): EconomyUser {
        return this.createUser(id);
    }

    /** Makes a user if they don't exist.
     * @returns {EconomyUser} The user it just made, or that already existed.
     */
    public createUser(id: string): EconomyUser {
        const existingUser = this.getUser(id);
        if (!existingUser) {
            const newUser = this.makeDefaultEconomyUser();
            this._userData[id] = newUser;
            this.save();
            return newUser;
        }
        return existingUser;
    }

    /** Adds to the balance of a user (you can use negative numbers to take away).
     * @returns {number} The new balance of the user.
     */
    public updateUserBalance(user: EconomyUser, amountToAdd: number): number {
        user.balance += amountToAdd;
        this.userBalanceChecks(user);

        return user.balance;
    }

    /** Checks if the new balance of a user is higher or lower than their previously recorded highest/lowest. */
    private userBalanceChecks(user: EconomyUser): void {
        let mutated = false;
        if (user.balance < user.lowestEverBalance.amount) {
            user.lowestEverBalance = { amount: user.balance, achieved: Date.now() };
            mutated = true;
        } else if (user.balance > user.highestEverBalance.amount) {
            user.highestEverBalance = { amount: user.balance, achieved: Date.now() };
            mutated = true;
        }

        if (mutated) this.save();
    }

    /** Sets a user's balance, only admins should be able to use this.
     * @param {boolean} clearData Whether to clear transaction logs and highest/lowest balance info.
     */
    public setUserBalance(user: EconomyUser, newBalance: number, clearData: boolean = true): void {
        user.balance = newBalance;
        if (clearData) {
            user.lowestEverBalance = { amount: user.balance, achieved: Date.now() };
            user.highestEverBalance = { amount: user.balance, achieved: Date.now() };
            user.transactions = [];
        } else {
            this.userBalanceChecks(user);
        }
        this.save();
    }

    /** Makes a string detailing a transaction. */
    public transactionReport(
        user: EconomyUser,
        { toID, fromID, amount, timestamp }: PupeeTransaction,
    ): string {
        const timestampS = moment(timestamp).fromNow();
        let output = `${timestampS[0].toUpperCase() + timestampS.slice(1)}: `;
        const userTo = this._userData[toID];
        if (userTo === user) {
            // someone either paid user, or took from user
            if (amount < 0)
                output += `Had **${Math.abs(amount)}** Param Pupee${
                    amount !== 1 ? 's' : ''
                } yoinked by <@${fromID}>`;
            else
                output += `Received **${amount}** Param Pupee${
                    amount !== 1 ? 's' : ''
                } from <@${fromID}>`;
        } else {
            // user paid, or stole from
            if (amount < 0)
                output += `Stole **${Math.abs(amount)}** Param Pupee${
                    amount !== 1 ? 's' : ''
                } from <@${toID}>`;
            else output += `Gave **${amount}** Param Pupee${amount !== 1 ? 's' : ''} to <@${toID}>`;
        }
        return output;
    }

    /** Makes a monetary transaction record for 2 users.
     * @param {EconomyUser} personA Person who initiated the transaction.
     * @param {EconomyUser} personB Person who accepted the transaction.
     */
    public addUserTransaction(personA: string, amount: number, personB: string) {
        const transaction: PupeeTransaction = {
            fromID: personA,
            toID: personB,
            amount,
            timestamp: Date.now(),
        };

        const userA = this.getOrMakeUser(personA);
        const userB = this.getOrMakeUser(personB);

        userA.transactions = [transaction, ...userA.transactions].slice(
            0,
            this.maxTransactionsRecorded,
        );
        userB.transactions = [transaction, ...userB.transactions].slice(
            0,
            this.maxTransactionsRecorded,
        );
        this.save();
    }

    private async save() {
        this._userDataManager.data = JSON.stringify(this._userData, undefined, 4);
    }

    /** Gets the rank of a single user. May include people who have left the server. */
    private getBalanceRanking(balance: number): number {
        let rank = 1;

        for (const key in this._userData) {
            if (this._userData[key].balance >= balance) {
                rank++;
            }
        }

        return rank;
    }

    public static insufficientBalance(
        message: Message,
        { have, need }: { have?: number; need?: number },
    ): void {
        let msg = `You don't have enough Param Pupees to do that`;
        if (have !== undefined && need !== undefined) {
            msg += ` (have ${have}, need ${need})`;
        } else if (have !== undefined) {
            msg += ` (have ${have})`;
        } else if (need !== undefined) {
            msg += ` (need ${need})`;
        }

        message.channel.send(msg);
    }
}
