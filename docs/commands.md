# Commands

Every command in this repo: what it does, what it needs, what it leaves behind.

Anything after `--` is passed through to the script, so flags go
`npm run social -- --size square`, not `npm run social --size square`. Every
script that takes flags also takes `--help`.

| Command | Does | Writes |
|---|---|---|
| `npm run serve` | Local preview of the site | — |
| `npm run check` | Browser checks at four widths | `screenshots/` |
| `npm run design` | Static design scan | — |
| `npm run design:live` | Design scan against the live render | — |
| `npm run build:artifact` | Bundles the site into one file | `dist/artifact.html` |
| `npm run social` | The whole library as PNGs, for review | `social/out/<size>/` |
| `npm run social:queue` | Picks prompts, renders cards, schedules them | `social/queue/`, `social/queue.json` |
| `npm run social:captions` | Writes captions with Claude | `social/queue.json` |
| `npm run social:post` | Publishes the next due post | `social/queue.json` |
| `npm run social:reel` | A run of prompts as one video | `social/out/reel.mp4` |
| `npm run social:showcase` | The Instagram set — 10 posts and 5 reels of the app | `social/out/instagram/` |
| `npm run ads` | The paid ad creatives — nine layouts, three canvases | `social/out/ads/` |
| `npm run video` | Remotion Studio, to work on the video | — |

**First run:** `npm install` at the root is only needed for `npm run check` and
`npm run social:captions`. The card renderer drives system Chrome directly and
needs nothing installed. The video lives in its own package — `cd video && npm i`
— which is already done in this checkout.

**Only one command reaches the outside world:** `npm run social:post -- --live`.
Everything else is local.

---

## The site

### `npm run serve`

Zero-dependency static server for local preview.

```bash
npm run serve            # http://localhost:4173
PORT=8080 npm run serve
```

**Reads** `index.html`, `styles.css`, `app.js`, `fonts/`, `assets/`
**Writes** nothing
**Needs** nothing. Runs until you stop it.

### `npm run check`

Renders the page in Chromium at desktop, tablet, mobile and 375px, and fails on
the things that are easy to ship broken: uncaught JS errors, console errors,
sideways scroll, a webfont that silently fell back, a success card visible
before submitting, a deck that stops advancing, and any of the form's three
validation messages going missing.

**Reads** `index.html` from disk over `file://` — not the dev server
**Writes** `screenshots/*.png`, one per width
**Needs** `npm install` (Playwright). `CHROMIUM_PATH` overrides the browser.
**Exit** non-zero on any failure, with the list. This is the gate before a push.

### `npm run design` · `npm run design:live`

Impeccable's design detector. The static one reads source files; the live one
boots the server on port 4319 and scans the real render, which is the only way
to catch contrast, leading, occlusion and content hidden at rest.

**Writes** nothing — both print findings
**Needs** `design:live` additionally needs puppeteer, which Impeccable loads for
URL scanning but does not bundle:

```bash
npm i -D puppeteer
# or, if Chromium is already on the machine:
PUPPETEER_SKIP_DOWNLOAD=true npm i -D puppeteer
PUPPETEER_EXECUTABLE_PATH=/path/to/chromium npm run design:live
```

### `npm run build:artifact`

Bundles the site into a single self-contained fragment for publishing as a
Claude Artifact — strips the document shell the published page supplies itself,
and inlines the stylesheet, the script and both webfonts as data URIs, because
the artifact CSP blocks every external host.

**Reads** `index.html`, `styles.css`, `app.js`, `fonts/*.woff2`
**Writes** `dist/artifact.html`

---

## The prompt library as images

### `npm run social`

Renders prompts as cards — one prompt per PNG, sized for a feed. This is the
review surface: it renders the whole set so you can look at it. Use
`social:queue` to put specific cards in front of the poster.

```bash
npm run social                                      # all 113, portrait
npm run social -- --sheet                           # and a contact sheet
npm run social -- --kind PHOTO,QUESTION --size square
npm run social -- --cadence weekly --limit 10
```

**Options**
`--size portrait|square|story` (portrait — 1080×1350, 1080×1080, 1080×1920) ·
`--kind K,K` from QUESTION, PHOTO, VIDEO, VOICE, ACTIVITY, LETTER ·
`--cadence daily,weekly,monthly` ·
`--limit N` first N after filtering ·
`--out DIR` (`social/out`) ·
`--sheet` also write a contact sheet ·
`--keep-html` leave the intermediate HTML ·
`--concurrency N` parallel Chrome processes (5)

**Reads** `social/prompts.js` (copy), `social/card.css` (design), `fonts/`
**Writes** `social/out/<size>/*.png` — **the size folder is wiped first**, so
these are regenerated, never stored. Gitignored.
**Needs** system Chrome. `CHROME=/path/to/binary` if yours lives somewhere
unusual. No `npm install`, no browser download.

The library is 113 prompts: 30 QUESTION, 26 PHOTO, 25 ACTIVITY, 12 VIDEO,
12 VOICE, 8 LETTER — 91 daily, 10 weekly, 12 monthly.

---

## Posting

Three steps, each one handing back to you. Captions are a separate step from
posting on purpose: the poster refuses an entry with no caption, so nothing
reaches the feed that a person hasn't read.

### `npm run social:queue`

Picks prompts, renders their cards, and appends dated entries to the queue.

```bash
npm run social:queue -- --count 7
npm run social:queue -- --count 14 --start 2026-09-01 --at 15:00
npm run social:queue -- --slug photograph-the-mess-they-made-don-t-clean
npm run social:queue -- --list                 # print the queue and exit
npm run social:queue -- --dry-run
```

**Options**
`--count N` (7) · `--start YYYY-MM-DD` (tomorrow) · `--at HH:MM` (15:00) ·
`--every N` days between posts (1) · `--kind K,K` · `--slug SLUG` queue one
specific prompt · `--order mix|library` (mix) · `--size portrait|square|story`
(portrait) · `--list` · `--dry-run`

**Times are UTC.** Converting a local time with a DST-aware library is a
dependency this repo doesn't have, and a poster that fires an hour early twice
a year is worse than one that asks you to do the conversion once.

`mix` rotates through kinds so the feed alternates colour and shape without
anyone curating it; `library` follows `social/prompts.js` top to bottom, which
is grouped by kind and gives you a fortnight of QUESTION cards.

**Reads** `social/prompts.js`, `social/queue.json`
**Writes** `social/queue/<id>.png` and `social/queue.json` — **both committed.**
The PNGs because Instagram fetches images by public URL rather than accepting an
upload; the JSON because it is the schedule and the record of what has gone out.

### `npm run social:captions`

Writes captions with Claude for queued posts that don't have one.

```bash
npm run social:captions                 # every post missing a caption
npm run social:captions -- --limit 3
npm run social:captions -- --id 2026-08-15-photograph-their-hands --force
npm run social:captions -- --dry-run    # print the prompt, call nothing
```

**Options** `--limit N` · `--id ID` · `--force` rewrite existing captions ·
`--dry-run` · `--model ID` (`claude-opus-5`)

**Reads** `social/queue.json`
**Writes** `social/queue.json` — fills in `caption`, `altText`, `hashtags`
**Needs** `ANTHROPIC_API_KEY` in the environment, or an `ant auth login` profile,
plus `npm install` for the SDK. `--dry-run` and `--help` work without either.
**Limits** 2200 characters and 30 hashtags — Instagram's own ceilings, where
exceeding either is a rejected post rather than a warning.

Then: open `social/queue.json`, read what it wrote, fix anything that isn't
right, commit. The voice brief lives in `VOICE` at the top of
`scripts/social-caption.mjs` and is the one part worth rewriting.

### `npm run social:post`

Publishes the next due post to Instagram.

```bash
npm run social:post                 # dry run — says what it would post
npm run social:post -- --live       # actually publishes
npm run social:post -- --id ID --live
```

**Options** `--live` · `--id ID` post a specific entry · `--force` post before
the scheduled time

**Dry run is the default and `--live` is required.** Posting is public and
cannot be undone from here, so the flag is the confirmation step. Without
credentials it refuses to pretend — it prints the exact request it would have
sent and says plainly that nothing was published.

**Reads** `social/queue.json`, and the card PNG by public URL
**Writes** `social/queue.json` — stamps `postedAt` and `mediaId`
**Needs**

| Variable | |
|---|---|
| `IG_USER_ID` | Instagram professional account id |
| `IG_ACCESS_TOKEN` | Long-lived access token |
| `SOCIAL_IMAGE_BASE` | Public base URL for the card PNGs (optional — defaults to raw githubusercontent for this repo) |
| `IG_API_HOST` | Graph host (optional — `https://graph.instagram.com`) |
| `IG_API_VERSION` | Graph API version (optional — `v23.0`) |

Meta's documented ceiling is 25 API-published posts per rolling 24 hours; the
script stops there so a catch-up run can't surprise anyone.

`.github/workflows/social-post.yml` can run this on a schedule, **but the
schedule is commented out** — nothing posts by itself. Actions → Run workflow is
the only path, and it defaults to a dry run. Where each credential comes from is
[`docs/social-posting.md`](social-posting.md); the tick-off list is
[`docs/social-setup-checklist.md`](social-setup-checklist.md).

---

## The video

### `npm run social:reel`

Renders a run of prompts as one vertical video — each card holds, fades out, and
the next fades in on the same paper.

```bash
npm run social:reel                          # the next 6 unposted cards
npm run social:reel -- --count 10
npm run social:reel -- --from library --kind PHOTO,VIDEO
npm run social:reel -- --seconds 5 --fade 0.5
npm run social:reel -- --dry-run             # print the running order only
```

**Options**
`--from queue|library` (queue) · `--count N` (6) · `--kind K,K` and
`--cadence C,C` (library source only — the queue is already chosen) ·
`--seconds N` how long each card holds (4) · `--fade N` seconds of fade between
cards (0.4) · `--out PATH` (`social/out/reel.mp4`) · `--dry-run`

**Reads** `social/queue.json` (queue source) or `social/prompts.js` (library
source), and the design from `video/src/`
**Writes** `social/out/reel.mp4`, 1080×1920 at 30fps. **Gitignored** — unlike the
queue PNGs there's no reason to carry it, because a Reel is uploaded from disk
rather than fetched by URL. It sits beside `social/out/<size>/`, which
`npm run social` wipes; the reel is not in that folder and survives.
**Needs** the `video/` package installed. Nothing else.

The queue is the default source so the video shows what is actually going out,
in the order it is going out. The queue stores each prompt as one flat sentence
but a card needs the verb split out to mark it, so the slug is the join —
queued entries with no match in the library are reported and skipped.

A card is `--seconds` long *including* its fades, so the run is exactly
`count × seconds`. `--fade` has to fit twice inside `--seconds` or the script
refuses.

### `npm run social:showcase`

The Instagram set built from the app captures in `assets/` — 10 feed posts as
PNGs and 5 reels as MP4s. Where the other two renderers show the *prompts*, this
one shows the *product*: a phone on paper with a line of copy over it.

```bash
npm run social:showcase                  # all 15
npm run social:showcase -- --only posts
npm run social:showcase -- --id sealed   # the post and reel named sealed
npm run social:showcase -- --dry-run     # list what would render
```

**Options** `--only posts|reels` · `--id ID,ID` · `--out DIR`
(`social/out/instagram`) · `--dry-run`

**Reads** `social/showcase.js` (all the copy), `assets/screens/` and
`assets/recordings/` (the captures), `video/src/Post.tsx` and
`video/src/Showcase.tsx` (the design)
**Writes** `social/out/instagram/post-<id>.png` at 1080 × 1350 and
`reel-<id>.mp4` at 1080 × 1920, 30fps. Gitignored.
**Needs** the `video/` package installed. Nothing else.

To change the copy, edit `social/showcase.js` — it is the only file with words
in it. To change how a post or reel looks, edit the two components.

The run bundles the Remotion project **once** and points all fifteen renders at
that bundle. Fifteen separate `remotion render` calls would each rebuild the
project first, which costs more than all fifteen renders put together.

Both `--dry-run` and the real run mark every item whose screenshot has he/him
copy visible in it, because the archive in the captures is written that way and
the overlaid copy is not. See [`assets/README.md`](../assets/README.md).

### `npm run ads`

The bought placement: twelve creatives with a headline, something to look at,
and a button. Where `social:showcase` makes the organic post, this makes the ad.

```bash
npm run ads                                  # all four, portrait, waitlist button
npm run ads -- --size portrait,square,story
npm run ads -- --id sealed,no-streaks        # only these
npm run ads -- --cta waitlist,launch         # both buttons, side by side
npm run ads -- --sheet                       # and a contact sheet
npm run ads -- --keep-html                   # leave the HTML beside the PNGs
```

**Options** `--size portrait,square,story` (`portrait`) · `--cta
waitlist,launch` (`waitlist`) · `--id ID,ID` · `--out DIR` (`social/out/ads`) ·
`--sheet` · `--keep-html` · `--concurrency N` (4)
**Queue options** `--queue` · `--start YYYY-MM-DD` (the day after the queue
ends) · `--at HH:MM[,HH:MM…]` (`15:00`, UTC) · `--every N` (1) · `--dry-run` ·
`--force`

#### Putting a creative in the Instagram queue

```bash
npm run ads -- --queue --id ledger,library --dry-run   # what it would schedule
npm run ads -- --queue --id ledger,library             # render + schedule
npm run social:captions                                # write the words
# read social/queue.json, edit anything that isn't right, then commit and push
```

`--queue` renders into `social/queue/` **as JPEG** and appends entries to
`social/queue.json` — the same two things `npm run social:queue` does for prompt
cards, and for the same reasons: Instagram fetches the image from a public HTTPS
URL rather than accepting an upload, so the file has to be committed and pushed
before the post can be created, and the API takes no format but JPEG.

Three things this path does that plain `npm run ads` does not:

- **It never clears the directory.** `social/queue/` holds cards that have
  already posted. The `rmSync` on the normal path is safe only because that
  output is disposable.
- **It refuses to schedule anything if any creative is overset.** Everywhere
  else an overset render is still written so you can look at it. Here the next
  thing to touch the file is a poster running unattended on a schedule.
- **It defaults `--start` to the day after the queue currently ends,** because
  "tomorrow" drops an ad on top of a prompt card scheduled months ago, and two
  entries can hold the same minute with no complaint.

Portrait only, and one `--cta`: a feed post is one image, and Instagram's feed
stops at 4:5 — a story is 9:16 and comes back cropped or refused without saying
which.

Entries land with `kind: "AD"` and an `ad` object carrying the headline, the
subhead and the button. `npm run social:captions` reads that and writes to an
ad brief rather than the prompt-card one, because a caption that restates the
headline is the post saying the same thing twice. Caption and alt text start
null and the poster refuses an entry without them — that gate is what keeps
anything reaching the feed a person hasn't read.

**Reads** `social/ads.js` (all the copy, both CTA strings and the line under the
button), `social/ad.css` (the design), `social/ad.mjs` (the four layouts),
`assets/screens/` (the captures), `src/partials/header.html` (the lockup — the
site's own fan-of-cards mark and drawn wordmark, lifted rather than redrawn),
`src/assets/icon.svg` and `site.config.json` (the app icon in the notification),
`fonts/`
**Writes** `social/out/ads/<id>-<size>-<cta>.png` at 1080 × 1350, 1080 × 1080
and 1080 × 1920. Not committed — regenerate rather than store.
**Needs** system Chrome and Playwright. Same pair the prompt cards use.

**Type is the landing page's, not the ad's own.** `--display` is Nunito and
`--text` is the system stack, copied from `src/assets/site.css`. Nunito is the
only webfont this site has, so it is the only one an ad inlines; Source Sans 3
is still shipped and still sets every prompt card, and is simply not a face the
site uses. `fontFaces()` in `social/card.mjs` takes the list.

**The button has two strings** because a creative is booked before a store
listing is live: `waitlist` is `CTA` from `site.config.json` verbatim, `launch`
names the App Store. Ask for both and you get both sets so they can be judged at
size. The line under the button is `/pricing`'s H1 — it replaced "Free by email
· iPhone app soon", which described a product that had not shipped.

The nine layouts are `feature`, `notify`, `compare`, `quiet`, `capture`,
`ledger`, `card`, `pricing` and `library`; which one a creative uses is its
`template` field. To change the words, edit `social/ads.js` — it is the only
file with any in it.

`capture` is a series: `voice`, `photo`, `video` and `activity` share the
skeleton and differ only in `evidence.kind` — `voice` draws a waveform and its
transcript, `plate` a still and the prompt that sent you looking, `did` no media
at all, because an activity has none.

**No price, name, domain or prompt count is typed into an ad.** They are
`{{TOKEN}}`s resolved from `site.config.json`, to a fixed point — `PRICE_YEAR`
resolves to a string that itself contains `PRICE_YEAR_NUM` — and `adHtml()`
throws rather than return a document with a token still standing in it.

**It exits non-zero when copy does not fit.** After the webfont loads, the
headline has been shrunk to its box and the band's row has been shrunk to its
margin, the page measures every element that carries a word and reports anything
that leaves the canvas, runs under the band, overruns the band's margin, or
collides with the phone.

"Overset" is measured as *does any block in the copy column end below the
column's content edge*, not as `scrollHeight > clientHeight`. The accent's hand
mark hangs 0.19em below the phrase it underlines and `.accent` is a positioned
inline whose glyph box escapes a 1.08 line-height — both are descendants of the
copy box, both count toward its scroll height, and both scale with the font. Ask
the crude question and any creative whose headline is the LAST thing in its
column grinds that headline down to its floor chasing an overflow no font size
can clear, then reports it as overset anyway. A sentence three words too long is invisible
in a thumbnail and obvious in a paid placement, and this is the only defect the
renderer cannot show you by rendering. The PNGs are written anyway so you can
see what happened.

Creatives whose capture has he/him copy visible in frame carry
`pronouns: 'he/him'` in `social/ads.js`, the same flag the Instagram set uses,
for the same reason — see [`assets/README.md`](../assets/README.md).

### `npm run video`

Remotion Studio — the preview and editing surface for the video.

```bash
npm run video            # http://localhost:3000
```

Scrub the timeline, and edit the prompts in the right-hand props panel: Studio
writes changes back into `defaultProps` in `video/src/PromptReel.tsx`. Two
compositions:

| | |
|---|---|
| **Showcase** | An Instagram reel of the app. Length follows its scenes. |
| **Post** | An Instagram feed post, 1080 × 1350. A still, no timeline. |
| **PromptReel** | The prompt reel. Length follows the number of prompts. |
| **PromptCard** | A single prompt, 5s — for a one-post video. |

Runs until you stop it.

### Rendering by hand

The npm script covers the queue path. For anything else, run Remotion directly
from `video/`:

```bash
cd video

npx remotion compositions                          # what's registered
npx remotion render PromptReel out/reel.mp4        # render with defaults
npx remotion render PromptReel out/r.mp4 --props=props.json
npx remotion still PromptCard --frame=90 out/card.png
npx remotion studio --no-open

npm run lint                                       # eslint + tsc
npm run build                                      # bundle for a headless render host
npx remotion add @remotion/fonts                   # add a Remotion package
npx remotion upgrade                               # move all of them together
```

`--frame` is zero-based, so `--frame=90` is the three-second mark at 30fps.
`--scale=0.4` renders small and fast when you only want to check layout.
`--frames=100-126 --sequence` writes a range as stills, which is how you inspect
a transition frame by frame.

Use `npx remotion add` rather than `npm i` for `@remotion/*`, `mediabunny` and
`zod` — it pins the version that matches the rest of Remotion.

The video's public directory is the repo's `assets/`, set by
`Config.setPublicDir("../assets")` in `video/remotion.config.ts`, so
`staticFile("screens/today.png")` reads the same capture the site serves at
`assets/screens/today.png`. See [`assets/README.md`](../assets/README.md).

### Converting a screen recording

ffmpeg ships with Remotion, so there is nothing to install. Raw `.mov` captures
are gitignored; commit the `.mp4`.

```bash
npx --prefix video remotion ffmpeg -i assets/recordings/composer.mov \
  -vcodec libx264 -crf 24 -pix_fmt yuv420p -an \
  assets/recordings/composer.mp4
```

`-an` drops the audio a UI recording has no use for, `-crf 24` trades quality
against size (lower is bigger), and `-pix_fmt yuv420p` is what makes it play in
Safari.

**Animation has to be frame-driven** — `useCurrentFrame()` and `interpolate()`.
CSS `transition` and `animation` preview correctly in a browser and render
wrong, because the renderer screenshots discrete frames and anything on a wall
clock freezes.
