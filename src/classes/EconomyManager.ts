import { Message, Snowflake } from 'discord.js';
import moment from 'moment';
import Config from '../types/Config';
import { ActionCooldownTypes, EconomyUser, Pot, PupeeTransaction } from '../types/Economy';
import DataManager from './DataManager';
export default class EconomyManager {
    private _userData: { [discordID: string]: EconomyUser };
    private _userDataManager = new DataManager(
        'data/economy/users.json',
        JSON.stringify({}, undefined, 4),
    );
    private _userCooldowns: { [discordID: string]: { [key in ActionCooldownTypes]?: number } } = {};

    private _pots: { [guildId: Snowflake]: Pot } = {};
    private _potDataManager = new DataManager(
        'data/economy/pots.json',
        JSON.stringify({}, undefined, 4),
    );

    private _config: Config['economy'];

    public constructor(config: Config['economy']) {
        this._config = config;

        this._userData = JSON.parse(this._userDataManager.data);
    }

    /** This is used for when fields are missing. */
    private makeDefaultEconomyUser(): EconomyUser {
        const economyUser: EconomyUser = {
            balance: this._config.initialBalance,
            lifetimeEarnings: 100,
            transactions: [],
            lowestEverBalance: {
                amount: this._config.initialBalance,
                achieved: Date.now(),
            },
            highestEverBalance: {
                amount: this._config.initialBalance,
                achieved: Date.now(),
            },
            leftServer: false,
            miningStats: {
                timesMined: 0,
                nasaBonuses: 0,
                hourBonuses: 0,
                dayBonuses: 0,
                elonBonuses: 0,
                totalGainedFromMining: 0,
            },
            slotsStats: {
                timesGambled: 0,
                timesWon: 0,
                amountWon: 0,
                amountGambled: 0,
            },
        };
        return economyUser;
    }

    public get defaultPot(): Pot {
        const defaultPot: Pot = {
            amount: this._config.slots.initialPot,
            attempts: 0,
            createdAt: Date.now(),
        };
        return defaultPot;
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
                // TODO: make this work for nested objects
                // (current it will replace the whole thing)
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
        user.lifetimeEarnings += amountToAdd;
        this.userBalanceChecks(user);

        return user.balance;
    }

    /** Checks if the new balance of a user is higher or lower than their previously recorded highest/lowest. */
    public userBalanceChecks(user: EconomyUser, save: boolean = true): void {
        let mutated = false;
        if (user.balance < user.lowestEverBalance.amount) {
            user.lowestEverBalance = { amount: user.balance, achieved: Date.now() };
            mutated = true;
        } else if (user.balance > user.highestEverBalance.amount) {
            user.highestEverBalance = { amount: user.balance, achieved: Date.now() };
            mutated = true;
        }

        if (mutated && save) this.save();
    }

    /** Sets a user's balance, only admins should be able to use this.
     * @param {boolean} clearData Whether to clear transaction logs and highest/lowest balance info.
     */
    public setUserBalance(user: EconomyUser, newBalance: number, clearData: boolean = false): void {
        user.balance = newBalance;
        if (clearData) {
            user.lifetimeEarnings = newBalance;
            user.lowestEverBalance = { amount: user.balance, achieved: Date.now() };
            user.highestEverBalance = { amount: user.balance, achieved: Date.now() };
            user.transactions = [];
            user.slotsStats = this.makeDefaultEconomyUser().slotsStats;
            user.miningStats = this.makeDefaultEconomyUser().miningStats;
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
        const absAmount = Math.abs(amount);
        let output = `${timestampS[0].toUpperCase() + timestampS.slice(1)}: `;
        const userTo = this._userData[toID];
        if (userTo === user) {
            // someone either paid user, or took from user
            if (amount < 0)
                output += `Had **${absAmount}** Param Pupee${
                    absAmount !== 1 ? 's' : ''
                } yoinked by <@${fromID}>`;
            else
                output += `Received **${amount}** Param Pupee${
                    amount !== 1 ? 's' : ''
                } from <@${fromID}>`;
        } else {
            // user paid, or stole from
            if (amount < 0)
                output += `Stole **${absAmount}** Param Pupee${
                    absAmount !== 1 ? 's' : ''
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
            this._config.maxTransactionsRecorded,
        );
        userB.transactions = [transaction, ...userB.transactions].slice(
            0,
            this._config.maxTransactionsRecorded,
        );
        this.save();
    }

    public async save() {
        this._userDataManager.data = JSON.stringify(this._userData, undefined, 4);
    }

    /** Gets the rank of a single user. May include people who have left the server. */
    public getBalanceRanking(balance: number): number {
        let rank = 0;

        for (const key in this._userData) {
            if (this._userData[key].balance >= balance) {
                rank++;
            }
        }

        return rank;
    }

    /** @deprecated Use `addToPot` and `winPot` instead. */
    public slots(user: EconomyUser, amountGambled: number, amountWon?: number) {
        user.slotsStats.timesGambled++;
        user.slotsStats.amountGambled += amountGambled;
        user.balance -= amountGambled;
        if (amountWon) {
            user.slotsStats.timesWon++;
            user.balance += amountWon;
            user.slotsStats.amountWon += amountWon;
        }
        this.userBalanceChecks(user);
        this.save();
    }

    private readonly sortByBalance = (a: string, b: string): number =>
        this._userData[b].balance - this._userData[a].balance;

    public getTopBalance(numUsers: number = 10): (EconomyUser & { id: string })[] {
        // TODO: smarter way of doing this, so we only need to recalculate rankings on balance change,
        // otherwise we can get a stored list
        return Object.keys(this._userData)
            .sort(this.sortByBalance)
            .slice(0, numUsers)
            .map((id) => {
                return {
                    ...this._userData[id],
                    id,
                };
            });
    }

    /** Generate a random amount of Param Pupees
     * @returns {number | { amount: number; saveCallback: (newUser: EconomyUser) => void }}
     * A number represing time until this can be called in seconds, or
     * The amount mined, and a function to save that once applied externally.
     */
    public mine(
        id: string,
    ): number | { amount: number; saveCallback: (newUser: EconomyUser) => void } {
        const { min_yield: min, max_yield: max, cooldown_seconds: cooldown } = this._config.mine;

        if (this._userCooldowns[id]?.[ActionCooldownTypes.mine]) {
            const lastMined = this._userCooldowns[id][ActionCooldownTypes.mine]!;
            return cooldown - Math.floor((Date.now() - lastMined) / 1000);
        }

        if (!this._userCooldowns[id]) {
            this._userCooldowns[id] = {};
        }
        this._userCooldowns[id][ActionCooldownTypes.mine] = Date.now();
        setTimeout(() => {
            delete this._userCooldowns[id][ActionCooldownTypes.mine];
        }, cooldown * 1000);

        const amount = min + Math.floor(Math.random() * (max - min));

        return {
            amount,
            saveCallback: (newUser) => {
                this.save();
                this.userBalanceChecks(newUser);
            },
        };
    }

    public getPot(guildId: string): Pot | undefined {
        return this._pots[guildId];
    }

    public getOrMakePot(guildId: string): Pot {
        const existingPot = this.getPot(guildId);
        if (!existingPot) {
            const defaultPot = this.defaultPot;
            this._pots[guildId] = defaultPot;
            return defaultPot;
        }
        return existingPot;
    }

    public addToPot(pot: Pot, economyUser: EconomyUser, amount: number) {
        pot.attempts++;
        pot.amount += amount;
        economyUser.balance -= amount;

        economyUser.slotsStats.amountGambled += amount;
        economyUser.slotsStats.timesGambled++;
        this.userBalanceChecks(economyUser, false);
        this.save();
        this.savePots();
    }

    public winPot(pot: Pot, economyUser: EconomyUser, guildId: Snowflake) {
        delete this._pots[guildId];
        economyUser.balance += pot.amount;
        economyUser.lifetimeEarnings += pot.amount;
        economyUser.slotsStats.amountWon += pot.amount;
        economyUser.slotsStats.timesWon++;
        this.userBalanceChecks(economyUser, false);
        this.save();
        this.savePots();
    }

    private savePots() {
        this._potDataManager.data = JSON.stringify(this._pots, undefined, 4);
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
