const csv = require('csv-parser');
const fs = require(`fs`);
const readline = require(`readline`);

const { Command, program } = require('commander');

program
    .option(`--views <count>`, `Filter by views, examples: >50 (less then 50), <23 (more then 23), =8`)
    .option(`--channel <name>`, `Filter by channel name`)
    .option(`--date <date>`, `Filter by date, examples: >2011-07-04 (before)`)
    .option(`--category <category>`, `Filter by category (check catLb.txt)`)
    .option(`--title <words>`, `title must include. seperate with ","`)
    .option(`--channelVideoLimit <count>`, `limit the amount of videos per channel`, -1)
    .option(`--noheader <headers>`, `list headers to not include. seperate with ","`)
    .option(`--overview`, `gives an overview of (probably) a channel`)
    .option(`--overviewlimit <limit>`, `list limit for overview`, 100)
    .option(`--input <csv>`, `Input csv`, `./processedUnlisted.csv`)
    .option(`--output <csv>`, `Output csv`, `./filtered.csv`)

program.parse(process.argv);
const options = program.opts();

const csvw = require('csv-writer').createObjectCsvWriter;

const csvFile = options.input;
const out = options.output;
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
].filter(x => !String(options.noheader).split(`,`).includes(x.id));

fs.writeFileSync(out, headers.flatMap(x => x.id).join(`,`) + `\n`);
const csvWriter = csvw({
    path: out,
    append: true,
    header: headers
});

function KVtoArr(KV) {
    var arr = [];
    Object.keys(KV).forEach(x => {
        arr.push([x, KV[x]]);
    });
    return arr;
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

var formatNum = x => Intl.NumberFormat(`en`, { notaion: `compact` }).format(x);

(async () => {
    const totalRows = await countRowsInCsv(csvFile);
    var checked = 0;
    var found = 0;
    var overview = {
        views: 0,
        categories: {},
        tags: {},
        words: {},
        channels: {},
    };
    var total = {
        tags: {},
        words: {},
    };
    var channelVideoLimit = [];
    fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', async x => {
            checked++;
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            process.stdout.write(`${(checked / totalRows * 100).toFixed(2)}%`);
            // total

            String(x.tags).toLowerCase().split(`,`).forEach(tag => {
                if (tag)
                    if (!total.tags[tag])
                        total.tags[tag] = 1;
                    else total.tags[tag]++;
            });

            String(x.title).toLowerCase()
                .replace(/[^A-Za-z\s]/g, '') // remove non characters
                .split(` `)
                .forEach(word => {
                    if (word)
                        if (!total.words[word])
                            total.words[word] = 1;
                        else total.words[word]++;
                });

            // filters
            if (options.views) {
                if (options.views.startsWith(`>`) && x.views > options.views.replace(`>`, ``)) return; // less then
                if (options.views.startsWith(`<`) && x.views < options.views.replace(`<`, ``)) return; // more then
                if (options.views.startsWith(`=`) && x.views != options.views.replace(`=`, ``)) return; // more then
            }
            if (options.channel && options.channel.toLowerCase() != x.author.toLowerCase()) return;
            if (options.date) {
                if (options.date.startsWith(`>`) && new Date(x.upload) > new Date(options.views.replace(`>`, ``))) return; // less then
                if (options.date.startsWith(`<`) && new Date(x.upload) < new Date(options.views.replace(`<`, ``))) return; // more then
                if (options.date.startsWith(`=`) && new Date(x.upload) != new Date(options.views.replace(`=`, ``))) return; // more then
            }
            if (options.category && options.category != x.category) return;
            if (options.title && !String(options.title).toLowerCase().split(`,`).some(y => String(x.title).toLowerCase().includes(y))) return;
            if (options.channelVideoLimit && options.channelVideoLimit != -1) {
                if (channelVideoLimit.includes(x.author)) return;
                channelVideoLimit.push(x.author);
            }

            // overview
            if (options.overview) {
                overview.views += Number(x.views);
                overview.categories[x.category] += 1;
                overview.channels[x.author] += 1;
                String(x.tags).toLowerCase().split(`,`).forEach(tag => {
                    if (tag)
                        if (!overview.tags[tag])
                            overview.tags[tag] = 1;
                        else overview.tags[tag]++;
                });
                String(x.title).toLowerCase()
                    .replace(/[^A-Za-z\s]/g, '') // remove non characters
                    .split(/[ ]/)
                    .forEach(y => {
                        if (y)
                            if (!overview.words[y])
                                overview.words[y] = 1;
                            else overview.words[y]++;
                    });
            }

            // save
            found++;
            csvWriter.writeRecords([x])
                .catch((err) => console.error(`Error writing CSV file: ${err}`));
        }).on(`close`, () => {
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(`Done! ${found}/${totalRows} (${(found / totalRows * 100).toFixed(2)}%)`);
            // overview
            if (options.overview) {
                const overviewFile = `./overview.md`
                if (fs.existsSync(overviewFile))
                    fs.rmSync(overviewFile);
                var ov = `# Overview\n\n## Filters\n\n`;

                // ## Filters
                Object.keys(options)
                    .filter(x => ![`overview`, `overviewlimit`].includes(x))
                    .forEach(x => ov += `${x}: ${options[x]}<br>\n`);

                // ## Dataset
                ov += `\n## Dataset\n`;
                ov += `\n**${found}** / ${totalRows} (${(found / totalRows * 100).toFixed(2)}%)`;

                // ## total
                ov += `\n\n## Totals\n`;
                let totalCats = Object.keys(overview.categories).length;
                ov += `\ntotal videos: **${formatNum(totalCats)}**`;
                if (Object.keys(overview.channels).length > 1)
                    ov += `<br>\ntotal channels: ${Object.keys(overview.channels).length}`;
                ov += `<br>\ntotal views: **${formatNum(overview.views)}**`;
                // ## Words
                ov += `\n\n## Words\n`;

                ov += `\ndiffrent words: **${formatNum(Object.keys(overview.words).length)}**`;
                let wordsSum = Object.values(overview.words).reduce((a, b) => a + b, 0);
                ov += `<br>\nwords sum: **${formatNum(wordsSum)}**\n\n` +
                    `num | count | tag | % of total\n---|---|---|---\n`;
                fs.appendFileSync(overviewFile, ov);

                KVtoArr(overview.words)
                    .sort((a, b) => a[1] - b[1]).reverse()
                    .splice(0, options.overviewlimit)
                    .forEach((x, i) => {
                        fs.appendFileSync(overviewFile, `${i + 1} | ${String(x[1])} | ${x[0]}` +
                            `${x[1] / total.words[x[0]] == 1 ? `` : ` | ${(x[1] / total.words[x[0]] * 100).toPrecision(3)}%`}\n`);
                    })

                // ## Tags
                ov = ``;
                ov += `\n\n## Tags\n`;
                ov += `\ndiffrent tags: **${formatNum(Object.keys(overview.tags).length)}**`;
                let tagsSum = Object.values(overview.tags).reduce((a, b) => a + b, 0);
                ov += `<br>\ntags sum: **${formatNum(tagsSum)}**\n\n` +
                    `num | count | tag | % of total\n---|---|---|---\n`;
                fs.appendFileSync(overviewFile, ov);

                KVtoArr(overview.tags)
                    .sort((a, b) => a[1] - b[1]).reverse()
                    .splice(0, options.overviewlimit)
                    .forEach((x, i) => {
                        fs.appendFileSync(overviewFile, `${i + 1} | ${String(x[1])} | ${x[0]}` +
                            `${x[1] / total.tags[x[0]] == 1 ? `` : ` | ${(x[1] / total.tags[x[0]] * 100).toPrecision(3)}%`}\n`);
                    })
            }
        });
})();