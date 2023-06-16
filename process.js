const csv = require('csv-parser');
const csvw = require('csv-writer').createObjectCsvWriter;
const fs = require(`fs`);
const https = require(`https`);
var ytdl = require(`ytdl-core`);
var child = require(`child_process`);
var readline = require(`readline`);

const csvFile = `./unlistedVideos.csv`;
const outcsvFile = `./processedUnlisted.csv`;
const onlyUnlisted = true;

const headers = [
    { id: 'id', title: 'id' },
    { id: 'videoid', title: 'videoID' },
    { id: `views`, title: `views` },
    { id: 'author', title: 'author' },
    { id: 'title', title: 'title' },
    { id: `upload`, title: `upload` },
    { id: `tags`, title: `tags` },
    { id: `category`, title: `category` },
];
const csvWriter = csvw({
    path: outcsvFile,
    append: true,
    header: headers
});
if (!fs.existsSync(outcsvFile)) fs.writeFileSync(outcsvFile, headers.flatMap(x => x.id).join(`,`) + `\n`);

function countRowsInCsv(filePath) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity // Detect line breaks properly
        });
        let rowCount = 0;
        rl.on('line', (line) => rowCount++);
        rl.on('close', () => resolve(rowCount));
        rl.on('error', (error) => reject(error));
    });
}

function getVideoIDs() {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(outcsvFile),
            crlfDelay: Infinity // Detect line breaks properly
        });
        let ids = [];
        rl.on('line', l => !Number.isNaN(l.split(`,`)[1]) ? ids.push(l.split(`,`)[1]) : null);
        rl.on('close', () => resolve(ids));
        rl.on('error', (error) => reject(error));
    });
}

function getLastId() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(outcsvFile)) return resolve(-1);
        const rl = readline.createInterface({
            input: fs.createReadStream(outcsvFile),
            crlfDelay: Infinity // Detect line breaks properly
        });
        let line = ``;
        rl.on('line', l => line = l);
        rl.on('close', () => {
            //console.log(`Last line: ${line}`);
            resolve(line.split(`,`)[0])
        });
        rl.on('error', (error) => reject(error));
    });
}

async function getSkip(id = getLastId()) {
    id = await id;
    if (id == -1) return 1;
    return new Promise((resolve, reject) => {
        console.log(`last id:${id}`);
        const rl = readline.createInterface({
            input: fs.createReadStream(csvFile),
            crlfDelay: Infinity // Detect line breaks properly
        });
        let rowCount = 0;
        rl.on('line', (line) => {
            rowCount++;
            if (line.endsWith(`,${id}`))
                resolve(rowCount);
        });
        rl.on('close', () => resolve(rowCount));
        rl.on('error', (error) => reject(error));
    });
}

function getHeaders(filePath) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity // Detect line breaks properly
        });
        rl.on('line', (line) => {
            resolve(line.split(`,`));
            rl.close();
        });
    });
}

(async () => {

    var logs = [];
    function log(msg) {
        logs.push(msg);
        if (logs.length > process.stdout.rows - 1) logs.shift();
        updateLogs();
    }

    function formatMilliseconds(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (seconds > 0 || result === '') result += `${seconds}s`;

        return result;
    }

    var pings = [];
    const total = await countRowsInCsv(csvFile);
    var doneCount = 0;
    function updateLogs() {
        const sum = pings.reduce((a, b) => a + b, 0);
        const avg = Math.floor(sum / pings.length) || 0;
        const left = formatMilliseconds((total - doneCount) * avg);

        var content = logs.join(`\n`);
        content += Array(process.stdout.rows - logs.length + 1).join(`\n`);
        content += `avg:${avg}ms `.padEnd(11);
        content += `done:${doneCount}/${total} `.padEnd(15);
        content += ` (\x1b[36m${(doneCount / total * 100).toFixed(2)}%\x1b[0m) `.padEnd(5);

        content += `left:${left} `.padEnd(10);
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);

        process.stdout.write(content);
    }

    updateLogs();

    //return console.log((await ytdl.getInfo(`Uw-NW99YtwE`)).videoDetails.storyboards);
    var vIDs = await getVideoIDs();
    if (!fs.existsSync(csvFile)) {
        new Promise(r => {
            https.get(`https://mirror.sb.mchang.xyz/unlistedVideos.csv`)
                .pipe(fs.createWriteStream(csvFile))
                .on(`close`, () => {
                    console.log(`Databse download complete!`);
                    r();
                })
        })
    }

    const skipped = await getSkip();
    doneCount = skipped;
    if (skipped != 1)
        console.log(`Skipping ${skipped} lines..`);
    var readS = fs.createReadStream(csvFile)
        .pipe(csv({
            headers: await getHeaders(csvFile),
            skipLines: skipped,
        }))
        .on('data', async x => {
            doneCount++;
            //console.log(x);
            if (vIDs.includes(x.videoID)) return console.log(`Duplicate ${x.id}`);
            log([
                x.id,
                new Date(Number(x.timeSubmitted)).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                x.videoID,
            ].join(` | `));
            readS.pause();

            var startT = new Date();
            function endPing() {
                pings.push(new Date() - startT);
                if (pings.length > 200) pings.shift();
            }
            try {
                var info = await ytdl.getInfo(x.videoID);
            } catch (err) {
                if (![`private`, `401`, `video unavailable`].some(x => String(err).toLowerCase().includes(x))) console.log(err);
                readS.resume();
                endPing()
                return;
            }
            endPing();
            //console.log(info);

            if (!onlyUnlisted || (onlyUnlisted && info.videoDetails.isUnlisted)) {
                const data = [
                    {
                        id: x.id,
                        videoid: x.videoID,
                        views: info.videoDetails.viewCount,
                        title: info.videoDetails.title,
                        author: info.videoDetails.author.name,
                        upload: info.videoDetails.uploadDate,
                        tags: info.videoDetails.keywords ? info.videoDetails.keywords.join(`,`) : null,
                        category: info.videoDetails.category
                    }
                ];

                log(`\u001b[32m${data[0].title}\u001b[39m`);
                csvWriter.writeRecords(data)
                    .catch((err) => console.error(`Error writing CSV file: ${err}`));
                vIDs.push(x.videoID);
            }
            readS.resume();
        }).on(`close`, () => {
            console.clear();
            console.log(`Done!`);
            console.log(`Running sort...`);

            child.spawn(`node`, `sort`, {
                stdio: 'inherit',
            })
                .on('exit', process.exit);
        });
})();