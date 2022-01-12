import { Message } from 'discord.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { EconomyUser } from '../types/Economy';
import DataManager from './DataManager';

export interface EconomyManagerEvents {
    backgroundValidation: (current: number, total: number) => void;
}

export default class EconomyManager extends TypedEmitter<EconomyManagerEvents> {
    private _userData: { [discordID: string]: EconomyUser };
    private _userDataManager: DataManager;
    public initialBalance: number;

    public constructor(initialBalance: number) {
        super();
        this.initialBalance = initialBalance;
        this._userDataManager = new DataManager(
            'data/economy/users.json',
            JSON.stringify({}, undefined, 4),
        );

        this._userData = JSON.parse(this._userDataManager.data);
    }

    public async validateTransactionHistory(save: boolean = true) {
        const objKeys = Object.keys(this._userData);

        if (objKeys.filter((key) => this._userData[key].transactions === undefined).length === 0) {
            // no validation needed;
            this.emit('backgroundValidation', -1, -1);
            return;
        }

        const len = objKeys.length;
        let progress = 0;
        for (let i = 0; i < len; i++) {
            const id = objKeys[i];
            if (this._userData[id].transactions === undefined) {
                this._userData[id].transactions = [];
                if (save) this.save();
                await new Promise<void>((resolve) => {
                    setTimeout(() => resolve(), 1000);
                });
            }
            progress++;
            this.emit('backgroundValidation', progress, len);
        }

        this.emit('backgroundValidation', progress, len);
    }

    /** Gets a user if they exist, undefined otherwise. */
    public getUser(id: string): EconomyUser | undefined {
        const user = this._userData[id];
        if (user === undefined) return undefined;
        if (!user?.transactions) {
            user.transactions = [];
            this.save();
        }
        return user;
    }

    /** Makes a user if they don't exist.
     * @param {number?} initialBalance How many Param Pupees this user starts with, default specified in `config.json`
     * @returns {boolean} Whether the creation was a success.
     */
    public createUser(id: string, initialBalance: number = this.initialBalance): boolean {
        if (this._userData[id] !== undefined) return false;
        this._userData[id] = {
            balance: initialBalance,
            transactions: [],
        };
        this.save();
        return true;
    }

    /** Adds to the balance of a user (you can use negative numbers to take away).
     * @returns {number} The new balance of the user.
     */
    public updateUserBalance(id: string, amountToAdd: number): number {
        if (!this._userData[id]) this.createUser(id);
        this._userData[id].balance += amountToAdd;
        this.save();
        return this._userData[id].balance;
    }

    public addUserTransaction(personA: string, amount: number, personB: string) {
        if (!this._userData[personA]) this.createUser(personA);
        if (!this._userData[personB]) this.createUser(personB);
    }

    private async save() {
        this._userDataManager.data = JSON.stringify(this._userData, undefined, 4);
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
