import fs from 'fs';

export class DataManager {
    private _balanceData: { [discordID: string]: number } = {};

    public constructor() {
        const filesToMake: [string, any][] = [['balances', {}]];

        try {
            fs.mkdirSync('data');
        } catch (error: any) {
            if (error?.code !== 'EEXIST') {
                console.log(`Error making data folder`);
                console.log(error);
                process.exit();
            }
        }

        for (const [fileName, data] of filesToMake) {
            try {
                fs.writeFileSync(`data/${fileName}.json`, JSON.stringify(data, null, 4));
            } catch (error: any) {
                if (error?.code !== 'EEXIST') {
                    console.log(`Error making file '${fileName}'`);
                    console.log(error);
                    process.exit();
                }
            }
        }

        this._balanceData = JSON.parse(fs.readFileSync('data/balances.json', 'utf8'));
    }

    public getUserBalance(id: string): number | undefined {
        return this._balanceData[id];
    }
    public createUserBalance(id: string, initialBalance: number): boolean {
        if (this._balanceData[id] !== undefined) return false;
        this._balanceData[id] = initialBalance;
        this.saveBalanceData();
        return true;
    }
    public updateUserBalance(id: string, newBalance: number): boolean {
        if (this._balanceData[id] === undefined) return false;
        this._balanceData[id] = newBalance;
        this.saveBalanceData();
        return true;
    }

    private async saveBalanceData() {
        fs.writeFileSync(`data/balances.json`, JSON.stringify(this._balanceData, null, 4));
    }
}

export default new DataManager();
