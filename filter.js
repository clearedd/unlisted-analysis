const csv = require('csv-parser');
const fs = require(`fs`);
const readline = require(`readline`);
const csvw = require('csv-writer').createObjectCsvWriter;

const csvFile = `./processedUnlisted.csv`;

const out = `./filtered.csv`;
if (fs.existsSync(out)) fs.rmSync(out);

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
fs.writeFileSync(out, headers.flatMap(x => x.id).join(`,`) + `\n`);
const csvWriter = csvw({
    path: out,
    append: true,
    header: headers
});

const { Command, program } = require('commander');

program
    .option(`--views <count>`, `Filter by views, examples: >50 (less then 50), <23 (more then 23), =8`)
    .option(`--channel <name>`, `Filter by channel name`)
    .option(`--date <date>`, `Filter by date, examples: >2011-07-04 (before)`)
    .option(`--category <category>`, `Filter by category (check catLb.txt)`)

program.parse(process.argv);
const options = program.opts();

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

(async () => {
    const total = await countRowsInCsv(csvFile);
    var checked = 0;
    var found = 0;
    fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', async x => {
            checked++;
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);

            process.stdout.write(`${(checked / total * 100).toFixed(2)}%`);
            if (options.views) {
                if (options.views.startsWith(`>`) && x.views > options.views.replace(`>`, ``)) return; // less then
                if (options.views.startsWith(`<`) && x.views < options.views.replace(`<`, ``)) return; // more then
                if (options.views.startsWith(`=`) && x.views != options.views.replace(`=`, ``)) return; // more then
            }
            if (options.channel && options.channel != x.author) return;
            if (options.date) {
                if (options.date.startsWith(`>`) && new Date(x.upload) > new Date(options.views.replace(`>`, ``))) return; // less then
                if (options.date.startsWith(`<`) && new Date(x.upload) < new Date(options.views.replace(`<`, ``))) return; // more then
                if (options.date.startsWith(`=`) && new Date(x.upload) != new Date(options.views.replace(`=`, ``))) return; // more then
            }
            if (options.category && options.category != x.category) return;
            found++;
            csvWriter.writeRecords([x])
                .catch((err) => console.error(`Error writing CSV file: ${err}`));
        }).on(`close`, () => {
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(`Done! ${found}/${total} (${(found / total * 100).toFixed(2)}%)`);
        });
})();