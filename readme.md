# Unlisted analysis

![waterfall](./waterfall22356x3000.png)

This is an analysis of SponsorBlock [`unlistedvideos.csv`](https://mirror.sb.mchang.xyz/) which submissions range from 2021-06-24 to 2021-07-29 (I am scared).

## Why?

Boredom will kill, and finding gold is fun.

## Whats included?

- `process.js` takes in `unlistedVideos.csv` and (slowly) spits out an enriched version...
  - `processedUnlisted.csv` - which adds the title, tags and category (also dosent include private/removed videos).
- `sort.js` takes in the previously generated `processedUnlisted.csv` and (would you know it) sorts it into...
  - `rawsort.json` - a cache (use with `--cache` flag).[^3]
  - `chnLb.txt` - a human friendly table consistin of a channel name, unlisted video count and unlisted video ids.
  - `tagLb.txt` - most used tags.
  - `catLb.txt` - most used categories.
  - `wordLb.txt` - most used words in titles[^1]. (Min word length is 3)
- `filter.js` filters `processedUnlisted.csv`. use `-h` flag for help.
- `waterfall.js` - used to generate the image above. `-h`

## How long does it take?

~24h to request through 121403 video ids at ~700ms ping.

## Results?

From 121403 videos to 35797 (thats ~30%).

### catLb.txt

Categories used with most used interesting tags[^2] %

```txt
Gaming                10092
| tag sum:81281  tags:8484
| fortnite             1.40%
| apex                 0.71%
| minecraft            0.67%
| gameplay             0.67%
| walkthrough          0.62%
| live                 0.61%
| play                 0.56%
| playstation 4        0.54%
| game                 0.54%
| playthrough          0.53%
```

fortnite, minecraft and apex dominating.
Suprisingly all more then live, meaning that most of thees videos arent VODs (or not correctly tagged).

```
People & Blogs        6365
| tag sum:13777  tags:2521
| ryan boundless       1.17%
| life in japan        0.89%
| living in japan      0.84%
| asmr                 0.66%
```

asmr?

```
Entertainment         4953
| tag sum:25371  tags:3992
| asmr                 0.89%
| comedy               0.67%
| funny                0.61%
| ytpmv                0.48%
```

asmr is first??

```
Music                 2716
| tag sum:14388  tags:2428
| music                2.47%
| ytpmv                1.84%
| remix                0.99%
| song                 0.80%
| edm                  0.76%
| rock                 0.63%
| electronic music     0.63%
```
```
Film & Animation      2587
| tag sum:9907   tags:1578
| animation            4.31%
| disney               2.99%
| pixar                2.45%
```
```
Science & Technology  2061
| tag sum:13630  tags:1973
```
```
News & Politics       1833
| tag sum:8301   tags:671
```
```
Education             1488
| tag sum:7384   tags:1468
```
```
Comedy                1180
| tag sum:6235   tags:1094
| funny                2.79%
| ytp                  2.28%
| youtube              2.12%
| comedy               2.07%
| poop                 1.96%
| lol                  1.94%
| troll                1.62%
| saucisse             1.60%
| mario                0.98%
| youtube poop         0.87%
```
```
Howto & Style         671
| tag sum:3317   tags:685
| youtube              0.69%
```
```
Travel & Events       568
| tag sum:3333   tags:550
| new zealand          2.82%
| japan                2.10%
| life in japan        2.01%
```
```
Sports                553
| tag sum:2862   tags:509
| shredded             1.89%
```
```
Autos & Vehicles      271
| tag sum:883    tags:290
| ytpmv                2.38%
```

People like syncing cars to music.

```
Nonprofits & Activism 236
| tag sum:227    tags:84
| david suzuki foundation 4.85%
| ytpmv                3.96%
| youtube              2.64%
| god                  2.20%
| bible                1.76%
| jesus                1.76%
| coronavirus          1.76%
| the                  1.76%
| remix                1.76%
| poop                 1.76%
```

YTPMV is a music video featuring various clips from tv shows, movies, commercials, etc. repeated or sped up/slowed down to fit to a beat, usually techno.

```
Pets & Animals        143
| tag sum:379    tags:138
```

nothing interesting

```
Trailers              67
| tag sum:2      tags:1
| get better math grades 100.00%
```

what.

## Footnotes

[^1]: The following characters are replaced with a space ()[]【】:|.,'!"*•
[^2]: tags that only appear once
[^3]: "Video ad"-s excluded

[[BLISS]](https://tube.cadence.moe/cant-think)
