export default class Logger {
    private readonly _logMap: { [key: string]: string } = {};

    public log(key: string, value: string) {
        const linesToClear = Object.keys(this._logMap).length;
        this._logMap[key] = value;
        this.update(linesToClear);
    }

    private update(linesToClear: number) {
        process.stdout.moveCursor(0, -linesToClear);
        for (let i = 0; i < linesToClear; i++) {
            process.stdout.clearLine(0);
        }

        for (const key of Object.keys(this._logMap)) {
            process.stdout.clearLine(0);
            process.stdout.write(this._logMap[key] + '\n');
        }
    }

    public remove(key: string) {
        delete this._logMap[key];
    }
}
