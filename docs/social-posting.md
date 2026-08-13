# Posting cards to Instagram

Three commands, run in order. Each one stops and hands back to you.

```bash
npm run social:queue -- --count 7    # pick 7 prompts, render their cards, schedule them
npm run social:captions              # write captions with Claude — then you read them
npm run social:post                  # dry run: shows exactly what would post
npm run social:post -- --live        # publishes
```

The third step can run itself from `.github/workflows/social-post.yml` — **once
you turn the schedule on, which it currently isn't.** The first two never do:
captions are generated on your machine, read by you, and committed. Nothing
reaches the feed that a person hasn't approved.

**Setting this up for the first time?** Use
[`social-setup-checklist.md`](social-setup-checklist.md) — same ground, as boxes
you can tick, with direct links to every console and token tool. This file is
the reference behind it.

> **Status: nothing here has posted yet.** The queue logic, card rendering,
> scheduling, dry runs, and every refusal path are tested and working. The two
> paths that talk to someone else's server — the Claude call and the Instagram
> call — have never been run. Expect to spend an hour on the first live post,
> mostly on Meta's side.

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

### 4. Turn the schedule on — when you're ready

**The schedule is off.** `.github/workflows/social-post.yml` has its `schedule`
block commented out, so the workflow only ever runs when you press the button.
Uncomment those two lines to go live; that is the entire switch.

Before you do, try it without publishing: **Actions → Post to Instagram → Run
workflow**, leaving "Check what would post" ticked. That runs the dry run in CI
and shows you the resolved image URL and caption in the log — the fastest way to
confirm the secrets and the image URL are right.

With the schedule on, it runs hourly and publishes whatever is due. Until the
queue has a post whose `scheduledFor` has passed, every run exits cleanly having
done nothing.

---

## Where the images are served from

Instagram's publishing API **does not accept an image upload.** You hand it a
public HTTPS URL, Meta's servers fetch the image, and you publish the container
that comes back. So the card has to be on the public internet before the post
can be created — which is why `social/queue/*.png` are committed rather than
living in the gitignored render directory.

**The default is `raw.githubusercontent.com`**, which serves this public repo's
files the moment a commit lands:

```
https://raw.githubusercontent.com/travist6983/Rascal-Marketing/main/social/queue/<id>.png
```

No deploy step sits between committing a card and being able to post it. That
matters here specifically: this repo's GitHub Pages deploys have a documented
history of hanging and being cancelled at the ten-minute mark (see the comment
at the top of `.github/workflows/pages-actions.yml`), and a poster that depends
on a deploy landing is a poster that silently stops when Pages has a bad day.

**If you'd rather serve them from Pages**, set the `SOCIAL_IMAGE_BASE` variable
to `https://travist6983.github.io/Rascal-Marketing` and add the queue directory
to the staging step in `pages-actions.yml`, which currently copies only four
files:

```yaml
mkdir -p _site/social/queue
cp social/queue/*.png _site/social/queue/
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

**Instagram's publishing limit is 25 posts per rolling 24 hours.** One a day is
nowhere near it. `scripts/social-post.mjs` counts what it has published in the
last day and stops before hitting the ceiling, so a catch-up run can't drain a
backlog into a rate-limit error.

**Times in `queue.json` are UTC.** `--at 15:00` means 15:00 UTC. Doing DST-aware
local-time conversion properly needs a dependency this repo doesn't have, and a
poster that fires an hour early twice a year is worse than one that asks you to
convert once. Pick your slot in UTC and write it down.

**GitHub's cron is approximate.** Scheduled runs are best-effort and are
routinely late under load. That's why the workflow runs hourly and asks "is
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
| `social/queue/*.png` | The card images, committed so Instagram can fetch them |
| `scripts/social-cards.mjs` | Renders the whole library for review (`npm run social`) |
| `scripts/social-queue.mjs` | Adds posts to the queue |
| `scripts/social-caption.mjs` | Writes captions with Claude |
| `scripts/social-post.mjs` | Publishes the next due post |
| `.github/workflows/social-post.yml` | The hourly schedule |

### A queue entry

```json
{
  "id": "2026-08-15-photograph-their-hands",
  "slug": "photograph-their-hands-just-their-hands",
  "kind": "PHOTO",
  "prompt": "Photograph their hands. Just their hands.",
  "image": "social/queue/2026-08-15-photograph-their-hands.png",
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
| `OAuthException 190` | Token expired or revoked. Regenerate it and update the secret. |
| `(#10) Application does not have permission` | The token is missing the content-publishing permission. Back to step 1.3. |
| `nothing due` | Queue is empty, or the next post is scheduled for later. Not an error. |
| `the model declined this request` | A Claude safety classifier refused. Very unlikely with this copy; nothing is written when it happens. |

Any Instagram error comes through with Meta's own message attached — that text
is far more useful than the status code, so paste it into their docs rather than
guessing.
