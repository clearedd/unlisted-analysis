const { createCanvas } = require('canvas');
const fs = require('fs');

const text = fs.readFileSync(`./chnLb.txt`).toString();//.split(`\n`).slice(0, 10).join(`\n`);

const { Command, program } = require('commander');

program
    .description(`A quick and dirty text to image converter, would love to get over the 32,727x32,727 max limit.`)
    .option('--fontsize <size>', `default 30`)
    .option('--fontwidth <size>', `default fontsize*.6`)
    .option('--channels <count>', `default 100`)
    .option('--urls <count>', `default 100`)
    .option('--color', `horrible idea`)
    .option('--width <x>', `max 32,727. default urls flag`)
    .option('--height <y>', `max 32,727. default channels flag`)
    .option('--background <color>', `default #00000000`)
    .option('--out <file>', ``)

program.parse(process.argv);
const options = program.opts();

const fontSize = options.fontsize || 30;
const fontWidth = options.fontwidth || fontSize * .6;
// dimensions
const chnCount = options.channels || 100;
const urlCount = options.urls || 100;
const width = options.width || fontWidth * (42 + (12 * urlCount));
const height = options.height || fontSize * chnCount;
console.log(`${width}x${height}`);

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// black background
ctx.fillStyle = options.background || "#00000000";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.font = `${fontSize}px DejaVuSansMono`;
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'top';
ctx.textBaseline = 'left';

var y = fontSize;

const crypto = require(`crypto`);
function stringToColor(str) {
    const hash = crypto.createHash('md5');
    hash.update(str);
    return `#${hash.digest('hex').substring(0, 6)}`;
}

// text
//ctx.fillText(text, x, y);

for (const line of text.split(`\n`)) {
    let x = 0;
    for (const char of line) {
        //const isUnicode = char.codePointAt(0) > 0xffff;
        //ctx.font = `${fontSize}px "${isUnicode ? 'Unicode' : 'NonUnicode'}"`;
        if(options.color)
        ctx.fillStyle = stringToColor(char);
        ctx.fillText(char, x, y, fontWidth);
        x += fontWidth;
    }
    y += fontSize;
}

// output
const stream = canvas.createPNGStream();
const out = fs.createWriteStream(options.out || `waterfall${width}x${height}.png`);

stream.pipe(out);
out.on('finish', () => {
    console.log('Image saved!');
});