# Unlisted analysis

![waterfall](./waterfall22356x3000.png)

This is an analysis of SponsorBlock [`unlistedvideos.csv`](https://mirror.sb.mchang.xyz/).

## Why?

Boredom will kill, and finding gold is fun.

## Whats included?

- `process.js` takes in `unlistedVideos.csv` and (slowly) spits out an enriched version...
  - `processedUnlisted.csv` - which adds the title, tags and category.
- `sort.js` takes in the previously generated `processedUnlisted.csv` and (would you know it) sorts it into...
  - `rawsort.json` - a cache (use with `--cache` flag).
  - `chnLb.txt` - a human friendly table consistin of a channel name, unlisted video count and unlisted video ids.
  - `tagLb.txt` - most used tags.
  - `catLb.txt` - most used categories.
- `filter.js` filters `processedUnlisted.csv`. use `-h` flag for help.
- `waterfall.js` - used to generate the image above. `-h`

## How long does it take?

~24h to request through 121403 video ids at ~700ms ping.

[[BLISS]](https://tube.cadence.moe/cant-think)
