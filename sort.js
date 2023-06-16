const csv = require('csv-parser');
const fs = require(`fs`);
const { table, getBorderCharacters, createStream } = require(`table`);
const os = require(`os`);
const package = require(`./package.json`);

const csvFile = `./processedUnlisted.csv`;
const outcsvFile = `./filteredUnlisted.csv`;

const { Command, program } = require('commander');

program
    .name(package.name)
program.description(package.description)
program.version(`v${package.version}\n${os.type()} ${os.arch()} ${os.release()}\n${os.version()}`);

const rawSort = `rawsort.json`;
program
    .option('--cache <json>', `use ${rawSort} to go faster`)
    .option(`--oneline`, `...`)

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
    if (options.cache) {
        if (!fs.existsSync(options.cache)) return console.log(`${options.cache} dosent exist!`);
        console.log(`Using ${options.cache}..`);
        let out = JSON.parse(fs.readFileSync(options.cache));
        chnSort = out[0];
        catSort = out[1];
        tagsSort = out[2];
        console.log(`chn:${chnSort.length} cat:${catSort.length} tag:${tagsSort.length}`);
    } else
        await new Promise(r => {
            var channels = {};
            var categories = {};
            var tags = {};

            fs.createReadStream(csvFile)
                .pipe(csv())
                .on('data', async x => {
                    //console.log(x);
                    //process.exit();
                    if (x.title == `Video ad`) return; // automated ad
                    if (!categories[x.category])
                        categories[x.category] = 1;
                    else categories[x.category]++;
                    x.tags.split(`,`).forEach(y => {
                        if (!tags[y])
                            tags[y] = 1;
                        else tags[y]++;
                    });
                    if (!channels[x.author])
                        channels[x.author] = [x];
                    else channels[x.author].push(x);
                }).on(`close`, () => {
                    console.log(`Sorting channels..`);
                    chnSort = KVtoArr(channels).sort((a, b) => a[1].length - b[1].length).reverse();
                    console.log(`Sorting categories..`);
                    catSort = KVtoArr(categories).sort((a, b) => a[1] - b[1]).reverse();
                    console.log(`Sorting tags..`);
                    tagsSort = KVtoArr(tags).sort((a, b) => a[1] - b[1]).reverse();
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
                ], null, 4));
    }

    console.log(`Writing chnLb.txt..`);
        fs.rmSync(`./chnLb.txt`);
        chnSort.map(x => [x[0], x[1].length, x[1].flatMap(x => x.videoid)])
        .forEach((x,i) => 
            fs.appendFileSync(`./chnLb.txt`, `${`${i+1}#`.padEnd(5)} ${truncateString(x[0],25).padEnd(30)} ${String(x[1]).padEnd(5)} ${x[2].join(` `)}${options.oneline?`\\n`:`\n`}`)
        );

    console.log(`Writing catLb.txt..`);
    fs.writeFileSync(`./catLb.txt`, table(
        catSort,
        {
            border: getBorderCharacters('void'),
            columnDefault: {
                paddingLeft: 0,
                paddingRight: 1
            },
            drawHorizontalLine: () => false
        }));

    console.log(`Writing tagsLb.txt..`);
    // slow af
    /*fs.writeFileSync(`./tagsLb.txt`, table(
        tagsSort,
        {
            border: getBorderCharacters('void'),
            columnDefault: {
                paddingLeft: 0,
                paddingRight: 1
            },
            drawHorizontalLine: () => false
        }));*/

    function truncateString(str, tur) {
        if (str.length <= tur) return str;
        return str.substring(0, tur) + '...';
    }
    fs.rmSync(`./tagsLb.txt`);
    let tagsLen = 30;
    tagsSort.forEach(x =>
        fs.appendFileSync(`./tagsLb.txt`, `${truncateString(String(x[0]), tagsLen).padEnd(tagsLen + 5, ` `)}${x[1]}\n`)
    );

    console.log(`Done!`);
})();