const https = require('https');
const fs = require('fs');

console.log(
    `Mee6 level data porting here! Please paste your server ID into the console and hit enter.`,
);

const serverRegexp = new RegExp(/^[0-9]{17,18}$/);

process.stdin.on('data', (data) => {
    const serverId = data.toString().trim().replace('\n', '');
    if (serverRegexp.test(serverId)) {
        main(serverId);
    } else {
        console.log(`That doesn't seem like a valid server ID`);
    }
});

function main(serverId) {
    const options = {
        hostname: 'mee6.xyz',
        port: 443,
        path: `/api/plugins/levels/leaderboard/${serverId}`,
        method: 'GET',
    };

    const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
            if (res.statusCode !== 404) {
                console.log(`Got unknown status code: ${res.statusCode}`);
            } else {
                console.log(`Couldn't find that server on Mee6 records, is Mee6 still in it?`);
            }
            process.exit();
        }

        let data = ``;

        res.on('data', (d) => {
            data += d;
        });

        res.on('close', () => {
            handleData(data);
            process.exit();
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.end();
}

function handleData(data) {
    data = JSON.parse(data);
    console.log(`Processing ${data.players.length} Users`);

    const importantData = [];
    for (const user of data.players) {
        const { id, level, xp } = user;
        importantData.push({ id, level, xp });
    }

    try {
        fs.mkdirSync('archive');
    } catch (error) {
        if (error?.code !== 'EEXIST') {
            console.log(error);
            process.exit();
        }
    }

    try {
        fs.writeFileSync('archive/mee6.json', JSON.stringify(importantData, undefined, 4));
    } catch (error) {
        console.log(error);
        process.exit();
    }
}
