# Marketing site — information architecture and copy

**CANONICAL. Supersedes `dogear-site-content.md` and the earlier `site-content.md`. Delete both.**
Merged Aug 15 2026. Where the two sources conflicted, the resolution is recorded inline as
**[MERGE]** so it can be re-argued rather than silently inherited.

---

**Product name is written as `{{PRODUCT}}` throughout.** Set it once. This has now earned itself:
the name was *Dogear*, and on Aug 17 2026 the owner changed it to **Vellum**, and the whole rename
was one edit to `PRODUCT` in `site.config.json` plus the handful of places a token cannot reach.
Every string below survived it untouched.

**It stays a token, because the new name is not verified either.** Dogear was abandoned over App
Store and domain collisions with the reading-app cluster (Dogear: Social Reading Tracker, Dogear'd,
`thedogearapp.com`, `getdogear.com`, the Play Store widget, the Chrome extension, mozilla/dogear).
One collision is known — **Vellum by 180g**, a live book-formatting app for authors — and the
clearance status is disputed: the owner says the name was checked and is fine, while a separate
open item filed the same night says no search has been run (see `seo-plan.md`). Until a dated
search is on file, assume the name can still move, and never hardcode it.

**Price strings are `{{PRICE_YEAR}}` = $59.99 and `{{PRICE_MONTH}}` = $5.99.** Same reason, plus a
better one: `decisions.md` says unit economics are measured before a price is set, and `blocked.md`
§10 says the App Store Connect products don't exist yet. Keep the number in one content file so a
change is one edit, not a crawl through markup.

**Site job on day one: built for launch, running as a waitlist.** Every secondary path — pricing,
comparisons, FAQ — is fully written so the site flips to "Download on the App Store" with a CTA
swap, not a rebuild.

---

## Brand mark

**`src/assets/icon.svg` is a placeholder, not a resolved mark.** It draws a page with the corner
folded down. That was a pun: the product used to be called *Dogear*. Since Aug 17 2026 it is
called **Vellum**, so the mark now illustrates a name the product no longer has.

The artwork is deliberately unchanged — a folded page still reads as *something kept, and
findable*, which is on-message — but nobody should mistake it for a decision. Three things are
open, and all of them are the owner's call:

1. **The site mark and the app icon are already different marks.** This is a folded page; the iOS
   app icon is a fan. One product, two symbols.
2. **A real Vellum set now exists** in `Project-Rascal/docs/app-icon/` (uncommitted there as of
   Aug 18 2026): `vellum-wordmark.svg`, `vellum-mark.svg`, `vellum-mark-compact.svg` (3 cards, for
   ≤24px — favicons, avatars), horizontal and stacked lockups, `vellum-logo-mono.svg`, three
   app-icon candidates, and `generate-vellum.mjs`, which produces all of them deterministically.

   **`vellum-logo-mono.svg` is the one for this site.** It paints in `currentColor` and separates
   its cards with a knockout mask rather than a stroke in the ground colour, so one file works on
   cream, ink and terracotta — reportedly tested at 56px and 24px on all three. The wordmark is
   drawn geometry (monolinear, round terminals), not outlined type, so no font file and no licence
   question. Adopting it here is still a separate pass, and the files are not in this repo.

   **If the animated header lockup is adopted** (`vellum-logo-hover.html` in that directory is
   generated from the artwork and carries the markup and CSS as copy-paste blocks): its SVG is
   `overflow: visible` on purpose, so the fan opens past its own box and the header does not
   re-flow on hover. **This was measured against this header, and it fits everywhere with room to
   spare.** Nothing below is a caveat; it is all clearance, recorded so nobody re-opens the
   question.

   Open-state overhang past the layout box, in viewBox units: left 29.2, bottom 10.1, top 3.6,
   right 0. At a 34px lockup that is 6.1px left, 2.1px down, 0.8px up, 0 right.

   - **Leftward vs `html { overflow-x: clip }`** — the fan reaches 6.1px left of its box. The
     narrowest `--gutter` on this site is **16px** (below 600px; the only sub-600 query,
     `max-width: 380px`, touches `.hiw-tree` and nothing else). 16 > 6.1, so it never reaches the
     viewport edge — **~10px of margin at 320px**, which the check suite already renders.
   - **Downward vs the masthead's `border-bottom`** — the fan descends 2.1px. `.masthead__in` has
     `padding: 12px`, and the nav toggle's `min-height: 44px` makes the row taller than the lockup
     anyway, so the logo is centred with **at least 12px below it**. The rule is never touched. If
     it ever were, the fix is padding on the anchor, not disabling the motion.
   - **Rightward vs the nav** — zero. The word extends further right than the fan does even when
     open, so the fan can never be the rightmost thing.

   If the leftward reach ever does need shrinking, the number is the `1.45` multiplier in the hover
   rule; it scales linearly, so `1.25` takes 6.1px to about 3.4px at the same height.

   ~~The animated lockup strokes its card gaps rather than knocking them out, because a knockout
   mask is built from where the cards are — so motion and ground-independence are a trade.~~
   **That was recorded here as a law and it was not one.** A *static* mask leaves its notch behind
   when a card rotates; a mask whose shapes carry `.brand__card` alongside the cards moves with
   them. Animating the mask dissolves the trade entirely, which is what shipped — so the header
   component and the static files differ in no way that matters, and nothing here needs
   reconciling.

   Worth keeping the mistake visible: the header could not have used a stroke anyway. `.masthead`
   is `color-mix(canvas 88%, transparent)` over a `backdrop-filter`, so page content scrolls
   underneath and tints it continuously — no solid stroke colour is right at every scroll
   position. Cream would have looked correct at the top of the page and shown as a halo over a
   photograph twenty pixels later. That is a bug that only appears once you scroll, which is the
   kind that ships.

   **The chosen app icon bakes the wordmark into its front card** — an asset that encodes the name,
   which by the rule at the end of this section ages badly. It was chosen knowingly, with two
   wordless candidates on the table, and both are kept for the day that matters. Relevant to the OG
   cards: if one can carry the mark instead of the word, prefer that.
3. **Casing: the site ships title case; lowercase has reportedly been chosen.** The drawn wordmark
   is lowercase *vellum*, and the owner is reported to have picked lowercase explicitly, against
   the title-case specimen. That reached this repo secondhand, so **nothing has been changed on
   it** — *Vellum* is what ships, in five places: `src/partials/header.html`, `social/card.mjs`,
   and the three Remotion components `Post.tsx` / `Sheet.tsx` / `Showcase.tsx`.

   Two rules until it is confirmed firsthand: all five move together or none do, and **do not add
   a sixth title-case rendering** — a new surface should wait rather than deepen the change.

   Worth knowing before scheduling it: this is not five text edits. Four of the five are pixels —
   changing the Remotion components means re-rendering the 15-file Instagram set and both prompt
   reels, and `social/card.mjs` means re-rendering the queue cards.

Until then, and this is the part worth keeping: **in the site's own markup the name is live text**,
set in Nunito 800 — `src/partials/header.html` and `src/partials/footer.html` resolve it from
`{{PRODUCT}}`, so 21 pages and 18 Markdown twins renamed themselves on a rebuild.

**It is not live text everywhere, and that half is a re-render, not an edit.** The wordmark is
drawn into pixels by `social/card.mjs` (the queue cards) and by the three Remotion components
`video/src/Post.tsx`, `Sheet.tsx` and `Showcase.tsx` (the Instagram set and both prompt reels) —
23 committed binaries in all. The 17 OG cards are the counter-example and the lesson: they carry
the promise, not the name, so they cost nothing to rename. **Keep the name out of generated
imagery wherever the design allows it.**

One surface is beyond this repo entirely: `assets/screens/*.png` are captures off a real device,
so the in-app name is baked in and only an iOS rebuild can change it.

## Voice

Plain, warm, specific, unhurried. Short declarative sentences. Concrete nouns — *a shoe, a Tuesday,
a question you forgot you asked*. No exclamation marks. No "revolutionize," "effortlessly,"
"magical," "unlock." No urgency mechanics, no countdown timers, no "limited spots" unless it is
literally true.

The product's own rule applies to its marketing: **it never scolds and it never implies the reader
is failing.** No "don't let these moments slip away." No "before it's too late." That copy sells by
manufacturing the guilt the product exists to remove, and it is the fastest way to sound like every
competitor.

One test for every sentence: *would this be embarrassing to read in 2040, in the archive it's
selling?*

---

## Sitemap

```
/                        Home — the long, animated page
/how-it-works            The daily loop, in detail
/prompts                 The public prompt library
/pricing                 Free tier + the paid plan, plainly
/promise                 What happens to the archive. The trust page.
/compare/tinybeans       Comparison
/compare/qeepsake        Comparison
/compare/camera-roll     Comparison — the real competitor
/faq                     Consolidated
/blog                    Index
/blog/[5 launch posts]   See §Blog
/waitlist                Form (also inline on /)
/thanks                  Post-signup
/privacy  /terms         Legal
```

**[MERGE]** URL naming follows the earlier doc — `/promise` over `/what-we-dont-do`, `/compare/*`
over `/vs/*`, `/blog` over `/journal`. `/prompts` is imported from the other source and is new; see
§`/prompts` for why it earns a route rather than living as a blog post.

---

# `/` — Home

**[MERGE] Eight movements, not fourteen sections.** The design critique pass killed the fourteen-
section version: fourteen flat beats produce no hierarchy, and the SEO argument for home-page depth
was hollow because `/` targets three keywords and the long-tail cluster lives on `/prompts`. **No
copy is deleted** — it is grouped into movements, and displaced blocks moved to supporting pages.
The Claude Design prompt is built against these eight. Keep them in sync or the prototype and the
production build will be two different pages.

### Meta
- **Title tag:** `{{PRODUCT}} — a daily prompt journal for your kid's childhood` (58)
- **Meta description:** `A question about your kid every day, free forever, and a mission with membership. Every moment is saved with the prompt that caused it. No streaks, no ads.` (155)
- **OG image:** the hero app frame, cream ground, no child's face

---

## Movement 1 — Hero

> **Your camera roll remembers what they looked like.**
> **{{PRODUCT}} remembers what they were like.**

A question about your kid every day, free forever, and a mission to go with it. Answer in fifteen
seconds, or skip it — nothing keeps score. Every moment is filed with the prompt that caused it, so
in 2040 you can search *"what he was afraid of"* and actually find something.

`[ Get tomorrow's prompt ]`  ·  One a day, by email, until {{PRODUCT}} opens. Free.

**[MERGE] Two decisions here.**
*H1:* the parallelism version above wins over the other source's *"Your camera roll has the photos.
{{PRODUCT}} has the reasons."* Same idea, better sentence — *looked like / were like* is the half
that does the work.
*CTA:* `Get tomorrow's prompt` describes the outcome; `Join the waitlist` describes the mechanism.
The outcome version is only honest if the daily email in §Waitlist email actually ships. **If it
doesn't, revert every CTA on the site to `Join the waitlist` and change the support line to
`We'll email when it opens and when pricing goes live. Nothing else.`** One-line swap; keep both
strings in one place.

*[Motion: the phone frame arrives with a today-card already asking a question; the question text
swaps through three real prompts on a slow cycle. Not a typewriter effect.]*

**Alternate H1s, if the above tests badly:**
- "A childhood is mostly small Tuesdays. Keep some of them."
- "One question a day. Eighteen years of answers."
- "The photo is easy. The story behind it is what disappears."

---

## Movement 2 — The problem

## You have four thousand photos and almost no context

You know the ones. A blurry shot of a shoe. Him holding something up to the camera. A drawing you
photographed because you couldn't keep it.

In ten years you'll have all of those and no idea why you took them.

The photo survives. The reason doesn't.

*[Motion: a dense grid of neutral thumbnails — a shoe, a puddle, a crayon drawing, a hand — fills in
fast, then all but one fades to near-nothing. The one that stays gets a prompt line attached
beneath it.]*

---

## Movement 3 ★ — The prompt engine

**The centerpiece.** Absorbs the old sections 3, 4, 5 and 6 into one interactive object. This is
the section the page is judged on and the only place amplitude is spent.

### Three things, once a day

> **Tier note, Aug 21 2026.** The question is free forever; the mission is part of membership, and
> so are the weekly and monthly ones named below. This section describes **the day the product is
> for**, which is the right thing for the centrepiece to do — the home page does not sell the free
> tier here, it sells the loop, and the tier split is stated in full in the pricing block further
> down. **What it must never do is call any of this free.** If a sentence in this section acquires
> the word *free*, it is wrong.

**One question.** Something you'd never think to write down. *What is he pretending to be this
week?* Answer it in a sentence. **Free, every day, forever.**

**One mission.** Take a photo, shoot ten seconds of video, record their voice, or just go do
something — get on the floor for ten minutes. Some missions produce a file. Some don't. Both count.
**Part of membership** — one on a weekday, two at the weekend.

**It files itself.** The answer, the prompt that asked for it, the date it actually happened, and
anything you captured all land on one timeline. Nothing to tag. Nothing to organize.

Bigger missions land weekly. A measurement mission lands monthly — height, hand, foot, the things
you'll want a number for later. **Both are membership, like the daily mission above.**

### The prompt is saved with the moment

This is the whole idea, and no other app does it.

Every photo album stores the photo. {{PRODUCT}} stores the photo **and the question that made you
take it.** A picture of a half-eaten sandwich is nothing. A picture of a half-eaten sandwich filed
under *"what will he eat only if it's cut a specific way"* is a story.

That's also why search works. You are not searching filenames and dates. You are searching the
questions you were asked and the answers you gave.

### Not everything worth keeping is a photograph

Most memory apps assume you have media. Half of what matters doesn't produce a file.

| | |
|---|---|
| **Did it** | You got on the floor for ten minutes. Nothing to upload. Still a complete entry. |
| **Captured it** | A photo, a video, their voice. Fifteen seconds, one-handed. |
| **Wrote it** | Something they said. Something you noticed. Two sentences is plenty. |

An app that only counts the days you produced a file is measuring the wrong thing.

### Record how they actually sound

Their voice changes faster than their face and nobody thinks to record it. Some missions ask for ten
seconds of audio — a song they're mangling, how they say a word wrong, what they think a job is.

It's transcribed on your phone, so you can search a recording you'll never have time to relisten to.

*[Motion — this is the one interactive centerpiece. A life-size prompt card the visitor drives:
real prompt bodies cycling from the library; a control that switches the same card between the
three completion shapes (sage check → terracotta thumbnail → plain surface with text); a periwinkle
waveform that draws and resolves into a transcript. Keyboard operable, `aria-live`, pauses on
interaction, fully functional under reduced motion as instant swaps. Full spec in the Claude Design
prompt.]*

`[ Get tomorrow's prompt ]`

---

## Movement 4 — No streaks

## No streaks. No badges. No red.

Skip a day and nothing happens. Skip a week and nothing happens. Missed prompts stack quietly and
expire after two weeks, and the app never mentions it again.

There is no counter to break, no confetti when you comply, and nothing in the interface turns red
because you were busy.

An app that punishes a parent for a hard week is a bad parenting app. That's a design decision, not
a missing feature.

*[Motion: the calmest section on the page — almost still. A deliberate drop in energy immediately
after the loudest thing. Let the copy carry it.]*

---

## Movement 5 — The archive

## Built to be searched, not scrolled

A timeline you can scan by date. Search across everything you wrote, everything they said, and
every prompt you were asked. Age is on every entry, so you're not doing arithmetic to work out
whether he was three or four.

The point of an archive isn't that it's stored. It's that somebody can find something in it.

**Backdating is normal here, not a workaround.** The day something happened and the day you got
around to writing it down are two different facts, and both are kept.

*[Motion: timeline screenshots settling in; a search field types "afraid of" and three entries
surface.]*

---

## Movement 6 — The promises

## Your kid isn't the product

No ads. Not now, not at a bigger scale, not ever. Nothing about your child is sold, brokered, or
used to train anything.

Sign in with Apple, or Google. No Facebook login — routing a private record of a child through an ad
company contradicts the thing being sold.

The archive is private by default. Nobody sees it unless you invite them.

### We have never deleted a word a parent wrote

Most apps handle this badly, so here it is in full, before you sign up.

If you stop paying, {{PRODUCT}} drops to the free tier. **Nothing you wrote or captured is ever
locked behind payment.** Your whole archive stays readable, searchable and exportable. You keep
answering the daily question — text and did-it entries never stop. The missions go back to being
part of membership, and new photo and video uploads pause.

After ninety days, original photos move to cheaper cold storage. Thumbnails stay instant, search
still works, and pulling a full-resolution original back takes about an hour. That's a property of
the storage, not a penalty.

**We never delete a word you wrote unless you ask us to.** Lapsing doesn't cost you a sentence and neither does going quiet for a year; the one thing that removes your words is you asking us to close your account, which waits seven days, signs you out, and is cancelled the moment you sign back in. And if media is ever going to be removed, you get warned three
times — ninety days out, thirty days out, seven days out — each with a free one-click export of the
whole archive. Sign in once during that window and it's cancelled outright.

If we can't reach you, we keep it.

### An export you can't read isn't a backup

One tap gives you a zip: every entry, every photo, every recording, in folders by date — plus an
`index.html` you double-click. It opens in any browser, offline, with no account and no internet. No
app required, including this one.

Free, complete, always. Even on the free tier. Even if you stopped paying years ago.

It's built that way because an archive meant to last eighteen years shouldn't depend on this company
lasting eighteen years.

*[Motion: none on the lapse block. It is a plain block on cream. Animating it would undercut it.]*

**[Optional line, use only if comfortable naming a competitor practice generically:** "Some apps in
this category show advertising next to your child's photos. This one never will."**]**

---

## Movement 7 — Handoff, then pricing

Emotional beat first, then the ask. **Never reversed.**

### It isn't yours forever. That's the point.

Everything in here is being kept for one person, and it isn't you. When your family decides they're
ready, they get all of it — the entries, the photos, the recordings, the questions. Some things you
can seal until a birthday you choose. A letter meant for eighteen stays shut until eighteen.

### The daily question is always free. Here's what the rest of the day costs.

Free is not a trial. A question about your kid every day, forever. Unlimited written and did-it
entries. Voice recordings up to two minutes. **100 photos, lifetime.** Search and a full export,
always.

Membership is **{{PRICE_YEAR}} a year** — two months free versus monthly — or **{{PRICE_MONTH}} a
month.** It adds the missions, video, photos without a limit and the second parent. One membership
covers the whole household: every kid, both parents. Everything open for two weeks first — no card,
nothing to cancel.

**Nothing you write or capture is ever locked behind payment.** Membership buys more of the day —
never access to your own archive.

`[ See what's in each tier → ]`

*Ships with the App Store launch. Waitlist members will hear the price before it goes live, not
after.*

---

## Movement 8 — FAQ and final CTA

Six on home, full set at `/faq`.

**My kid is seven. Is it too late?**
No. Backdating is a normal part of the app, not a workaround — you file a memory under the day it
happened, whenever you get to it. Plenty of the archive will be older than the app.

**How long does this actually take?**
Under fifteen seconds for most days, one-handed. If it takes longer than that, that's a bug.

**What if I miss days?**
Nothing happens. That's the point.

**Can my partner use it too?**
Yes, on the same archive. The second parent is part of membership, and one membership covers everyone in the household — every kid, both of you.

**Do I have to use it for eighteen years for it to be worth anything?**
No. A hundred entries is already a thing your kid doesn't have. There's no threshold.

**What happens to it when they grow up?**
That's a decision the family makes, not one the app makes for you. Sealed entries can be written to
open at an age you choose. The export means the archive is handed over as a real object, whatever
you decide.

### One question. Tonight.

{{PRODUCT}} is in private testing and opening soon on iPhone.

`[ Get tomorrow's prompt ]`

One a day, by email. A note when it opens and when the price goes live. Nothing else. Unsubscribe
in one click.

---

# `/how-it-works`

- **Title:** `How {{PRODUCT}} works — one prompt a day, saved with context` (57)
- **Meta:** `A daily question and a small mission, answered in fifteen seconds. See how a prompted childhood journal turns loose photos into a searchable archive.` (155)
- **H1:** How it works

1. **The morning card** — what actually appears, what the four kinds look like
2. **The four capture verbs** — photo, video, voice, activity; the fifteen-second claim explained
3. **Missions** — daily, the weekly bigger one, the monthly measurement. **All membership**, and the scene must say so; the daily question is what a free account gets on every one of those days
4. **Backdating** — filing something under the day it happened
5. **The timeline** — date-grouped, age on every row, thumbnails
6. **Search** — what's searchable and why the prompt matters
7. **Letters** — write something sealed until an age you pick
8. **Second parent** — one archive, two people, **on one membership**; the second parent is not part of the free tier
9. **Export** — the home block, in full
10. CTA

Best `HowTo` schema candidate on the site.

---

# `/prompts` — the public prompt library

**[MERGE] Imported from the other source and promoted from blog post to route.** It earns a page:
it targets a long-tail cluster nobody defends, it is the only genuinely linkable asset here, it
demonstrates the product better than screenshots, and it is the content engine for the waitlist
email. No competitor publishes theirs — Qeepsake meters them by tier. (Narrowed Aug 21 2026: the
missions are metered by tier here too now. What still separates the page is that the daily
**question** is never metered, and that all 133 are published to read either way.)

- **Title:** `Every prompt {{PRODUCT}} asks — 133 of them, free to read` (55)
- **Meta:** `All 133 questions and missions, free to read. Filter by age and type — voice, photo, activity, or just something worth writing down.` (135)
- **H1:** Every prompt {{PRODUCT}} asks — *prompt*, not *question*: 30 of the 133 are questions and the page says so directly below, so the heading cannot call all 133 questions

**Intro:**

> All 133 of them, free to read and free to use, whether you ever open the app or not. Take them
> and use them in a notebook if you'd rather — that's fine. The app just remembers so you don't
> have to.

Then, immediately under it and before the library, the honesty line the free tier makes necessary:

> **30 of these are the daily question, and those are free in the app, every day, forever.** The
> rest are missions — a photo, a video, their voice, something to do together — and those are part
> of membership. Filter to *Question* below to read exactly what a free account gets.

The 30 is `{{QUESTION_COUNT}}` and the 133 is `{{PROMPT_COUNT}}`; both are hand-written in
`site.config.json` and both are checked against the generated library by `scripts/prompts.mjs`,
which exits non-zero if either drifts. **Neither number goes in markup as a literal.**

**Filters:** by kind (question · photo · voice · video · activity · letter · measurement), by age
band, and a search field over the bodies — the three AND together. No counts on the pills; one live
count of what is actually showing. **Each prompt gets its own anchor** (`/prompts#p-0042`).

**Order:** woven across kinds, not grouped by them. The seed is grouped, and rendering it that way
opened the page on thirty questions in a row — the library looked like a question library until you
scrolled past ten rows. Within a kind the seed's order is kept, so a filtered view still reads in
the authored order.

**Hard constraint — build requirement, not a nicety.** Library bodies store pronoun tokens:
`{they}`, `{them}`, `{their}`, `{theirs}`, `{themself}`, the agreement compounds `{they_are}`
`{they_were}` `{they_have}` `{they_do}`, the capitals `{They}` `{Them}` `{Their}`, and `{name}` —
thirteen in all, rendered at display time. **The renderer already exists in
`export_viewer/assets/app.js`. Reuse that table; do not write a second one.** Default to the
they/them column with a neutral stand-in for `{name}`. A literal `{their}` on the page whose job is
proving the prompts are well written is a public failure. Make it a launch break-test.

**Sub-pages, only once the index ranks:** `/prompts/questions-to-ask-your-toddler`,
`/prompts/voice-recording-prompts`, `/prompts/monthly-measurement-ideas`. Do not split early — it
divides what little authority a new domain has across pages that then all fail.

---

# `/pricing`

> **Rewritten Aug 21 2026 (phase 109). The free tier changed and this whole section was written on
> the old one.** Free is now **the daily question only**; the missions are part of membership. The
> struck version is kept below the new one because two of its arguments survive the change and one
> does not, and a reader needs to see which. The app-side wording this section must not contradict is
> `docs/design/free-tier-copy.md` in Project-Rascal — **membership**, never *premium*, *pro*,
> *upgrade* or *unlock*; a person **joins**, they do not upgrade.

- **Title:** `{{PRODUCT}} pricing — the daily question is always free` (49)
- **Meta:** `The daily question is free every day, forever, with unlimited writing, voice notes and a full export. Membership adds the missions, from {{PRICE_MONTH}} a month.` (150)
- **H1:** The daily question is always free.

Opening line, load-bearing:

> Every day, forever, with no card and no end date. You can write as much as you like, record their
> voice as often as you like, keep 100 photographs and take the whole archive out whenever you want
> it. Membership is what fills in the rest of the day.

**The page leads with what a parent gets for nothing and follows with what membership adds** — two
lists, free first, before the table. A comparison table whose free column is a row of dashes reads
as a punishment list, so the rows with a real free entry are ordered above the rows without one.

| | Free | Membership |
|---|---|---|
| The daily question | Every day, forever | Every day, forever |
| Written entries and *did it* | Unlimited | Unlimited |
| Voice notes | Unlimited, two minutes each | Unlimited, two minutes each |
| Photos | 100, lifetime | No limit |
| Search and full export | Always | Always |
| Everything already in the archive | Yours, always | Yours, always |
| Ads | None | None |
| Daily missions | — | One on weekdays, two at the weekend |
| Weekly mission, monthly measurement, sealed letters | — | Included |
| Video | — | Included |
| The second parent | — | Included |
| Price | $0 | **{{PRICE_YEAR}}/yr** or {{PRICE_MONTH}}/mo |

**No red, and no "✗" column.** The palette has no red and the design system forbids adding one. An
absent feature is an em dash, not a rejection.

**The line the whole page carries, near the table and never in the footer**, at least as prominent
as the price:

> **Nothing you write or capture is ever locked behind payment.** Membership buys more of the day —
> never access to your own archive.

**Two weeks, everything open. No card, nothing to cancel.** Said plainly, because most of this
category cannot say it. No countdown afterwards, no day-N reminder, no scarcity of any kind.

**Why the question is the free part.** It is the thing that makes you stop and think about your kid
for fifteen seconds, and a version of this that charged per question would be a worse product on the
day it made the most money. Some apps in this category meter questions per day by tier; this one
does not and will not. The missions are where the money is because that is where the cost is — a
mission asks for a photograph, a video, thirty seconds of their voice, and files kept for eighteen
years are the one part of this that gets more expensive every year you use it.

**Why 100 photos is a lifetime number.** Not per month: a monthly reset lets a free archive grow
forever against no revenue, and the honest version is a number that doesn't move. A cap can always
be raised and can never be lowered. It is also not a countdown — nothing warns you, nothing turns
red, and nothing already in the archive is touched when you reach it.

**One membership, the whole family.** Every child, both parents. Not per child.

Then the full `/promise` lapse content — with *"Nothing is locked"* narrowed to *"Your archive is
never locked"* — then FAQ.

<details>
<summary>~~The pre-Aug-21 version of this section, kept for the two arguments that survived~~</summary>

~~- **Title:** `{{PRODUCT}} pricing — free forever tier, {{PRICE_YEAR}}/year` (55)~~
~~- **Meta:** `Every prompt free forever. 100 photos on the free tier. {{PRICE_YEAR}} a year for the whole household — every kid, both parents. No ads on any tier.` (152)~~
~~- **H1:** Pricing~~

~~> Free isn't a trial that runs out. It's a real tier you can stay on. Here's exactly what the paid plan costs so it isn't a surprise later.~~

~~| | Free | {{PRODUCT}} Plus |~~
~~| Daily question and mission | Every one, forever | Every one, forever |~~
~~| Parents on one archive | Unlimited | Unlimited |~~
~~| Children | Unlimited | Unlimited |~~

~~**Why the free tier is generous about prompts and strict about photos.** The prompts cost us almost nothing and they're the actual product, so they're never metered — some apps in this category charge you per question per day, and that's the thing worth not doing.~~

~~**Fourteen days free**, annual preselected because it's two months cheaper.~~

**What survived, and is repeated above rather than deleted:** *storage is the real cost and it runs
for eighteen years, so that is where the line is*, and *100 is lifetime rather than monthly because a
monthly reset lets a free archive grow forever against no revenue*. Both arguments are about photos
and neither depended on the missions being free.

**What did not survive:** *"the prompts cost us almost nothing and they're the actual product, so
they're never metered."* Half of it is still true and the half that is true is the half worth
keeping — **the daily question is never metered by tier** — but the sentence as written covered the
whole library, and 103 of the 133 published prompts are missions. The competitor jab it carried is
narrowed rather than dropped: Qeepsake meters *questions per day by tier* and this product does not,
which is a smaller claim than the one that used to be here and is the one that is actually true.

**Two rows are gone rather than rewritten.** *Parents on one archive: Unlimited / Unlimited* is now
false on the free side — the second parent is part of membership. *Children: Unlimited / Unlimited*
was not contradicted by anything, but nothing in the phase-107 entitlement work states it either, so
it is not asserted on a pricing page; the household claim it was standing in for lives in the
membership prose, where it is true and sourced.

</details>

---

# `/promise`

The trust page. This wins the parents who've been burned, and no competitor will copy it because
most of them can't.

- **Title:** `Our promise — what happens to your archive | {{PRODUCT}}` (54)
- **Meta:** `No ads. We never delete a word you wrote unless you ask us to. Free export forever. Exactly what happens to your archive if you stop paying, or if we go away.` (158)
- **H1:** What happens to the archive

1. **No ads, no data sale.** Ever. Including at scale.
2. **Private by default.**
3. **If you stop paying** — Movement 6's lapse block in full.
4. **If we go away.** The honest one. The export exists so the archive doesn't depend on this
   company existing. Plain files, plain folders, a viewer that runs offline from a double-click with
   no server and no internet. Written to be opened in twenty years by someone who has never heard
   of us.
5. **What we'd never build.** Streaks. Guilt notifications. A public feed. Anything that makes your
   child's archive a place other people perform.

Also the natural backlink target on the site.

---

# `/compare/tinybeans`

**Highest-value SEO page on the site.** Tinybeans acquired Qeepsake in November 2025, so the two
obvious competitors are now one company — and "Tinybeans alternatives" is a live, well-served search
with real dissatisfaction behind it: a roughly 87% annual price increase in 2024, a free tier capped
at 20 uploads a month, and advertising displayed alongside children's photos.

- **Title:** `{{PRODUCT}} vs Tinybeans — a private, ad-free alternative` (55)
- **Meta:** `Tinybeans is a shared family album with ads on the free tier. {{PRODUCT}} is a private prompted archive with no ads on any tier. An honest comparison.` (152)
- **H1:** {{PRODUCT}} vs Tinybeans

**Ground rules, not optional:** every claim about a competitor is verifiable and carries a
*verified-on* date in the page source, framed as *what each is for* rather than *why they're bad*.
Include a real "choose Tinybeans if" section and mean it. A comparison page that can't name a case
where the competitor wins reads as an ad and converts like one.

- **The short version** — Tinybeans is a shared album for the extended family. {{PRODUCT}} is a
  private archive for one parent building something to hand over. Different jobs.
- **Comparison table** — purpose, ads, free tier caps, price, prompts, what's stored with a moment,
  export, what happens on lapse
- **Where they differ most** — three paragraphs: the ads question, the prompt-with-the-moment
  question, the lapse question
- **Choose Tinybeans if** — you want grandparents commenting daily, an activity feed, Android today
- **Choose {{PRODUCT}} if** — you want a private record, you want to be asked rather than to think
  of it yourself, you want to hand it over one day
- CTA

---

# `/compare/qeepsake`

- **Title:** `{{PRODUCT}} vs Qeepsake — prompted journaling compared` (52)
- **Meta:** `Qeepsake sends prompts by text and sells printed books. {{PRODUCT}} is an iPhone archive built around search and handoff. An honest comparison.` (142)
- **H1:** {{PRODUCT}} vs Qeepsake

Qeepsake is genuinely good at what it does — text-message prompts are the lowest possible friction,
and that's a real advantage to concede in the first paragraph. The differences: SMS-first and
print-first, recurring complaints about book cost and cancellation friction, and as of the Tinybeans
acquisition it is the journaling half of a company whose other half runs ads. **Do not editorialize
about the acquisition.** State it, date it, link the source, move on.

`Choose Qeepsake if` — you want a printed book as the primary output and will never open an app.

---

# `/compare/camera-roll`

The honest one, and probably the highest-converting, because it's the objection everyone actually
has.

- **Title:** `Why not just use your camera roll? | {{PRODUCT}}` (47)
- **Meta:** `Photos.app already stores the pictures. Here's the specific thing it can't do — and when a separate archive is genuinely worth it.` (132)
- **H1:** You already have a camera roll. Here's what it doesn't do.

Concede everything true — free, already there, unlimited, great search, best backup story. Then the
four gaps: no prompt, so you only capture what you thought of; no context, so a photo of a shoe
stays a photo of a shoe; nothing non-visual, so the ten minutes on the floor and the thing he said
aren't in there; no handoff, because a camera roll is yours and full of everything else in your
life. Then: **"and if you read that and think the camera roll is enough, it might be. That's a real
answer."** That sentence is why the page works.

---

# `/waitlist` and `/thanks`

Form: **one field, email only.** Optional second field, "your kid's age" as a range select — but
only if you'll act on it, otherwise it's friction for nothing.

Button: `Get tomorrow's prompt`
Under it: `One a day, by email. A note when it opens and when the price goes live. Nothing else.`

`/thanks`:
> **You're on the list.**
> First one lands tomorrow morning. Here's one you can answer tonight, on paper, and type in later:
> *"What are they pretending to be this week?"*

That last touch does the actual work of the product on the thank-you page. Keep it.

**Consent, per `decisions.md` D3a.** The form writes **two separate boolean fields** —
`marketing_consent` and `transactional_consent` — not one flag. Untangling one flag into two later,
under a GDPR or CCPA request, is the cost this avoids, and it costs one column now.

---

# Microcopy

Every string the site needs that isn't page copy.

**Waitlist field placeholder:** `you@email.com`
**Button, idle / busy / done:** `Get tomorrow's prompt` · `Adding you…` · `You're on the list`
**Success:** `You're in. First prompt lands tomorrow morning.`
**Duplicate email:** `You're already on the list — nothing to do.` *(Not an error. Not red. Not an
alert.)*
**Invalid email:** `That doesn't look like an email address.` *(Inline, `inkMuted`, under the field.
No red — the palette has none.)*
**Failure:** `That didn't go through. Try again, or email hello@{{DOMAIN}}.`
**Nav CTA (persistent):** `Get tomorrow's prompt`
**Footer tagline:** `{{PRODUCT}} — one question a day, a childhood you can find again.`
**Footer social column:** ~~heading `Elsewhere`, then `Instagram` · `Facebook` · `X` · `TikTok` ·
`Pinterest`~~ — **removed Aug 21 2026, column and tokens together.** The hrefs were the bare
platform domains, so a link labelled `Instagram` went to instagram.com: a link to somebody else's
home page wearing our label, which is worse than no link at all. Four of the five accounts have
never existed. **The Instagram one does** — this repository publishes to it on a schedule — but
its *handle* is recorded nowhere here: `social-post.mjs` addresses the account by the numeric
`IG_USER_ID` secret, and a published row keeps a `mediaId` and no permalink. Nothing in the
repository could be read to produce a profile URL, and a guessed one is the dead link the removal
exists to prevent. **When one profile URL is verified**, restore the column as a `foot__col` with
one `<a>` per real account — plain word marks, no icons, because a row of brand glyphs is louder
than anything else in that footer and the palette has nowhere to put their colours — and add one
`SOCIAL_*` key per real account to `site.config.json`. Linking out is not a third-party *request*,
so the fine print under it stayed true and stays true.
**404 H1:** `That page doesn't exist.`
**404 body:** `Nothing was lost — which is sort of the whole idea here.` + links to `/` and
`/how-it-works`.
**Cookie banner:** none. Don't set cookies that need one. Achievable on a static waitlist site, and
not needing a banner is itself on-message.

**Image alt text patterns** — descriptive, never `app screenshot`:
- `{{PRODUCT}}'s timeline grouped by date, with the child's age on each day header`
- `A prompt card asking what made them laugh today, with a photo attached`
- `A voice entry showing a waveform and its transcript`
- Decorative shapes and gradients: `alt=""` plus `aria-hidden`.

---

# Waitlist email sequence

**[MERGE] Imported from the other source. This is a strategy decision, not just copy** — it is what
makes the `Get tomorrow's prompt` CTA honest, and it's already on the roadmap as a standalone
audience-building product.

Don't collect emails to announce a launch; that list is cold in six weeks. Collect them to deliver
**one prompt a day, starting tomorrow.** It validates the library against real parents before the
App Store does, keeps the list warm, and the launch email then converts people who have been using
{{PRODUCT}}-without-{{PRODUCT}} for weeks and already feel the gap.

**E0 — Confirmation, immediate**
Subject: `You're on the list` · Preview: `First prompt lands tomorrow morning.`
What they signed up for, in three lines. What {{PRODUCT}} is, in three more. One line on who's
building it. **No CTA** — there's nothing to click yet, and pretending otherwise teaches a list to
ignore you.

*Two optional questions here turn the whole sequence into a diary study with unbounded N, which is
the only user research this project has: "How old is your kid?" and "What do you use today —
camera roll, an app, a notebook, nothing?" One-click answers, no free text.*

**E1..En — The daily prompt, every morning**
Subject: **the prompt itself, verbatim.** `What did they say today that you want to remember?`
Body: the prompt, one line of context, and *"write it somewhere. Anywhere. That's the whole
thing."* One link to `/prompts`. Nothing else. **Short enough to read in the notification preview**
— that is the format working, not a failure of it.

**E-launch — Launch day**
Subject: `{{PRODUCT}} is on the App Store` · Preview: `Free to start. Your prompts have a home now.`
It's live, here's the link, and everything you've been answering by email now files itself, gets
searchable, and keeps the date. Backdating exists, so nothing you wrote in a notebook is wasted.
CTA: `Get {{PRODUCT}} — free`

**Hard rule:** no marketing email ever enters a deletion-warning window. Per D3a, that's the worst
version of this product.

---

# Blog — five launch posts

Each 1,200–1,800 words, one primary keyword, 2–3 secondary, and none are thinly-veiled product
pages.

1. **"The photo survives. The story doesn't."** — *how to remember childhood details*. The core
   essay: why context decays faster than images, what a prompt actually does, why the question is
   the artifact.
2. **"What to write in a keepsake book when you have no idea what to write"** — *keepsake book prompt
   ideas*. High-volume, low-difficulty, obvious intent. Give away 40 real prompts as a usable list.
   Genuinely useful standalone; product mentioned once, at the end.
3. **"Streaks are a bad idea in a parenting app"** — *parenting app guilt*. The strongest thing you
   have to say and the most linkable. Streaks optimize for the wrong variable, and the day you break
   one is the day you delete the app. **This is the post that gets shared.**
4. **"How to record your kid's voice before it changes"** — *record child's voice memories*.
   Practical, evergreen, almost no competition.
5. **"A childhood archive your kid can actually inherit"** — *digital memory box for child*. The
   handoff essay: file formats, what survives twenty years, why an export that needs a server isn't
   an archive.

---

# Social launch content

One post per day maximum, human-reviewed queue, **nothing autonomous.** Drawn from `social/out`.

- **IG carousel — "The three shapes."** Hook: *Not everything worth keeping is a photograph.* One
  slide per shape, then the no-streaks line, then CTA.
- **IG single — "No streaks. No badges. No red."** Type on cream, terracotta on one word. Caption is
  Movement 4 verbatim. It needs no help.
- **IG carousel — "What we'd never build."** Five slides, one promise each. Best of the three for
  saves.
- **LinkedIn — build-in-public.** Shipping a consumer iOS app solo in the evenings, and the design
  decision that cost most: refusing streaks in a category where retention mechanics are the default.
  ~1,100 characters.

**Reddit and parenting Facebook groups: nothing posted automatically, ever.** Ban risk, and the
wrong register for this product regardless.

---

# Reusable strings

- **Tagline:** One question a day. A childhood you can find again.
- **One-liner:** A private, prompted archive of your kid's childhood — every moment saved with the
  question that caused it.
- **App Store subtitle (30 max):** `A prompted childhood archive` (28)
- **OG / Twitter description:** Your camera roll remembers what they looked like. {{PRODUCT}}
  remembers what they were like.

---

# Do not write

- Any sentence implying the reader will regret not acting
- "Before they grow up" urgency framing
- Countdown timers, spot counters, fake scarcity
- **Testimonials that don't exist. There are no users yet — the site ships with zero social proof
  and that is correct.** Invented quotes on a trust-first product is the one unrecoverable mistake.
- Stock photography of children, on any page, ever
- A literal `{their}` anywhere the token renderer should have run
- **The word "baby", anywhere, in any form.** The subject is a child, and "child" or
  "childhood" is the term — including in compounds ("childhood journal app", "childhood
  memory app"), in prose about the paper object ("keepsake book"), in prompt bodies, in
  routes and slugs, and in the SEO targets in `seo-plan.md`. Several real search terms
  use the word; they are deliberately forgone, not overlooked.
