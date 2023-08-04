// Setup
// "create project"
// https://console.cloud.google.com/apis/dashboard
// "enable" youtube api
// https://console.cloud.google.com/apis/api/youtube.googleapis.com/metrics
// and "create creditinals" (on the same page). 
// Select "User data" (THEN "NEXT", NOT "DONE" YOU BLIND FUCK),
// put in whatever you like for the "consent screen", 
// add all scopes, 
// application type as "Web application"
// "Authorised redirect URIs" add http://localhost:8080
// Download the creditinals and move them into the current this directory. And "Done"
// Now add yourself as a test user
// https://console.cloud.google.com/apis/credentials/consent
// Finally run this script.
// node playlist
// you can also edit the sorting of the videos on youtube

// P.S if you exceed the rate limit (or "The request cannot be completed because you have exceeded your quota")
// Which you probably will since it allows to only add ~200 videos
// Then you can just recreate the project. Have fun!

// You can later "Shut Down" the project
// https://console.cloud.google.com/iam-admin/settings
// or https://console.cloud.google.com/cloud-resource-manager


const port = 8080;
(async () => {
    console.clear();
    const { google } = require('googleapis');
    const readline = require('readline/promises');
    const process = require(`process`);
    const { OAuth2Client } = require('google-auth-library');
    const express = require(`express`);
    const path = require(`path`);
    var https = require('https');
    var http = require('http');
    const csv = require('csv-parser');
    const fs = require(`fs-extra`);
    const secretFile = fs.readdirSync(`./`).find(x => x.startsWith(`client_secret_`));
    if (!secretFile) return console.log(`Missing secret file. You sure you didnt rename it? Since its supposed to start with "client_secret_"`);
    var secret = fs.readJsonSync(secretFile).web;
    if (!secret.redirect_uris || !secret.redirect_uris.includes(`http://localhost:${port}`)) console.log(`The secret file dosent have "http://localhost:${port}" as a redirect uri, double check its there!`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const defcsv = fs.readdirSync(`./`).find(x => x.endsWith(`.csv`));
    var videoIdsFile = await rl.question(`Input video ids csv${defcsv ? ` (default: ${defcsv})` : ``} : `);
    if (!videoIdsFile) videoIdsFile = defcsv;
    if (!fs.existsSync(videoIdsFile)) return console.log(`CSV dosent exist: ${videoIdsFile}`);
    var existingPlaylistId = await rl.question(`Existing playlist id (if empty, new will be created) : `);
    rl.close();

    // Create an OAuth2 client
    const oAuth2Client = new OAuth2Client(secret.client_id, secret.client_secret, `http://localhost:${port}`);

    // Generate the authentication URL
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube'],
    });

    var app = express();

    const compression = require(`compression`);
    app.use(compression());

    app.enable('view cache');
    app.set('view engine', 'ejs');
    var youtube;
    app.use(async (req, res, next) => {
        // remove express header
        res.removeHeader(`X-Powered-By`); // dosent work
        res.setHeader(`X-Powered-By`, "Viewers like you");

        if (!req.query.code) return res.redirect(authUrl);
        function lookAtMe(text) {
            res.send(`<style>*{background-color:black;color:white;}</style><span style="position:absolute;top:50%;left:50%;transform:translateX(-50%) translateY(-50%); white-space: pre-wrap; text-align:center;" onclick="navigator.clipboard.writeText('${text}')">${text}<span>`);
        }
        //lookAtMe(req.query.code);
        try {
            const token = await oAuth2Client.getToken(req.query.code);
            oAuth2Client.setCredentials(token.tokens);
            // Authenticate with the YouTube Data API
            youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
            lookAtMe(`Authentication successful.\nBack to console!`);
            console.clear();
            makePlaylist();
        } catch (err) {
            lookAtMe(`Authentication failed.\n${err.message}`);
            console.log(err);
        }
        res.end();
    });

    await new Promise(r => {
        http.createServer(app)
            .on('error', (err) => console.log(`http : failed`, err))
            .listen(port, () => {
                require('child_process')
                    .exec(`${process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open'} http://localhost:${port}`); // pure authUrl get corrupted
                console.log(`Authorize access here: http://localhost:${port}\n`);
                r();
            });
    });


    async function makePlaylist() {
        var playlist = { id: existingPlaylistId };
        if (!existingPlaylistId)
            try {
                // Create playlist
                // https://developers.google.com/youtube/v3/docs/playlists/insert
                playlist = await youtube.playlists.insert({
                    part: 'snippet',
                    requestBody: {
                        "snippet": {
                            "title": `Unlisted ${new Date().toISOString().split(`T`)[0].replace(/-/g, `/`)}`,
                            "description": "Generated with blood red pupils and https://github.com/clearedd/unlisted-analysis",
                            "tags": ["unlisted", "generated"],
                            "defaultLanguage": "en"
                        },
                        /*"status": {
                            "privacyStatus": "private"
                        }*/
                    },
                });
                playlist = playlist.data;
                console.log(`Hello uhh.. ${playlist.snippet.channelTitle}!`);
                console.log(`Created playlist "${playlist.snippet.title}"\nURL: https://youtube.com/playlist?list=${playlist.id}`);
            } catch (err) {
                console.log(`Error creating playlist : `);
                console.log(err.message);
                return;
            }

        // https://developers.google.com/youtube/v3/docs/playlistItems
        var playlistItems;
        try {
            playlistItems = await youtube.playlistItems.list({
                part: 'snippet',
                playlistId: playlist.id,
            });
        } catch (err) {
            console.log(`Failed listing playlists videos.. :(`);
        }
        const existingVideoIds = playlistItems.data.items.map(item => item.snippet.resourceId.videoId);

        var videoIds = [];
        await new Promise(r =>
            fs.createReadStream(videoIdsFile)
                .pipe(csv())
                .on('data', async x => {
                    if (!x.videoid) {
                        console.log(`CSV dosent include "videoid" header`);
                        return process.exit(1);
                    }
                    videoIds.push(x.videoid);
                }).on(`close`, r)
        )

        const newVideoIds = videoIds.filter(id => !existingVideoIds.includes(id));

        if (newVideoIds.length == 0) return console.log('All videos are already in the playlist.');
        for (var i = 0; i < newVideoIds.length; i++) {
            let id = newVideoIds[i];
            try {
                console.log(`Adding ${i}/${newVideoIds.length} ${id}`);
                let res = await youtube.playlistItems.insert({
                    part: 'snippet',
                    requestBody: {
                        snippet: {
                            playlistId: playlist.id,
                            resourceId: {
                                kind: 'youtube#video',
                                videoId: id,
                            },
                        },
                    },
                });
                res = res.data.snippet;
                console.log(`Added (${res.position}) ${res.title}`);
            } catch (err) {
                console.log(`Failed adding video with id of ${id}`);
                console.log(err.message);
                process.exit(1);
            }
        }
        console.log(`${newVideoIds.length > 1 ? `All ` : ``}${newVideoIds.length} video${newVideoIds.length > 1 ? `s` : ``} added`);
    }
})();