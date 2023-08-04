# Unlisted analysis

![waterfall](./waterfall22356x3000.png)

This is an analysis of SponsorBlock [`unlistedvideos.csv`](https://sponsor.ajay.app/database) which submissions range from 2021-06-24 to 2021-07-29 (I am scared).

## Why?

Boredom will kill, and finding gold is fun.

## Whats included?

- [`process.js`](./process.js) takes in `unlistedVideos.csv` and (slowly[^4]) spits out an enriched version...
  - [`processedUnlisted.csv`](./processedUnlisted.csv) - which adds the title, tags and category (also dosent include private/removed videos).
- [`sort.js`](./sort.js) takes in the previously generated `processedUnlisted.csv` and (would you know it) sorts it into...
  - [`rawsort.json`](./rawsort.json) - a cache (use with `--cache` flag).[^3]
  - [`chnLb.txt`](./chnLb.txt) - a human friendly table consistin of a channel name, unlisted video count and unlisted video ids.
  - [`tagLb.txt`](./tagsLb.txt) - most used tags.
  - [`catLb.txt`](./catLb.txt) - most used categories.
  - [`wordLb.txt`](./wordLb.txt) - most used words in titles[^1]. (Min word length is 3)
  - [`chnTagsLb.txt`](./chnTagsLb.txt) - most used tags on a channel.
- [`filter.js`](./filter.js) filters `processedUnlisted.csv`. use `-h` flag for help.
  - `--overview` generates an `overview.md`[^6]
- [`playlist.js`](./playlist.js) - generates a youtube playlist to make your viewing experience just a bit better (read the top of the file for instructions)
  - [my attempt](https://www.youtube.com/playlist?list=PL9PJbB19jd9UIZuXt2YSbGWhwxSVDVUto) since you can only add ~200 videos a day
- [`waterfall.js`](./waterfall.js) - used to generate the image above. `-h`

## Results

From 121,403 videos to 35,797 (thats ~30%).

### [`wordLb.txt`](./wordLb.txt)[^5]

Most of the top words are conjunctions or articles.

YTPMV is a music video featuring various clips from tv shows, movies, commercials, etc. repeated or sped up/slowed down to fit to a beat, usually techno.

num | count | tag | note
--- | --- | --- | ---
3  | 1319 | live | since most unlist VODs
7  | 1021 | fortnite
8  | 907 | apex
10 | 805 | stream
12 | 785 | legends | either related to "League of Legends", "Japanese urban legends" or "Apex legends"
14 | 746 | asmr
15 | 706 | sparta | ytpmv-s of [Sparta remix](https://www.youtube.com/watch?g6o8vELs)
17 | 586 | remix
18 | 576 | battle | the french are excited about "battle royals"/fortnite
19 | 569 | elizabeth | mainly uploads of a TV show "General Hospital - Franco & Elizabeth"
20 | 560 | honeywell | some aviation company just puts their name in their titles
21 | 531 | van  | mainly from a Dutch news show "Drenthe Nu"
22 | 504 | minecraft
23 | 503 | franco | see 19. How franco appears 60 times less is beyond me
24 | 456 | royale | see 18.
26 | 443 | drenthe | see 21.
27 | 424 | days | reuploads of "Days of Our Lives - Ciara & Ben" uploaded by the [same guy](htps://www.youtube.com/@redbil1010) as 19.
29 | 409 | 2017 | combination of 21, VOD dates and [Cold Garak Market](https://www.ub.com/watch?v=xXrrEoOTYSA)
30 | 397 | lives | see 26.
31 | 381 | ben | see 26.
32 | 366 | 渋谷ハル | [Shibuya HAL](https://www.youtube.com/@ShibuyaHAL), a youtuber  tgs his videos with his name. Also plays a loooot of Apex
33 | 362 | sur | french word meaning "on"
34 | 354 | ciara  | see 26.

### [`catLb.txt`](./catLb.txt)

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

```txt
People & Blogs        6365
| tag sum:13777  tags:2521
| ryan boundless       1.17%
| life in japan        0.89%
| living in japan      0.84%
| asmr                 0.66%
```

asmr?

```txt
Entertainment         4953
| tag sum:25371  tags:3992
| asmr                 0.89%
| comedy               0.67%
| funny                0.61%
| ytpmv                0.48%
```

asmr is first??

```txt
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

```txt
Film & Animation      2587
| tag sum:9907   tags:1578
| animation            4.31%
| disney               2.99%
| pixar                2.45%
```

```txt
Science & Technology  2061
| tag sum:13630  tags:1973
```

```txt
News & Politics       1833
| tag sum:8301   tags:671
```

```txt
Education             1488
| tag sum:7384   tags:1468
```

```txt
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

```txt
Howto & Style         671
| tag sum:3317   tags:685
| youtube              0.69%
```

```txt
Travel & Events       568
| tag sum:3333   tags:550
| new zealand          2.82%
| japan                2.10%
| life in japan        2.01%
```

```txt
Sports                553
| tag sum:2862   tags:509
| shredded             1.89%
```

```txt
Autos & Vehicles      271
| tag sum:883    tags:290
| ytpmv                2.38%
```

People like syncing cars to music.

```txt
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

```txt
Pets & Animals        143
| tag sum:379    tags:138
```

nothing interesting

```txt
Trailers              67
| tag sum:2      tags:1
| get better math grades 100.00%
```

what.

## Todo

- sort total tags by once per channel
  - `tagsLb.txt`
  ```txt
  minecraft 20
  | Daniel's channel 60%
  ```

[^1]: The following characters are replaced with a space ()[]【】:|.,'!"*•🔴
[^2]: tags that only appear once
[^3]: "Video ad"-s excluded
[^4]: takes around ~24h to request through 121403 video IDs at ~700ms ping.
[^5]: cant use normal lists since broken ones (3.A 4.B 7.C) are fixed in the gh render
[^6]: titles are excluded of all non alphabetical characters (excluding spaces)

[[BLISS]](https://tube.cadence.moe/cant-think)
