# Vellum — marketing site

Landing page for Vellum: one question a day about your kid, free by email, with an
iOS app in App Store review.

No framework, no build step, no third-party requests — `index.html`, `styles.css`,
`app.js`, two self-hosted webfonts, and `assets/` for app screenshots.

The page has two jobs, in this order: get the email signup (the prompts are live
now), then build anticipation for the app. The countdown is the drama; it is never
the ask.

## Running it

```bash
npm install        # only needed for `npm run check`
npm run serve      # http://localhost:4173
```

Opening `index.html` directly in a browser also works; nothing depends on a server.

Every command in the repo — flags, what it reads, what it writes, what it needs
in the environment — is in [`docs/commands.md`](docs/commands.md).

## Turning the signup on

The design's form was a prototype: it waited 800ms and declared success without
sending anything. The port keeps every visible state — validation, the sending
label, the success card — but refuses to fake a signup. Until an endpoint is set,
submitting a valid address says plainly that nothing was stored.

Set one line at the top of `app.js`:

```js
const SIGNUP = {
  ENDPOINT: 'https://formspree.io/f/xxxxxxxx',   // or Buttondown, or your own /api/subscribe
  SOURCE: 'vellum-landing'
};
```

It posts `{ email, source }` as JSON and treats any non-2xx as a failure. If your
provider wants form-encoded fields or different names, adjust the `fetch` call in
the signup block at the bottom of `app.js`.

## The launch countdown

`LAUNCH` at the top of `app.js` drives the whole thing. The target date is
expected to move — App Store review runs on its own schedule.

```js
const LAUNCH = {
  TARGET: '2026-08-27T16:00:00Z',   // App Store target — pending review
  GRACE_COPY: 'In review with Apple',
  SHIPPED_URL: null                  // set to the App Store link on launch day
};
```

Three states, all implemented and all visually complete:

| State | When | What renders |
|---|---|---|
| **Counting** | before `TARGET` | Days / hours / minutes, live, digits rolling in masked tracks |
| **Grace** | at or past `TARGET`, `SHIPPED_URL` still null | `GRACE_COPY` plus "Submitted. Apple reviews on its own schedule." No dead zeros, no negatives |
| **Shipped** | `SHIPPED_URL` set | A Download on the App Store button. The email signup stays on the page below it |

Time is computed from a fixed UTC instant and recomputed from `Date.now()` on
every tick and on `visibilitychange`, so a tab left open overnight is never
stale. Remaining time is floored at zero, so the counting state cannot render a
negative.

## App screenshots and recordings

**Every capture lives in `assets/` — screenshots in `assets/screens/`,
recordings in `assets/recordings/`.** One place, two consumers: the site reads
it by relative path, and it is also the Remotion project's public directory, so
the video reads the same files through `staticFile()` without a second copy.

31 screenshots and 4 recordings are in, all 1206 × 2622 off an iPhone 16 Pro.
`SHOTS` in `app.js` still has `src: null` for every slot, so the page renders
its designed empty states; each slot reserves its aspect ratio, so promoting a
real PNG causes no layout shift and needs no markup or CSS change.

**[`assets/README.md`](assets/README.md) classifies every capture** — what each
one shows, what it is good for in marketing, and which four to promote into
`SHOTS`. Read the caveats at the top of it first: the archive in these captures
is written he/him, which the site's own copy deliberately is not.

Recordings are committed as `.mp4` — raw `.mov` captures are gitignored, because
no browser plays them reliably and git would carry them at full size forever.

## Social cards

One prompt per image, sized for a feed — warm paper, the kind on a tinted pill,
the instruction marked, the wordmark quiet at the bottom.

```bash
npm run social                                      # all 113, 1080 × 1350
npm run social -- --sheet                           # and a contact sheet of the set
npm run social -- --kind PHOTO,QUESTION --size square
npm run social -- --help
```

PNGs land in `social/out/<size>/`, which is gitignored — they're regenerated,
not stored. `--size` takes `portrait` (1080 × 1350), `square` (1080 × 1080) or
`story` (1080 × 1920); `--kind` and `--cadence` filter the set.

It drives the system Chrome directly, so it needs no `npm install` and no
browser download. Set `CHROME=/path/to/binary` if yours lives somewhere unusual.

**The copy lives in `social/prompts.js`**, seeded from `api/seeds/prompts.yaml`
in the app repo but deliberately forked in two ways. The 99 seeded prompts
written he/him are hand-rewritten in they/them — a public feed is not the place
for the pronoun decision the product has parked, and no conjugator gets "does he
mispronounce" → "do they mispronounce" right every time. And each prompt is
split `pre` + `verb` + `post`, the same shape `app.js` uses for the deck, which
is what lets a card mark one word. The sixteen already in the deck are
reproduced verbatim.

To change which word is marked, move the `verb` boundary in `social/prompts.js`.
To change the look, edit `social/card.css` — it reads the same tokens as
`styles.css`.

## Posting the cards

Three steps, each one handing back to you:

```bash
npm run social:queue -- --count 7    # pick 7 prompts, render cards, schedule them
npm run social:captions              # write captions with Claude — then read them
npm run social:post                  # dry run; add --live to publish
npm run social:post -- --check       # which account are the credentials on?
```

`.github/workflows/social-post.yml` runs the third step at **:07 and :37**,
publishing at most one due post per run — and never within 55 minutes of the
last one, so looking twice an hour does not post twice an hour. Commenting its
two `schedule` lines back out is the whole off switch. A manual run — Actions →
Run workflow — asks for a mode and defaults to `dry-run`.

Most runs have nothing due, and exit green having done nothing. That is not a
failure, and it is why every run writes to its **Summary** page saying in words
which of the several things happened: a green tick on its own means "the check
ran", not "something posted".

It never runs the first two steps: captions are generated locally, reviewed, and
committed, and the poster refuses an entry with no caption — so nothing reaches
the feed that a person hasn't approved.

`social/queue.json` is the schedule and the record of what has gone out.
`social/queue/*.jpg` are the card images, committed because Instagram fetches an
image by public URL rather than accepting an upload — and JPEG because the
publishing API accepts no other format.

**It is live.** The first posts went out 2026-08-20; the rest of the setup is on
Meta's side. Two docs:
[`docs/social-setup-checklist.md`](docs/social-setup-checklist.md) is the
tick-off list with every link you need, and
[`docs/social-posting.md`](docs/social-posting.md) is the runbook behind it —
where the images are served from, what expires when, and what each failure
message means.

## The reel

The same cards, in motion. One sheet of paper; the prompt on it changes.

```bash
npm run social:reel                          # the next 6 unposted cards
npm run social:reel -- --from library --count 10
npm run social:reel -- --seconds 5 --fade 0.5
npm run social:reel -- --dry-run             # print the running order only
npm run social:reel -- --help
```

1080 × 1920, 30fps, four seconds a card. Lands at `social/out/reel.mp4`, which
is gitignored — unlike the queue PNGs there's no reason to carry it, because a
Reel is uploaded from disk rather than fetched by URL.

The queue is the default source, so the video shows what is actually going out,
in the order it is going out. `--from library` ignores the schedule and rotates
through kinds instead, the same rotation `social:queue` uses.

**The fade dips through the paper rather than dissolving one card into the
next.** A true cross-fade puts two sentences on the same grid at half opacity
each, and at 88px that is a quarter-second of mush at exactly the moment the eye
is looking. So the ink lifts off, the page is empty for a beat, and the next
prompt arrives — which is also the truer picture of the product. `--fade`
lengthens that beat; the cards never overlap.

It's a [Remotion](https://remotion.dev) project in `video/`, kept out of the
root because the site is deliberately no-framework and Remotion needs React,
TypeScript and a bundler. To work on the design rather than render it:

```bash
npm run video      # Remotion Studio at http://localhost:3000
```

Studio scrubs the timeline and edits the prompts in a side panel, writing
changes back into `defaultProps` in `video/src/PromptReel.tsx`. Two compositions:
**PromptReel** is the above, **PromptCard** is a single prompt for a one-post
video. Both read `social/prompts.js` for the badge palette, so a kind that
changes colour changes it in the PNGs and the video at once.

Animation has to be frame-driven — `useCurrentFrame()` and `interpolate()`. CSS
`transition` and `animation` preview correctly in a browser and render wrong,
because the renderer screenshots discrete frames and anything on a wall clock
freezes.

## The Instagram set

Ten feed posts and five reels of the app itself — a phone on the same warm
paper, one line of copy over it.

```bash
npm run social:showcase                  # all 15
npm run social:showcase -- --only posts
npm run social:showcase -- --id sealed   # the post and reel of that name
npm run social:showcase -- --dry-run     # the running order only
```

Posts are 1080 × 1350, reels 1080 × 1920 at 30fps, 12–15 seconds. They land in
`social/out/instagram/`, gitignored like the rest of `social/out`.

**All the words live in `social/showcase.js`** — ten posts and five reels, each
naming a capture from `assets/screens` and the copy that goes over it. The
design is `video/src/Post.tsx` and `video/src/Showcase.tsx`, which share the
phone frame, the paper and the dip-through fade with the prompt reel. Reels use
the same three-beat shape: a line on bare paper, the app, a line to close.

**The copy over the top is they/them; the archive inside the screenshots is
not.** The captures were taken against a he/him profile, so several of these
have "him" visible on the phone under a caption that says "they". Both the dry
run and the real run mark which ones. It is worth re-capturing against a
they/them archive before these go out — the app supports it, and
[`assets/README.md`](assets/README.md) says which screens are affected.

## Deploying

Live at **https://getvellumapp.com** — registered Aug 18 2026 and pointed at
Pages, which replaced `travist6983.github.io/Rascal-Marketing` as the address
this site is built for.

The domain is one line: `ORIGIN` in `site.config.json`. Setting it is what makes
the build emit self-referencing canonicals, absolute OG URLs, an Organization
`url`, `sitemap.xml` and `dist/CNAME` — the last of which is what tells Pages to
serve at the domain root instead of `/<repo-name>/`. Clearing `ORIGIN` turns all
five off together, and `npm run check` fails if any of them disagree about the
host.

The product is Vellum; the repo is still `Rascal-Marketing`. The product has now
outlived two names — Rascal, then Dogear — and the repo has kept the first one
through both. One of the two reasons has now expired: the Pages project URL is no
longer the address anybody visits. The other still holds — `Rascal-Marketing` is
in the `raw.githubusercontent.com` base in `scripts/social-post.mjs` that
Instagram fetches card images from, and renaming the repo breaks that until it
changes with it. So it stays, on one reason instead of two.

Pages Source is set to **GitHub Actions**, so
`.github/workflows/pages-actions.yml` is the deploy. It stages the site, adds a
content-hash query to `styles.css` and `app.js` so a new deploy can't be served
with a cached stylesheet, and publishes on every push to `main`.

**DNS**, for the record: an apex domain on Pages needs A/AAAA records at GitHub's
four addresses, not a CNAME record — a `CNAME` *file* in the artifact and a CNAME
*record* at the registrar are different things, and the apex can only use the
former. `www` may be a CNAME record to `travist6983.github.io`.

## Checking it

```bash
npm run check
```

Renders the page in Chromium at desktop, tablet and mobile widths and fails on
JS errors, sideways scroll, a webfont that silently fell back, a success card
visible before submitting, a card deck that stops advancing, and any of the
form's three validation messages going missing. Screenshots land in
`screenshots/`.

## What's what

| Path | |
|---|---|
| `index.html` | All the markup and copy |
| `styles.css` | The design's inline styles, lifted into classes |
| `app.js` | Card deck, drag-to-deal, scroll reveals, timeline, signup |
| `fonts/` | Nunito and Source Sans 3, self-hosted |
| `assets/` | Every capture — screenshots, recordings, og image. Also the video's public dir. See `assets/README.md` |
| `social/prompts.js` | The prompt library in marketing voice — they/them, verb split out |
| `social/card.mjs` · `social/card.css` | Card rendering and its design |
| `social/queue.mjs` · `social/queue.json` | The posting schedule and what has gone out |
| `scripts/social-cards.mjs` | Renders the whole library as PNGs for review |
| `scripts/social-queue.mjs` | Adds posts to the queue |
| `scripts/social-caption.mjs` | Writes captions with Claude |
| `scripts/social-post.mjs` | Publishes the next due post |
| `scripts/social-reel.mjs` | Renders a run of prompts as one video |
| `social/showcase.js` | Copy for the Instagram set — 10 posts, 5 reels |
| `scripts/social-showcase.mjs` | Renders the Instagram set from the app captures |
| `video/` | The Remotion project — `PromptReel` and `PromptCard` |
| `docs/commands.md` | Every command, its flags, inputs and outputs |
| `scripts/build-artifact.mjs` | Bundles everything into one self-contained file |
| `scripts/check.mjs` | The browser checks above |
| `scripts/serve.mjs` | Local static server |

## Notes on the port

- The original ran on Claude Design's preview runtime, which pulls React,
  ReactDOM and Babel from a CDN at page load and interprets the `x-dc` template
  DSL in the browser. That's a design-tool harness, so it's gone; the `DCLogic`
  component's logic is reproduced in plain JS with the same transform maths,
  easings and thresholds.
- The design's `data-props` (`stackDepth`, `dragToDeal`, `submitDelayMs`) are
  kept as a `PROPS` object in `app.js`.
- The fonts were `<link>`ed from Google Fonts; they're self-hosted here so the
  page makes no third-party requests at all.
- The three cards' hover states were React state in the original and are plain
  CSS `:hover` here.
- The design commits to one warm paper palette, so the page is deliberately
  single-theme rather than light/dark aware.
