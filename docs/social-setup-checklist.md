# Instagram posting — setup checklist

Work down the list. Each box is one thing you can finish and know you've
finished. Reference for any of it: [`social-posting.md`](social-posting.md).

> ⚠️ **Don't paste the access token into this file.** It lives in GitHub
> Secrets and in your shell, nowhere in the repo.

## Every link you'll need

| | |
|---|---|
| **Meta app dashboard** | https://developers.facebook.com/apps |
| **Graph API Explorer** (generate a token) | https://developers.facebook.com/tools/explorer/ |
| **Access Token Debugger** (check scopes + expiry) | https://developers.facebook.com/tools/debug/accesstoken/ |
| Instagram Platform docs | https://developers.facebook.com/docs/instagram-platform |
| → Content Publishing (the endpoints this uses) | https://developers.facebook.com/docs/instagram-platform/content-publishing |
| → Instagram API with Instagram Login | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login |
| → Business Login (getting the token) | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login |
| **GitHub → Actions secrets** | https://github.com/travist6983/Rascal-Marketing/settings/secrets/actions |
| **GitHub → Actions variables** | https://github.com/travist6983/Rascal-Marketing/settings/variables/actions |
| **GitHub → Actions tab** | https://github.com/travist6983/Rascal-Marketing/actions |
| **Anthropic → API keys** | https://console.anthropic.com/settings/keys |
| Anthropic → usage & cost | https://console.anthropic.com/settings/usage |
| GitHub cron behaviour | https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows |

The GitHub settings links only work while signed in as the repo owner. Meta
reorganises its docs regularly — if a deep link 404s, start from the
[Instagram Platform landing page](https://developers.facebook.com/docs/instagram-platform).

---

## 0. Already done — nothing to do here

- [x] Cards render from the prompt library
- [x] Queue, scheduling, and the three commands
- [x] Caption generation wired to Claude
- [x] Poster written, dry-run by default, refuses uncaptioned posts
- [x] Workflow written, **schedule commented out** so nothing fires
- [x] Runbook at `docs/social-posting.md`

---

## 1. Instagram account

- [ ] Instagram account is a **Professional** account (Business or Creator)
      — in the Instagram phone app: Settings → Account type and tools →
      Switch to professional account. A personal account cannot be posted to by
      any API, and there is no web equivalent of this screen.
- [ ] Decide which login flow:
      [**Instagram Login**](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
      (simpler, no Facebook Page) or Facebook Login (needs a linked Page)
- [ ] If Facebook Login: the Instagram account is linked to a Facebook Page

## 2. Meta app and token

- [ ] App created at https://developers.facebook.com/apps
- [ ] Instagram product added to the app
- [ ] Permissions granted for reading the account **and** publishing content
      — see [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
      for which ones the publish endpoints require
- [ ] Noted the **numeric Instagram user ID** (not the @handle)
- [ ] Generated a token — [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
      is the quickest way, or follow
      [Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- [ ] **Exchanged it for a long-lived token** (short-lived ones last an hour)
- [ ] Pasted the token into the
      [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
      and confirmed: the scopes are there, and the expiry is ~60 days out
- [ ] Wrote that expiry date somewhere with an alarm on it

## 3. Check the API details haven't moved

Meta changes these more often than anything else here. All four live in one
`CONFIG` block at the top of `scripts/social-post.mjs` and are overridable from
the environment, so fixing one is a config change, not a code change. Source of
truth: [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing).

- [ ] Endpoint host is right for your login flow
      (`graph.instagram.com` vs `graph.facebook.com`)
- [ ] API version string is current
- [ ] `alt_text` is still accepted on media-container creation
- [ ] Publishing limit is still 25 posts / 24h

## 4. Credentials

[**GitHub → Settings → Secrets and variables → Actions**](https://github.com/travist6983/Rascal-Marketing/settings/secrets/actions)

- [ ] Secret `IG_USER_ID` set
- [ ] Secret `IG_ACCESS_TOKEN` set
- [ ] [Variable](https://github.com/travist6983/Rascal-Marketing/settings/variables/actions)
      `SOCIAL_IMAGE_BASE` — **only if** you're not using the
      `raw.githubusercontent.com` default

**Locally**

- [ ] `export IG_USER_ID=...`
- [ ] `export IG_ACCESS_TOKEN=...`
- [ ] `export ANTHROPIC_API_KEY=...` — get one at
      https://console.anthropic.com/settings/keys (or use `ant auth login`).
      Captions only; the workflow never calls Claude.

## 5. Make the voice yours

- [ ] Read `VOICE` in `scripts/social-caption.mjs`
- [ ] Rewrite it to sound like the account you want
- [ ] `npm install` (once — the caption script needs the Anthropic SDK)

## 6. First run, locally

```bash
npm run social:queue -- --count 3     # or use the 3 already queued
npm run social:captions -- --limit 1  # first real Claude call
```

- [ ] Captions generated without error
- [ ] Read the caption. It sounds like you, not like an app
- [ ] Read the alt text. It describes the card
- [ ] Hashtags are ones you'd actually use
- [ ] Edited anything that wasn't right, directly in `social/queue.json`
- [ ] Token cost printed at the end looks sane
      (cross-check at https://console.anthropic.com/settings/usage)

```bash
npm run social:post -- --force        # dry run
```

- [ ] Dry run prints the caption and image URL you expect
- [ ] **Opened the printed image URL in a browser and saw the card**
      — this is the single most likely thing to break the first live post

## 7. Commit

- [ ] `social/queue.json` and `social/queue/*.png` committed and pushed
      (the image must be on the internet before Instagram can fetch it)
- [ ] Image URL still loads after the push

## 8. First live post

- [ ] `npm run social:post -- --force --live`
- [ ] Post appeared on the account
- [ ] Caption and hashtags rendered correctly
- [ ] Alt text is set (Instagram app → the post → ⋯ → Edit → Alt text)
- [ ] `postedAt` and `mediaId` were written back to `social/queue.json`
- [ ] Committed that change

## 9. First run in CI

- [ ] Workflow committed and pushed
- [ ] [Actions](https://github.com/travist6983/Rascal-Marketing/actions) →
      Post to Instagram → Run workflow, "Check what would post" left **ticked**
- [ ] Log shows the right image URL and caption
- [ ] Secrets resolved (no "IG_USER_ID is not set")

## 10. Go live

- [ ] Queued enough posts to be worth automating
      (`npm run social:queue -- --count 14`)
- [ ] Every queued post has a caption you've read
      (`npm run social:queue -- --list` shows none needing one)
- [ ] Uncommented the two `schedule` lines in
      [`.github/workflows/social-post.yml`](../.github/workflows/social-post.yml)
- [ ] Committed and pushed
- [ ] Watched the first scheduled run land in
      [Actions](https://github.com/travist6983/Rascal-Marketing/actions)

---

## Recurring — put these somewhere with an alarm

- [ ] **Refresh the Instagram token before it expires** (~60 days; set a
      reminder for ~50). Nothing warns you — the first sign is a failed run.
      Check the current expiry any time in the
      [Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
- [ ] Top the queue up before it runs dry
- [ ] Re-read a few captions occasionally

---

## Things to know before they surprise you

**Times in `queue.json` are UTC.** `--at 15:00` is 15:00 UTC. Pick your slot in
UTC and write it down.

**GitHub's cron is approximate.** The workflow runs hourly and asks "anything
due?" rather than firing at an exact minute, because
[scheduled runs are best-effort](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
and routinely late under load.

**Captions never run in CI.** They're generated on your machine and committed.
The poster refuses an entry without one, so nothing posts unread.

**Nothing has posted yet.** Everything up to the network calls is tested; the
live Claude call and the live Instagram call have never run. Budget an hour for
section 8.
