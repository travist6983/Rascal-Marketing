---
name: reddit-ad-angles
description: Mines Reddit for verbatim parent language about kids' photos, memory-keeping, and family-journal apps, then turns it into ranked pain points, a swipe file, and testable ad angles for this app's launch. Use whenever the task is ad copy, ad angles, launch messaging, App Store creative, or a Meta/TikTok/Reddit ad script for this product — including "what should our ads say," validating a hook line, researching a specific competitor complaint (Tinybeans, Qeepsake), or feeding language into a /compare page. Always reads the current product name and price from site.config.json rather than assuming a fixed name, since the product has renamed twice in eleven days and may again.
---

# Reddit Ad Angles

Turns real parent venting on Reddit into ad angles this app can actually run — ranked pain
points, ranked desires, ranked objections, a verbatim swipe file, and 8-10 testable hooks with
sources attached. Adapted from a general-purpose version of this skill (see `SOURCE.md`) to be
pre-loaded with this product's offer, audience, and competitors, so nobody has to re-explain the
product every time they want ad research.

## Before researching: pull current facts, don't assume them

Read `PRODUCT`, `PRICE_YEAR`, `PRICE_MONTH`, and `DOMAIN` out of `site.config.json` before writing
anything. The product has been *Dogear*, then *Vellum*, then *Pocket Chronicle* inside eleven days
(the `_readme` block at the top of that file and the brand-mark section of `docs/site-content.md`
tell the story), and nothing in that history suggests it's settled for good. This file intentionally
doesn't hardcode a name in the sections below for that reason — treat any name or price you see here
as illustrative, and the config file as truth.

## The offer

An iOS app that asks one question a day about your kid — something you'd never think to write down
on your own — and files the answer with the photo, video, or voice clip it produced, if it produced
one. The question is free forever, answered in about fifteen seconds, skippable with no penalty.
A paid membership adds weekly and monthly "missions" (a photo, ten seconds of video, their voice,
or just doing something — get on the floor for ten minutes) plus a monthly measurement prompt.
Everything lands on one searchable timeline, so a photo of a shoe becomes findable as *the shoe he
insisted on wearing backwards*.

Current price is `PRICE_YEAR`/yr or `PRICE_MONTH`/mo per `site.config.json` — check it fresh, it has
already changed once during a pricing-model draft.

The four promises that do the most work in ad research, because they're specific and differentiated
rather than generic reassurance: no ads ever ("your kid isn't the product"), no streaks/badges/guilt
mechanics, sign-in with Apple or Google only (no Facebook), and a free, complete, offline HTML export
that never depends on staying subscribed or the company still existing.

## Who you're talking to

Parents of young kids — the subreddits below skew toward the first two or three years — who have a
phone full of photos and a nagging sense they're losing the *why* behind them faster than they're
losing the *what*. Many have already tried and abandoned something adjacent: a baby book they stopped
filling in, a shared family album app, a journal app that turned into one more chore. They're
online in spaces that are candid and a little raw (see: the audience of a 2am feeding-time vent
thread), and they have low tolerance for anything that reads as manufactured guilt or a growth-hack.

## Subreddits

Always mine these four, regardless of what else is requested — they're the reliable baseline for
this audience and this is where the volume is:

- r/daddit
- r/Mommit
- r/beyondthebump
- r/NewParents

If the user names more subreddits, a specific competitor to dig into, or a narrower topic (e.g.
"just pull Tinybeans complaints" or "check r/toddlers too"), treat that as *additive* — add it to
the four above rather than replacing them, unless they explicitly say to skip one.

## Known competitors

Two of these already have `/compare/*` pages on this site with claims that were checked once —
reuse them instead of re-deriving from scratch, but don't restate a claim as settled fact if it
doesn't carry a verification date. `docs/site-content.md` (search for `/compare/tinybeans`,
`/compare/qeepsake`, `/compare/camera-roll`) and `docs/seo-plan.md` have the source material.

- **Tinybeans** — shared family album app, acquired Qeepsake in November 2025. Free tier capped at
  20 uploads/month, ads on the free tier, and a price increase reported around 87% in 2024 (flagged
  in `seo-plan.md` as needing a re-check, not a settled citation — don't launch an ad claiming a
  specific number without confirming it's still current).
- **Qeepsake** — SMS-first prompted journaling, print-first output. Real complaints cluster around
  book cost and cancellation friction. Concede its actual advantage (text-message prompts are about
  as low-friction as memory-keeping gets) rather than only attacking it.
- **Camera Roll / Photos.app** — the real competitor, and the one people default to. Free, already
  there, great search, best backup story. The gap is specific: no prompt (you only capture what you
  thought of), no context (a photo of a shoe stays a photo of a shoe), nothing non-visual (the ten
  minutes on the floor isn't in there), no handoff (a camera roll is yours, full of everything else
  in your life, not something built to give to your kid one day).

## Starting hypotheses — confirm them, don't assume them

These are the bets the product's own copy already makes. Reddit research should do one of two
things with each: find real language that backs it up, or discover the product is reaching for a
problem people don't actually describe this way — both are useful findings, so don't force a quote
to fit a hypothesis that isn't there.

1. The camera roll has the photo; it doesn't have the reason you took it.
2. Streaks and badges turn memory-keeping into one more thing to fail at — parents may describe this
   as guilt, not gamification.
3. "My kid isn't a product" — resonance with people burned by ads next to their kids' photos, or
   wary of anything training on family data.
4. Subscription anxiety specific to this category: what happens to years of entries if you stop
   paying, or if the company folds. Look for people asking this exact question about Tinybeans,
   Qeepsake, or baby-tracking apps generally.
5. A kid's voice changes faster than their face, and almost nobody thinks to record it until it's
   already changed.

## How to research

1. For each subreddit, find the most active *recent* threads touching kids' photos, memory-keeping,
   journaling, "how do you keep track of," or venting about a specific competitor.
2. Getting to the actual thread content is the part that varies by environment — `reddit.com` is
   flatly unreachable to plain `WebFetch`/`WebSearch` in some sandboxes, so work down this list
   rather than concluding Reddit is quiet or giving up after the first approach fails:
   - Try `WebSearch` with `site:reddit.com` queries, then `WebFetch` the thread URLs directly
     (`old.reddit.com` renders more completely than the redesigned site).
   - If that comes back empty or the fetch is refused: search via Brave (`search.brave.com`)
     instead — it has reliably surfaced real `reddit.com` permalinks when the default search
     didn't. Once you have a permalink, if a direct fetch is still blocked, try loading it through
     Google's translate-proxy (`https://old-reddit-com.translate.goog/r/<sub>/comments/<id>/?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=en`)
     — it serves the real page HTML through Google's own fetcher, no login or special permission
     needed, so it works unattended.
   - If you're running interactively (not as a delegated background agent) and both of the above
     still fail, `claude-in-chrome` can drive an actual logged-in browser to Reddit. This one needs
     a human in the loop to grant browser permissions, so it's a poor fit for an unattended run —
     don't reach for it from a background agent, but it's a fine first move if you're in an
     interactive session and expect the fetch-based approaches to fail anyway.
   - Only if every one of those is genuinely exhausted, fall back to a real, verifiable non-Reddit
     source in the same register — App Store or Trustpilot reviews for a named competitor, or a
     comparable candid forum. Say plainly in your output that this is a substitute for Reddit, not
     Reddit, so nobody mistakes it for the thing that was asked for.
3. Read top comments, not just the original post — that's where the real language lives, and where
   agreement/disagreement shows you what's common versus one person's take. Watch for comments from
   people promoting their own competing product; that's real data about the landscape, but it isn't
   an organic customer complaint, so flag and exclude it rather than quoting it as one.
4. Capture phrases verbatim. Paraphrasing defeats the purpose; the exact wording is the deliverable.
5. Track how often a pain, desire, or objection repeats. Frequency is the ranking signal, not how
   articulate or ad-ready a given comment sounds.

## What to output, in this order

### 1. Ranked pain points
Top 6-8 problems, most common first. One line each in plain language, plus a rough sense of
frequency.

### 2. Ranked desires
Top 5-6 outcomes people say they want. Same format.

### 3. Ranked objections
Top 5-6 reasons people hesitate, doubt a solution, or say one failed them.

### 4. Swipe file (15-20 verbatim phrases)
Exact quotes, copied word for word — typos, "baby," casual phrasing, all of it. This is raw
material for later, not something to clean up now.

### 5. Testable ad angles (8-10)
For each: a hook line, what pain point or desire it's rooted in, and the actual quote or thread it
came from so it can be checked.

**This is the one section where the site's own voice rule applies, and it cuts against a lot of
default ad-writing instinct.** The product's promise to itself is that it never scolds and never
implies the reader is failing — no "don't let these moments slip away," no "before it's too late,"
no exclamation marks (`docs/site-content.md` §Voice spells this out in full). A hook can start from
a real vent — *"I have four thousand photos and no idea why I took half of them"* — without tipping
into the guilt or urgency the product exists to remove. If the punchiest real quote in the swipe
file is a guilt-trip, that's a line for "Source," not for "Hook line."

Two mechanical swaps that follow from the same rule: write "child" or "childhood" in the hook line
even when the sourced quote says "baby" (the swipe file keeps "baby" verbatim; synthesized copy
doesn't — see `docs/site-content.md`'s "Do not write" list), and pull the current name and price
from `site.config.json` rather than whatever this file says. Any competitor claim used in a hook
(a price increase, ad placement, a free-tier cap) needs a source worth pointing to — reuse the ones
already checked in the `/compare/*` sections and `seo-plan.md`, and flag anything new as unverified
rather than stating it as settled.

## Rules

- Use real comments only. Never invent a quote, a statistic, or a customer — the site holds itself
  to exactly this standard for testimonials (it ships with zero, on purpose, until real users
  exist), and ad research should be held to it too.
- If a subreddit is too quiet on a given topic, say so and suggest a better one (r/toddlers,
  r/Parenting, and r/attachment_parenting are reasonable fallbacks for this audience).
- Prefer the plainest, most specific customer wording over anything clever.
- Cite the thread or quote for every angle so it can be verified independently.
