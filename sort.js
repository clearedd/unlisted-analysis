const csv = require('csv-parser');
const fs = require(`fs`);
const { table, getBorderCharacters, createStream } = require(`table`);
const os = require(`os`);
const package = require(`./package.json`);

const csvFile = `./processedUnlisted.csv`;

const wordLbMin = 3;

const { Command, program } = require('commander');

program
    .name(package.name)
program.description(package.description)
program.version(`v${package.version}\n${os.type()} ${os.arch()} ${os.release()}\n${os.version()}`);

const rawSort = `rawsort.json`;
program
    .option('--cache <json>', `use ${rawSort} to go faster`)
    .option(`--oneline`, `...`)
    .option(`--cattags`, `show category tags`)
    .option(`--mintag <amount>`, `minimum amount of a tag for chnTagsLb.txt`, 10)
    .option(`--excludeemptychannels`, `excludes channels that have no tags in the leaderboard`)

program.parse(process.argv);
const options = program.opts();

function KVtoArr(KV) {
    var arr = [];
    Object.keys(KV).forEach(x => {
        arr.push([x, KV[x]]);
    });
    return arr;
}

(async () => {
    var chnSort = [];
    var catSort = [];
    var tagsSort = [];
    var mostUsedWordsSort = [];
    if (options.cache) {
        if (!fs.existsSync(options.cache)) return console.log(`${options.cache} dosent exist!`);
        console.log(`Using ${options.cache}..`);
        let out = JSON.parse(fs.readFileSync(options.cache));
        chnSort = out[0];
        catSort = out[1];
        tagsSort = out[2];
        mostUsedWordsSort = out[3];
        console.log(`chn:${chnSort.length} cat:${catSort.length} tag:${tagsSort.length} wrd:${mostUsedWordsSort}`);
    } else
        await new Promise(r => {
            var channels = {};
            var categories = {};
            var tags = {};
            var mostUsedWords = {};

            fs.createReadStream(csvFile)
                .pipe(csv())
                .on('data', async x => {
                    //console.log(x);
                    //process.exit();
                    if (x.title == `Video ad`) return; // automated ad
                    if (!categories[x.category])
                        categories[x.category] = { count: 1, tags: {} };
                    else categories[x.category].count++;
                    x.tags.split(`,`).forEach(y => {
                        y = String(y).toLowerCase();
                        if (!y) return;
                        if (!tags[y])
                            tags[y] = 1;
                        else tags[y]++;

                        if (!categories[x.category].tags[y])
                            categories[x.category].tags[y] = 1;
                        else categories[x.category].tags[y]++;
                    });
                    if (!channels[x.author])
                        channels[x.author] = [x];
                    else channels[x.author].push(x);

                    String(x.title).toLowerCase()
                        .replace(/[()\[\]【】:|.,'!"*•]/g, ` `)
                        .split(/[ ]/)
                        .forEach(y => {
                            if (!mostUsedWords[y])
                                mostUsedWords[y] = 1;
                            else mostUsedWords[y]++;
                        });
                }).on(`close`, () => {
                    console.log(`Sorting channels..`);
                    chnSort = KVtoArr(channels).sort((a, b) => a[1].length - b[1].length).reverse();
                    console.log(`Sorting categories..`);
                    catSort = KVtoArr(categories)
                        .map(x => [x[0], {
                            count: x[1].count,
                            tags: KVtoArr(x[1].tags)
                                .sort((a, b) => a[1] - b[1])
                                .filter(y => !(Number.isNaN(y[1]) || y[1] <= 1))
                                .reverse(),
                        }])
                        .sort((a, b) => a[1].count - b[1].count).reverse();
                    console.log(`Sorting tags..`);
                    tagsSort = KVtoArr(tags).sort((a, b) => a[1] - b[1]).reverse();
                    console.log(`Sorting words..`);
                    mostUsedWordsSort = KVtoArr(mostUsedWords).sort((a, b) => a[1] - b[1]).reverse();
                    r();
                });
        });

    if (!options.cache) {
        console.log(`Writing ${rawSort}..`);
        fs.writeFileSync(rawSort,
            JSON.stringify(
                [
                    chnSort,
                    catSort,
                    tagsSort,
                    mostUsedWordsSort,
                ]/*, null, 4*/));
    }

    console.log(`Writing chnLb.txt..`);
    if (fs.existsSync(`./chnLb.txt`))
        fs.rmSync(`./chnLb.txt`);
    chnSort.map(x => [x[0], x[1].length, x[1].flatMap(x => x.videoid)])
        .forEach((x, i) =>
            fs.appendFileSync(`./chnLb.txt`, `${`${i + 1}#`.padEnd(5)} ${truncateString(x[0], 25).padEnd(30)} ${String(x[1]).padEnd(5)} ${x[2].join(` `)}${options.oneline ? `\\n` : `\n`}`)
        );

    console.log(`Writing chnTagsLb.txt..`);
    if (fs.existsSync(`./chnTagsLb.txt`))
        fs.rmSync(`./chnTagsLb.txt`);
    var chnTagSort = {};
    chnSort.forEach(x => {
        let tagSum = {};
        x[1]
            .filter(y => y.tags)
            .forEach(vid => {
                String(vid.tags)
                    .toLowerCase()
                    .split(`,`).forEach(tag => {
                        if (!tagSum[tag])
                            tagSum[tag] = 1;
                        else tagSum[tag]++;
                    });
            });
        chnTagSort[x[0]] = tagSum;
    });
    
    KVtoArr(chnTagSort)
        .sort((a, b) => Object.keys(a[1]).length - Object.keys(b[1]).length).reverse() // sort by diffrent tag usage. tag sum would just "who uploaded the most videos???"
        .forEach((x, i) => {
            let sortedTags = KVtoArr(x[1])
                .sort((a, b) => a[1] - b[1]).reverse()
                .filter(y => y[1] >= Number(options.mintag));
            if (!options.excludeemptychannels || (options.excludeemptychannels && sortedTags.length))
                fs.appendFileSync(`./chnTagsLb.txt`, `${x[0]}`
                    + ` | tag sum:${Object.values(x[1]).reduce((a, b) => a + b, 0)} diff tags:${Object.values(x[1]).length}\n`);

            sortedTags.forEach(y =>
                fs.appendFileSync(`./chnTagsLb.txt`, `| ${String(y[1]).padEnd(5)} ${y[0]}\n`)
            );
        });

    console.log(`Writing catLb.txt..`);
    if (fs.existsSync(`./catLb.txt`))
        fs.rmSync(`./catLb.txt`);
    catSort.forEach(cat => {
        var tagSum = cat[1].tags.reduce((a, b) => a + b[1], 0);
        fs.appendFileSync(`./catLb.txt`, `${cat[0].padEnd(21)} ${cat[1].count}\n`
            + `| tag sum:${String(tagSum).padEnd(6)} tags:${cat[1].tags.length}\n`);
        if (options.cattags) {
            let other = 1;
            for (var i = 0; i < /*cat[1].tags.length*/10; i++) {
                let tag = cat[1].tags[i];
                if (!tag) break;
                other -= tag[1] / tagSum;
                fs.appendFileSync(`./catLb.txt`, `| ${tag[0].padEnd(20)} ${(tag[1] / tagSum * 100).toFixed(2)}%\n`);
            }
            fs.appendFileSync(`./catLb.txt`, `| other ${(other * 100).toFixed(2)}%\n`);
        }
    });

    console.log(`Writing wordLb.txt..`);
    if (fs.existsSync(`./wordLb.txt`))
        fs.rmSync(`./wordLb.txt`);
    mostUsedWordsSort.forEach(x => {
        if (x[0].length >= wordLbMin && x[1] > 1)
            fs.appendFileSync(`./wordLb.txt`, `${String(x[0]).padEnd(20, ` `)} ${x[1]}\n`)
    });

    console.log(`Writing tagsLb.txt..`);

    function truncateString(str, tur) {
        if (str.length <= tur) return str;
        return str.substring(0, tur) + '...';
    }
    if (fs.existsSync(`./tagsLb.txt`))
        fs.rmSync(`./tagsLb.txt`);
    let tagsLen = 30;
    tagsSort.forEach(x =>
        fs.appendFileSync(`./tagsLb.txt`, `${truncateString(String(x[0]), tagsLen).padEnd(tagsLen + 5, ` `)} ${x[1]}\n`)
    );

    console.log(`Done!`);
})();