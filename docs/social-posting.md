# Posting cards to Instagram

Three commands, run in order. Each one stops and hands back to you.

```bash
npm run social:queue -- --count 7    # pick 7 prompts, render their cards, schedule them
npm run social:captions              # write captions with Claude — then you read them
npm run social:post                  # dry run: shows exactly what would post
npm run social:post -- --live        # publishes
npm run social:post -- --check       # which account are the credentials on?
```

The third step **runs itself** from `.github/workflows/social-post.yml`.
The first two never do: captions are generated on your machine, read by you, and
committed. Nothing reaches the feed that a person hasn't approved.

**Setting this up for the first time?** Use
[`social-setup-checklist.md`](social-setup-checklist.md) — same ground, as boxes
you can tick, with direct links to every console and token tool. This file is
the reference behind it.

> **Status: PAUSED for the rename. Nothing posts.** The `schedule` block in
> `.github/workflows/social-post.yml` was commented out on 2026-08-27 because the
> `IG_USER_ID` / `IG_ACCESS_TOKEN` secrets still point at `@getvellum.app`, and
> Vellum is a name this product no longer has. That account is **frozen, not
> deleted** — its 33 published posts stay up and their captions are never edited
> — and it must stop receiving new ones. To restart: repoint both secrets at
> `@pocketchronicle.app`, run `workflow_dispatch` → `check-account` once to
> confirm which account they resolve to, then uncomment the `schedule` block.
>
> **Before the schedule goes back on, re-render the twelve pending ad creatives.**
> `social/queue.json`'s twelve entries dated 2026-09-03 → 2026-09-14 had their
> `subhead`, `shows` and `altText` renamed to Pocket Chronicle on Aug 27 2026, but
> the committed JPEGs in `social/queue/` still draw the old wordmark in their
> pixels. Publishing one now would post a Vellum image under alt text that says
> Pocket Chronicle — a description of an image that is not there, which is worse
> than either half alone.
>
> It was left that way deliberately rather than fixed in the rename pass, because
> `npm run ads -- --queue --force` re-renders the images **and nulls `caption`,
> `altText` and `hashtags`** on the entries it rewrites, and those captions were
> written and read by a person. Whoever does it must re-render and then restore
> the five hand-written alt texts (`2026-09-05-sealed`, `-09-06-camera-roll`,
> `-09-08-photo`, `-09-09-video`, `-09-14-no-streaks`) and the twelve captions —
> or re-render the JPEGs out-of-band and leave `queue.json` alone.
>
> **The 33 already-published cards are not in scope and must not be re-rendered.**
> They are public on the frozen `@getvellum.app` account. None of them contains
> the product name in text — checked — so nothing about them is stale except the
> wordmark in the pixels, which is history now.
>
> What was proven before the pause still stands and does not need re-proving:
> the first post published on 2026-08-20 (media id 18616663639048675) from a
> manual `workflow_dispatch` run, and both paths that talk to someone else's
> server — the Claude call and the Instagram call — were exercised end to end.
> The schedule ran from that day until the pause.

---

## What you have to do

### 1. Instagram account and Meta app

This is the long part, and it's all on Meta's side.

1. **The account must be a Professional account** (Business or Creator).
   Personal accounts cannot be posted to by any API. Switch it in the Instagram
   app under Settings → Account type.
2. **Create an app** at [developers.facebook.com](https://developers.facebook.com/apps)
   and add the Instagram product to it.
3. **Get an access token** with permission to read the account and publish
   content. Meta currently offers two flows — *Instagram API with Instagram
   Login* (no Facebook Page needed) and *Instagram API with Facebook Login*
   (requires the account be linked to a Page). The first is simpler; pick it
   unless you already have a Page in the loop.
4. **Note your Instagram user ID** — the numeric id of the professional
   account, not the @handle.
5. **Exchange for a long-lived token.** Short-lived tokens last an hour.

> ⚠️ **Check the specifics against Meta's current docs before your first run.**
> Permission names, the API version, and the exact endpoint host change more
> often than anything else in this repo, and the values in
> `scripts/social-post.mjs` reflect what was current when it was written, not
> what is current today. They are all in one `CONFIG` block at the top of that
> file and all overridable from the environment, so correcting them is a config
> change and not a code change.

### 2. Put the credentials in GitHub

**Settings → Secrets and variables → Actions.**

| Where | Name | Value |
|---|---|---|
| Secret | `IG_USER_ID` | The numeric Instagram account id from step 1 |
| Secret | `IG_ACCESS_TOKEN` | The long-lived access token |
| Variable | `SOCIAL_IMAGE_BASE` | *Optional* — only if you're not using the default (below) |

For local runs, the same values as environment variables:

```bash
export IG_USER_ID=17841400000000000
export IG_ACCESS_TOKEN=IGQVJ...
```

### 3. An Anthropic API key, for captions only

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Local only — the workflow never calls Claude. If you already use the `ant` CLI,
an `ant auth login` profile works instead and no env var is needed.

Cost is small enough to be a rounding error: captions are a few hundred tokens
each on Claude Opus 5, so a month of daily posts is well under a dollar.
`npm run social:captions` prints the token count and a cost estimate after every
run so you can check that against the Console rather than trusting this
paragraph.

### 4. The schedule

**The schedule is OFF as of 2026-08-27 — see the status note at the top.** What
follows describes it as it ran from 2026-08-20 until then, and as it will run
again once the credentials are swapped; the shape is unchanged and the block is
commented out rather than deleted.

**It is a watcher rather than a series of checks.** Hourly at :17,
`.github/workflows/social-post.yml` starts a job that then checks the queue
**every ten minutes for five hours**, from inside a single step. To stop it,
comment its `schedule` block back out. That is the entire switch, in both
directions, and it is currently in the "out" position.

**Why that shape, and not a frequent cron.** GitHub's scheduler could not be
relied on to start anything on time. Measured here on 2026-08-20, not assumed:

| Cron asked for | What GitHub delivered |
|---|---|
| `5 * * * *` | the first firing never happened at all |
| `7,37 * * * *` | two firings, 21 and 26 minutes late |
| `3,13,23,33,43,53 * * * *` | one firing, then nothing for 71 minutes |

The Actions status page read operational throughout and push-triggered workflows
ran normally, so the schedule was simply being dropped — and asking *more* often
appeared to make it worse, not better. So the workflow stopped needing many
firings. A job may run for six hours; this one watches for five. A scheduler
that drops four firings in a row now costs nothing, because a watcher is already
running when they are dropped.

The hourly cron is only a **starter**. If a watcher is already going, the
concurrency group holds the new firing until it finishes and then runs it, so
coverage continues across the handover; if none is going, the next firing to
survive starts one.

**Looking often is still not posting often.** The rate lives in the poster, not
the cron: `MIN_GAP_MS` in `scripts/social-post.mjs` refuses to publish within
**55 minutes** of the last publish, and says so on a green pass. Checking more
often cannot raise the posting rate; only lowering `MIN_GAP_MS` can. In steady
state — the queue's closest slots are two hours apart — the limiter never has
anything to say.

A manual run is **Actions → Post to Instagram → Run workflow**, and it asks
which of three things you want:

| Mode | What it does |
|---|---|
| `dry-run` *(default)* | Resolves the next due post and prints its image URL, alt text and caption. Publishes nothing. The fastest way to confirm the secrets and the image URL are right. |
| `publish` | Posts the next due card for real, once, then exits. |
| `watch` | What the schedule runs: publishes what comes due over the next five hours. |
| `check-account` | Asks Instagram which account the credentials belong to and lists its last ten posts, with permalinks. Publishes nothing. |

`check-account` is the one to reach for when a run says it published and you
can't find the post. A `media_publish` call that returns an id **did** publish —
but to whatever account `IG_USER_ID` names, which is not necessarily the one
you're looking at. This prints the username, so there's nothing left to guess.

Most hourly runs have nothing to do, and that is not a failure. A run with
nothing due exits green and says so on its **Summary** page, naming the next
post and how long until it's due. Read the Summary, not the tick — a green run
means "the check ran", not "something posted".

**A catch-up is one post per hour, not a burst.** If runs are missed — GitHub
skips scheduled runs under load, and pauses them entirely on repos with no
activity for 60 days — the queue doesn't fire all at once when it comes back.
Each run takes the single oldest due post and none within 55 minutes of the
last, so four missed slots take about four hours to drain. Late posts still go out rather than being dropped: the prompts
are evergreen and a late one beats a lost one. Anything more than six hours past
its slot posts with a `::warning::` saying so, so a catch-up is visible in the
Actions annotations rather than only in the timestamps.

**One bad entry costs one post, not the feed.** The queue is drained
oldest-first, so an entry that stops the run stops every run after it. It
doesn't: a post with no caption, no alt text, or a card missing from the
checkout is skipped with a warning and the run moves to the next due one. Only a
setup problem — no credentials, no image origin — stops the run outright, since
every entry would fail that identically. If *every* due post is unpublishable
the run goes red and stays red each hour, which is the correct alarm: the feed
has stopped and only a commit restarts it.

**Publishing asks Instagram before it trusts the file.** `postedAt` is written
after the publish and only becomes durable when the workflow's commit reaches
main, so a successful publish followed by a failed push would leave the queue
saying "pending" and post the same card again an hour later. Before creating a
container the poster checks the account's recent media for the caption; if it's
already there it records the existing media id and exits green instead of
posting a duplicate.

---

## Where the images are served from

Instagram's publishing API **does not accept an image upload.** You hand it a
public HTTPS URL, Meta's servers fetch the image, and you publish the container
that comes back. So the card has to be on the public internet before the post
can be created — which is why `social/queue/*.jpg` are committed rather than
living in the gitignored render directory.

**The cards are JPEG, and that is not a preference.** Meta's content publishing
doc is blunt about it — *"JPEG is the only image format supported"* — and a PNG
URL fails as a container in `ERROR` rather than as a readable message. Chrome's
own `--screenshot` flag only ever writes PNG, which is why `social/card.mjs`
takes its shots through Playwright pointed at the same Chrome binary: the
renderer is unchanged, only the encoder is ours to pick.

**The default is `raw.githubusercontent.com`**, which serves this public repo's
files the moment a commit lands:

```
https://raw.githubusercontent.com/travist6983/Rascal-Marketing/main/social/queue/<id>.jpg
```

No deploy step sits between committing a card and being able to post it. That
matters here specifically: this repo's GitHub Pages deploys have a documented
history of hanging and being cancelled at the ten-minute mark (see the comment
at the top of `.github/workflows/pages-actions.yml`), and a poster that depends
on a deploy landing is a poster that silently stops when Pages has a bad day.

**If you'd rather serve them from Pages**, set the `SOCIAL_IMAGE_BASE` variable
to `https://pocketchronicle.app` and add the queue directory
to the staging step in `pages-actions.yml`, which currently copies only four
files:

```yaml
mkdir -p _site/social/queue
cp social/queue/*.jpg _site/social/queue/
```

One catch if you go that route: a push made by the workflow's own
`GITHUB_TOKEN` does **not** trigger other workflows, so the Pages deploy won't
run itself after the poster commits. That's harmless with the raw URL default,
because nothing needs deploying.

---

## Things that will eventually bite you

**The access token expires.** Long-lived Instagram tokens last about 60 days
and have to be refreshed before they lapse. Nothing here automates that or warns
you — the first sign will be a failed workflow run with an auth error in the
log. Put a calendar reminder somewhere for ~50 days out.

**Instagram's publishing limit is 100 posts per rolling 24 hours.** One a day is
nowhere near it. `scripts/social-post.mjs` counts what it has published in the
last day and stops before hitting the ceiling, so a catch-up run can't drain a
backlog into a rate-limit error. It was 25 until Meta raised it; the number
lives in `DAILY_LIMIT` and is worth re-reading on drift.

**Times in `queue.json` are UTC.** `--at 15:00` means 15:00 UTC. Doing DST-aware
local-time conversion properly needs a dependency this repo doesn't have, and a
poster that fires an hour early twice a year is worse than one that asks you to
convert once. Pick your slot in UTC and write it down.

**GitHub's cron is approximate.** Scheduled runs are best-effort and are
routinely late under load. That's why one run watches for five hours and asks "is
anything due?" rather than firing once at an exact time — the real schedule
lives in `queue.json`, where you can read it.

---

## What each piece is

| Path | |
|---|---|
| `social/prompts.js` | The prompt library, in marketing voice |
| `social/card.mjs` | Card rendering — shared by the review CLI and the queue |
| `social/card.css` | The card's design |
| `social/queue.mjs` | Reading and writing the queue |
| `social/queue.json` | **The schedule, and the record of what has posted** |
| `social/queue/*.jpg` | The card images, committed so Instagram can fetch them |
| `scripts/social-cards.mjs` | Renders the whole library for review (`npm run social`) |
| `scripts/social-queue.mjs` | Adds posts to the queue |
| `scripts/social-caption.mjs` | Writes captions with Claude |
| `scripts/social-post.mjs` | Publishes the next due post |
| `.github/workflows/social-post.yml` | The schedule — a five-hour watcher, started hourly. **Commented out since 2026-08-27; manual runs only** |

### A queue entry

```json
{
  "id": "2026-08-15-photograph-their-hands",
  "slug": "photograph-their-hands-just-their-hands",
  "kind": "PHOTO",
  "prompt": "Photograph their hands. Just their hands.",
  "image": "social/queue/2026-08-15-photograph-their-hands.jpg",
  "scheduledFor": "2026-08-15T15:00:00.000Z",
  "caption": null,
  "altText": null,
  "hashtags": [],
  "postedAt": null,
  "mediaId": null
}
```

Edit `caption`, `altText`, and `hashtags` freely — that file is the source of
truth and the poster publishes exactly what's in it. `postedAt` and `mediaId`
are written by the poster; clearing them would repost the card.

---

## The two places worth editing

**`VOICE` in `scripts/social-caption.mjs`** is the brand brief — it decides how
every caption sounds. It's currently drawn from the landing page and the app's
design system: warm, direct, no emoji, no guilt, they/them for the child. It is
the one part of that file worth rewriting, and the fastest way to see the effect
is `npm run social:captions -- --limit 1 --force`.

**`CONFIG` in `scripts/social-post.mjs`** holds every Instagram-side value, all
of them overridable from the environment. If Meta changes an endpoint, this is
the only place to touch.

---

## When it fails

| What you see | What it means |
|---|---|
| `no caption — run npm run social:captions` | The poster refusing to publish something nobody read. Working as intended. |
| `container … came back ERROR` | Meta couldn't fetch the image. Open the image URL the dry run printed — if it 404s, the card isn't committed and pushed yet. |
| `OAuthException 9004: Only photo or video can be accepted as media type` | Almost never about the media type. Meta could not fetch the url at all — usually because it isn't absolute. An unset Actions variable arrives as an **empty string**, so `SOCIAL_IMAGE_BASE` can silently resolve to nothing and the request goes out with a bare path. `preflight` now refuses a non-`https://` url before it reaches Meta. |
| `OAuthException 190` | Token expired or revoked. Regenerate it and update the secret. |
| `(#10) Application does not have permission` | The token is missing the content-publishing permission. Back to step 1.3. |
| `Nothing due yet` | The next post is scheduled for later. Not an error — the Summary names it and says how long the wait is. |
| `skipped <id> — no caption` | One entry couldn't go out; the run posted the next one instead. Caption it and commit, or it stays skipped. |
| `nothing publishable is due` | Every due post is missing a caption, alt text, or its card. The feed is stopped until one is fixed and committed. Red every hour on purpose. |
| `was already on the account … recording it rather than posting it twice` | A previous run published and then failed to save the record. This run repaired it. Nothing is wrong now, but check why the push failed. |
| `only N posts left in the queue` | Under two days of runway. Refill with `npm run social:queue` — captions need a person, so don't leave it to the day. |
| `fetch failed (ENOTFOUND …)` | Network-layer failure reaching Meta. The parenthesised cause is the real error; `fetch` alone would only have said "fetch failed". |
| A green run and no post on Instagram | Almost always "nothing was due". Open the run's **Summary** — it says which of the two happened in words. If it says it published, run the workflow again in `check-account` mode to see which account it published to. |
| `the model declined this request` | A Claude safety classifier refused. Very unlikely with this copy; nothing is written when it happens. |

Any Instagram error comes through with Meta's own message attached — that text
is far more useful than the status code, so paste it into their docs rather than
guessing.
