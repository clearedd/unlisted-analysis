const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const crypto = require(`crypto`);
function stringToColor(str) {
    const hash = crypto.createHash('md5');
    hash.update(str);
    return `#${hash.digest('hex').substring(0, 6)}`;
}
const { program } = require('commander');

program
    .description(`A quick and dirty text to image converter, would love to get over the 32,727x32,727 max limit.`)
    .option('--fontsize <size>', ``, 30)
    .option('--fontwidth <size>', `default fontsize*.6`)
    .option('--channels <count>', `can also be "max" (newline count)`, 100)
    .option('--urls <count>', ``, 100)
    .option('--text <color>', ``, `ffffffff`)
    .option('--width <x>', `max 32727. default urls flag`)
    .option('--height <y>', `max 32727. default channels flag`)
    .option('--background <color>', ``, `00000000`)
    .option('--in <file>', ` file to use`, `chnLb.txt`)
    .option('--out <file>')

program.parse(process.argv);
const options = program.opts();

if (!fs.existsSync(options.in)) return console.log(`In file dosent exist ${options.in}`);
const text = fs.readFileSync(options.in).toString();//.split(`\n`).slice(0, 10).join(`\n`);
const lines = text.split(`\n`);

const fontSize = options.fontsize;
const fontWidth = options.fontwidth || fontSize * .6;
// dimensions
const chnCount = options.channels == "max" ? lines.length : options.channels;
const urlCount = options.urls;
var width = Number.parseInt(options.width) || fontWidth * (42 + (12 * urlCount));
var height = Number.parseInt(options.height) || fontSize * chnCount;
var canvas
try {
    canvas = createCanvas(width, height);
} catch (err) {
    console.log(`Failed to create canvas of size ${width}x${height}. Minimizing`);
    width = Math.min(width, 32727);
    height = Math.min(height, 32727);
    canvas = createCanvas(width, height);
}
const ctx = canvas.getContext('2d');

// black background
ctx.fillStyle = options.background;
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.font = `${fontSize}px DejaVuSansMono`;
ctx.fillStyle = `#${options.text}`;
ctx.textAlign = 'top';
ctx.textBaseline = 'left';

// text
var y = fontSize;
for (const line of lines) {
    let x = 0;
    for (const char of line) {
        if (options.color == `hash`)
            ctx.fillStyle = stringToColor(char);
        ctx.fillText(char, x, y, fontWidth);
        x += fontWidth;
    }
    y += fontSize;
}

// output
const stream = canvas.createPNGStream();
const out = fs.createWriteStream(options.out || `${String(options.in).split(`.`)[0]}${width}x${height}.png`);

stream.pipe(out);
out.on('finish', () => {
    console.log('Image saved!');
});