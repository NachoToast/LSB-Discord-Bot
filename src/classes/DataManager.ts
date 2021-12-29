import fs from 'fs';
import User from '../models/User';

export class DataManager {
    private _userData: { [discordID: string]: User };

    public constructor() {
        // getting the data/users.json file contents
        try {
            this._userData = JSON.parse(fs.readFileSync(`data/users.json`, 'utf-8'));
        } catch (error: any) {
            if (error?.code !== 'ENOENT') {
                console.log(error);
                process.exit();
            }
            try {
                fs.mkdirSync('data');
                fs.writeFileSync('data/users.json', JSON.stringify({}, null, 4));
            } catch (error: any) {
                if (error?.code !== 'EEXIST') {
                    console.log(error);
                    process.exit();
                }
                fs.writeFileSync('data/users.json', JSON.stringify({}, null, 4));
            }
            this._userData = {};
        }
    }

    public getUser(id: string): User | undefined {
        return this._userData[id];
    }
    public createUser(id: string, balance: number): boolean {
        if (this._userData[id] !== undefined) return false;
        this._userData[id] = {
            balance,
            registered: Date.now(),
        };
        this.save();
        return true;
    }
    public updateUserBalance(id: string, newBalance: number): boolean {
        if (this._userData[id] === undefined) return false;
        this._userData[id].balance = newBalance;
        this.save();
        return true;
    }

    private async save() {
        fs.writeFileSync(`data/users.json`, JSON.stringify(this._userData, null, 4));
    }
}

export default new DataManager();
