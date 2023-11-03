const fs = require(`fs`);
const csv = require('csv-parser');
var videoIds = [];
fs.createReadStream(`./processedUnlisted.csv`)
    .pipe(csv())
    .on('data', async x => {
        if (!x.videoid) {
            console.log(`CSV dosent include "videoid" header`);
            return process.exit(1);
        }
        if (!videoIds.includes(x.videoid))
            videoIds.push(x.videoid);
    }).on(`close`, () => {
        fs.writeFileSync(`piped-playlist.json`, JSON.stringify(
            {
                "format": "Piped",
                "version": 1,
                "playlists": [
                    {
                        "name": "Unlisted videos",
                        "type": "playlist",
                        "visibility": "private",
                        "videos": videoIds.flatMap(x => `https://www.youtube.com/watch?v=${x}`)
                    }
                ]
            }
        ));
    })

