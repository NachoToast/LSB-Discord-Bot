import { Message } from 'discord.js';
import { EconomyUser } from '../types/UserModels';
import DataManager from './DataManager';

export default class EconomyManager {
    private _userData: { [discordID: string]: EconomyUser };
    private _userDataManager: DataManager;
    public initialBalance: number;

    public constructor(initialBalance: number) {
        this.initialBalance = initialBalance;
        this._userDataManager = new DataManager(
            'data/economy/users.json',
            JSON.stringify({}, undefined, 4),
        );

        this._userData = JSON.parse(this._userDataManager.data);
    }

    /** Gets a user if they exist, undefined otherwise. */
    public getUser(id: string): EconomyUser | undefined {
        return this._userData[id];
    }

    /** Makes a user if they don't exist.
     * @param {number?} initialBalance How many Param Pupees this user starts with, default specified in `config.json`
     * @returns {boolean} Whether the creation was a success.
     */
    public createUser(id: string, initialBalance: number = this.initialBalance): boolean {
        if (this._userData[id] !== undefined) return false;
        this._userData[id] = {
            balance: initialBalance,
        };
        this.save();
        return true;
    }

    /** Adds to the balance of a user (you can use negative numbers to take away).
     * @returns {false | number} The new balance of the user, or `false` if they did not exist.
     */
    public updateUserBalance(id: string, amountToAdd: number): false | number {
        if (this._userData[id] === undefined) return false;
        this._userData[id].balance += amountToAdd;
        this.save();
        return this._userData[id].balance;
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
