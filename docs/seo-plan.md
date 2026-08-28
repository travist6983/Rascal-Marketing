# SEO plan

**CANONICAL. Supersedes `dogear-seo-plan.md` and the earlier `seo-plan.md`. Delete both.**
Merged Aug 15 2026. Page targets match the sitemap in `site-content.md`; if that file's routes
change, this one is wrong until it's updated.

**Run inverted.** `/seo-audit` audits an existing site; there isn't one. So this is keyword
research, page-level target mapping, and the technical checklist reframed as **build requirements**
rather than findings. Nothing below measures a live site, because there is nothing live to measure.

**Volume and difficulty are directional, not sourced from a keyword tool.** No Ahrefs or Semrush is
connected. Every difficulty call is inferred from who currently ranks and how well-resourced they
are. Connect a tool before making a real bet on any of it.

---

## Executive summary

**Biggest structural advantage: the category just consolidated and left a gap.** Tinybeans acquired
Qeepsake in November 2025, so the two most obvious prompted-journal competitors are now one company
— one of which runs advertising alongside children's photos on its free tier and raised its annual
price roughly 87% in 2024. *Ad-free* and *we never delete what you wrote* are positions the market
leader structurally cannot take, because ad revenue is in its P&L.

**The brand name changed on Aug 17 2026 in response to this section.** It used to read "the brand
name is unwinnable as written," and it was about *Dogear*: occupied on the App Store by *Dogear:
Social Reading Tracker* and *Dogear'd*, on Google Play by a book-quote widget, on the Chrome Web
Store by a bookmarking extension, with `thedogearapp.com` and `getdogear.com` both live and held by
book trackers — one with homepage copy nearly identical in tone to this product's. The verdict was
that you would not rank for your own name, and branded search is normally the cheapest traffic a
new product gets. The owner settled on **Vellum** instead.

**That fixed the old collision and walked into a new one. Settled Aug 27 2026: the name is now
Pocket Chronicle.** An attorney confirmed the conflict this section had been worried about since
Aug 18, and everything below it — recorded while the question was open — turned out to be right.

The collision that was known without looking: **Vellum by 180g**, a live and well-regarded
book-formatting app for authors — software, actively sold, in a publishing-adjacent category,
which was nearer to this product than most of the Dogear cluster was. There was also the
ordinary-word problem: *vellum* is a material, so generic results competed for the bare term in a
way they never did for a coined-ish name. Neither observation needed a search to make, which is
the part worth keeping.

**No clearance search has been run on "Pocket Chronicle" either.** It is a name with one known
conflict removed, not a name with a search behind it, and *chronicle* is an ordinary English noun
in exactly the way *vellum* was. The rule the rest of this section states — do not treat clearance
as done and do not treat it as failed until a dated search is on file — applies to it unchanged.

**Two accounts of the clearance status are on record and they contradict each other.** The owner
has said the name was already checked and is fine. A separate open item filed the same night
(Project-Rascal `decisions.md`, item 15) says no search has been run. This document does not pick a
side, because neither account arrived with a search to point at.

**What would settle it, and should be attached here when it exists:** a dated trademark search
naming the classes covered, and confirmation of the App Store name's availability. Until one of
those is on file, do not treat clearance as done and do not treat it as failed. The ordering, if it
turns out the search is still owed: an App Store listing can be edited before submission, but
outbound email cannot be recalled once sent — so email is the deadline that matters.

The risk was put to the owner with the 180g collision named, and he confirmed the name. Recorded
that way on purpose: whatever the clearance status turns out to be, this was a decision made with
the collision in view.

**Practical SEO consequence, unchanged in shape from the Dogear analysis:** do not build on ranking
for the bare brand term. Qualified brand queries are the winnable ones, and the strategy below
already assumes that.

**The single best asset is `/prompts`.** 133 authored prompts (count generated from the app seed; see scripts/prompts.mjs), published browsable, is a long-tail
surface of several hundred low-competition parenting queries and the only page here anyone would
link to unprompted. No competitor publishes theirs; Qeepsake meters them by tier. (Narrowed Aug 21 2026: we meter the *missions* by tier too now — what still separates us is that the daily **question** is never metered, and that all 133 are published to read either way.) Every other page
asks for something. That one gives something away, which in this category is the brand argument
made without saying it.

**Top three priorities:**
1. ~~Resolve the name, or accept that branded search is a write-off and budget entirely for
   non-branded and comparison traffic.~~ **Done Aug 27 2026, by moving the name to Pocket
   Chronicle** — and it did not come cheap: every drawn surface carrying the old wordmark had
   to be redrawn or re-rendered. The successor priority is the same sentence with the new name
   in it: get a dated clearance search on file for *Pocket Chronicle* before more surfaces are
   built on top of it.
2. Ship the three comparison pages at launch, not later. Highest-intent, lowest-difficulty traffic
   available, and the competitive window is open now.
3. Build `/prompts` properly — filterable, per-item anchors, working token renderer.

**Overall:** strong content-market fit, structurally weak brand term, no domain authority. Expect
nothing organic for 4–6 months. Comparison pages will move first.

---

## Keyword opportunity table

Intent: **I** informational · **C** commercial · **T** transactional · **N** navigational

| # | Keyword | Difficulty | Opportunity | Intent | Target page |
|---|---|---|---|---|---|
| 1 | tinybeans alternative | Moderate | **High** | C | `/compare/tinybeans` |
| 2 | qeepsake alternative | Easy | **High** | C | `/compare/qeepsake` |
| 3 | keepsake book prompt ideas | Easy | **High** | I | Blog 2 |
| 4 | ad free childhood memory app | Easy | **High** | C | `/promise` |
| 5 | childhood memory app no ads | Easy | **High** | C | `/promise` |
| 6 | questions to ask your 4 year old | Easy | **High** | I | `/prompts` |
| 7 | record child's voice memories | Easy | **High** | I | Blog 4 |
| 8 | daily prompt journal for parents | Easy | **High** | C | `/how-it-works` |
| 9 | private childhood journal app | Moderate | **High** | C | `/` |
| 10 | app that asks questions about your child | Easy | **High** | C | `/how-it-works` |
| 11 | daily prompts to remember your child's childhood | Easy | **High** | I | `/prompts` |
| 12 | journal prompts for toddlers parents | Easy | Medium | I | `/prompts` |
| 13 | how to remember things your kid says | Easy | Medium | I | `/prompts` |
| 14 | best childhood journal app | Hard | Medium | C | `/compare/tinybeans` |
| 15 | childhood time capsule app | Easy | Medium | C | Blog 5 |
| 16 | digital memory box for child | Easy | Medium | C | Blog 5 |
| 17 | how to remember childhood details | Easy | Medium | I | Blog 1 |
| 18 | memory journal for toddlers | Moderate | Medium | C | `/` |
| 19 | qeepsake vs tinybeans | Moderate | Medium | C | `/compare/qeepsake` |
| 20 | is tinybeans worth it | Moderate | Medium | C | `/compare/tinybeans` |
| 21 | parenting app without streaks | Easy | Medium | I | Blog 3 |
| 22 | journal app for dads | Easy | Medium | C | Blog 1 |
| 23 | how to organize photos of your kids | Moderate | Medium | I | `/compare/camera-roll` |
| 24 | tinybeans free tier limits | Easy | Medium | I | `/compare/tinybeans` |
| 25 | monthly milestone questions toddler | Easy | Medium | I | `/prompts` |
| 26 | letter to my child to open at 18 | Easy | Medium | I | `/how-it-works` |
| 27 | best family journal app | Hard | Low | C | `/` |
| 28 | export childhood journal data | Easy | Low | I | `/promise` |
| 29 | what to write in a keepsake book | Moderate | Low | I | Blog 2 |
| 30 | app to save kids drawings and photos | Easy | Low | C | `/how-it-works` |

**Where the opportunity concentrates:** rows 1, 2, 4, 5, 20, 24 — commercial-intent searches by
people *already dissatisfied with a named product* and looking for a specific attribute you have.
Cheapest conversion in the table, and it doesn't require domain authority. It requires a page that
honestly answers the question.

**The `/prompts` cluster is rows 6, 11, 12, 13, 25.** Individually small, collectively the largest
addressable surface here, and none of them are contested by anyone with a budget.

**Rows 14 and 27 are traps.** "Best childhood journal app" is owned by well-resourced comparison sites
(ourtifacts.com, nappi.app and similar) publishing dozens of posts on this exact cluster. Do not
build a strategy on outranking them in year one. Target the term; do not depend on it.

**Brand terms are absent from this table on purpose.** Bare "dogear" was a lost cause to a
cluster of book-tracking apps; bare "vellum" was a lost cause to an ordinary English noun plus an
established formatting app. Bare "pocket chronicle" has not been researched at all — this table's
own opening rule is that volume and difficulty are directional until a tool is connected, so
treat it as unmeasured rather than as won or lost. What holds across all three names is that
qualified brand terms — *{{PRODUCT}} app for parents*, *{{PRODUCT}} childhood archive* — are, and
belong in every title tag, OG title, social bio and the App Store subtitle. **Never ship a title
tag that reads only `{{PRODUCT}}`.**

**Deliberately not pursuing:** newborn and pregnancy keywords (*pregnancy journal app*, *newborn
milestone tracker*). Enormous volume, brutal difficulty, and the wrong user — the product is built
for an ongoing childhood, not the first six months, and ranking would bring traffic that bounces.

---

## Page-level targets

| Page | Primary keyword | Title tag (≤60) | Notes |
|---|---|---|---|
| `/` | private childhood journal app | `{{PRODUCT}} — a daily prompt journal for your kid's childhood` | H1 stays the emotional line; keyword lives in title + first 100 words |
| `/how-it-works` | daily prompt journal for parents | `How {{PRODUCT}} works — one prompt a day, saved with context` | Best `HowTo` schema candidate |
| `/prompts` | questions to ask your 4 year old | `Every prompt {{PRODUCT}} asks — 133 of them, free to read` | **Pillar. Highest long-tail surface on the site.** The title says *prompt* rather than *question* as of Aug 21 2026: only 30 of the 133 are questions, and the page now says so eight lines under its own H1. The long-tail phrase is unaffected — it is carried by the H2 *"The same questions to ask your 4 year old still work at nine"*, which is where it always did the work |
| `/pricing` | *(brand + pricing)* | `{{PRODUCT}} pricing — the daily question is always free` | Low organic value, high conversion value |
| `/promise` | ad free childhood memory app | `Our promise — what happens to your archive \| {{PRODUCT}}` | Natural backlink target |
| `/compare/tinybeans` | tinybeans alternative | `{{PRODUCT}} vs Tinybeans — a private, ad-free alternative` | Highest-value page on the site |
| `/compare/qeepsake` | qeepsake alternative | `{{PRODUCT}} vs Qeepsake — prompted journaling compared` | |
| `/compare/camera-roll` | how to organize photos of your kids | `Why not just use your camera roll? \| {{PRODUCT}}` | Highest-converting, moderate traffic |
| `/faq` | *(long-tail catch-all)* | `Frequently asked questions \| {{PRODUCT}}` | `FAQPage` schema |

**Keyword placement rule for every page:** primary keyword in the title tag, in the first 100 words
of body copy, and in exactly one H2. Nowhere else deliberately. **The H1 is allowed to be the good
sentence rather than the keyword** — that trade is worth making on a brand this voice-dependent.

---

## On-page build requirements

| Requirement | Applies to | Severity if missed |
|---|---|---|
| **Pronoun tokens rendered, never printed raw** | `/prompts`, blog | **Critical** |
| One `<h1>` per page, matching the title tag's intent | Every page | Critical |
| Title tags unique, ≤60, brand always qualified | Every page | Critical |
| Meta descriptions unique, ≤158 | Every page | High |
| Primary keyword in the first 100 words | Every page | High |
| Descriptive alt on every image; `alt=""` + `aria-hidden` on decoration | Every page | High |
| Each prompt individually anchored (`/prompts#p-0042`) | `/prompts` | High |
| Competitor claims carry a `verified-on` date in source | `/compare/*` | High |
| 2–3 internal links per page, descriptive anchors, no orphans | Every page | Medium |
| Heading hierarchy unbroken — no H2→H4 | Every page | Medium |
| Clean slugs, no dates, no params | Every page | Medium |
| Screenshots at 2×, WebP with fallback | `/`, `/how-it-works` | Medium |

**The pronoun row is Critical on purpose.** Library bodies store `{they}`, `{their}`, `{name}` and
ten others, rendered at display time. A marketing site that copies bodies without the renderer gets
`What did {they} say about {their} day?` indexed on the page that exists to prove the prompts are
well written. It fails silently and publicly. The table already exists in
`export_viewer/assets/app.js` — reuse it.

---

## Content gap analysis

| Gap | Why it matters | Format | Priority | Effort |
|---|---|---|---|---|
| No public prompt library exists in this category | Hundreds of long-tail queries, zero competition, only linkable asset here | `/prompts` | **High** | Substantial |
| Prompted-journaling comparison content | Competitors' comparison pages are written by competitors; independent blogs own neutral ground. You can own the honest first-party version | 3 comparison pages | **High** | Half day each |
| "Ad-free" as a searchable attribute | Nobody leads with it because the leader can't | `/promise` + blog | **High** | Quick |
| Streaks/guilt critique | Zero first-party content exists. Most linkable post you'll write | Blog 3 | **High** | Half day |
| Voice/audio memory capture | Almost uncovered by competitors, who are photo-first | Blog 4 | **High** | Half day |
| What happens to photos after you cancel | High-anxiety query; you have a genuinely better answer than the category | Blog 5 + `/promise` | **High** | Moderate |
| Data portability / export | Competitors are quiet because their answers are worse | `/promise` | Medium | Quick |
| Older-kid entry point ("my kid is 7") | Category is dominated by infant-and-newborn framing; 4–12 is underserved | FAQ + blog | Medium | Quick |
| Handoff / inheritance framing | Nobody owns "an archive your child inherits." Category-defining if it lands | Blog 5 | Medium | Multi-day |
| Age-banded `/prompts` sub-pages | Splits the pillar into a cluster | Sub-pages | Medium | Moderate |
| Dad-specific angle | Category copy is overwhelmingly mother-directed | Blog angle | Low | Half day |

**Do not build the topic cluster before the pillar ranks.** `/prompts` first; sub-pages only once
it holds positions. Splitting early divides what little authority a new domain has across pages
that then all fail.

---

## Technical checklist — as build requirements

| Check | Requirement | Why |
|---|---|---|
| Rendering | **Server-rendered / static HTML.** No client-side-only content | The no-build-step constraint gives you this free. A React SPA forfeits it |
| Title tags | Unique, ≤60, from the table above | |
| Meta descriptions | Unique, ≤158, each ending in an implicit or explicit action | |
| H1 | Exactly one per page | Easy to break with an animated hero that stacks two headline elements — **watch this specifically** |
| Heading order | No skipped levels | Also an accessibility requirement |
| Canonicals | Self-referencing on every page | |
| `sitemap.xml` | Hand-written is fine at this size | No build step needed |
| `robots.txt` | Allow all, point at sitemap | |
| HTTPS | Enforced, HSTS | |
| Structured data | `Organization` + `SoftwareApplication` sitewide; `FAQPage` on `/faq` and home FAQ; `HowTo` on `/how-it-works`; `Article` on blog; `BreadcrumbList` on `/prompts` sub-pages | JSON-LD in a `<script>` tag. No dependency |
| OG + Twitter cards | Per page, real image, no child's face | Comparison pages get shared in parenting groups; this is what gets seen |
| Image format | WebP or AVIF with fallback, explicit `width`/`height` on every `<img>` | Missing dimensions is the most common CLS cause |
| Alt text | Descriptive on every asset; decorative motion elements `alt=""` + `aria-hidden` | |
| LCP | Hero must be text or a preloaded image, **never lazy-loaded or JS-injected** | The animated hero is the risk. If the H1 fades in via JS, LCP is measured after the JS runs |
| CLS | Reserve space for every animated element before it animates | Same risk, same source |
| INP | CSS or `IntersectionObserver`, never a scroll listener doing layout work | A scroll handler reading geometry per frame tanks INP on mid-range Android |
| `prefers-reduced-motion` | **Every animation gates on it** | It's in the app's design system, and a marketing site that ignores it while selling a calm product is a contradiction |
| Fonts | Self-hosted, subset, `font-display: swap`, preloaded. **No Google Fonts CDN** | A third-party font request on a site promising nobody tracks your kid is the leak people screenshot |
| Mobile | 44px tap targets, correct viewport, no horizontal scroll at 320px | |
| Internal linking | 2–3 per page, no orphans; comparison pages link to each other | |
| 404 | Custom, links home and `/how-it-works` | |
| Analytics | Cookieless (Plausible, Fathom) or none. **Never GA4** | Same reason as the font row |

**Two rows are positioning, not performance.** The fonts row and the analytics row. Somebody will
open devtools, and that person is exactly the customer.

---

## Competitor comparison

**Every figure is dated Aug 15 2026 and sourced. Re-verify before publishing** — pricing pages move,
and a wrong number about a competitor is the one mistake that costs credibility permanently.

| Dimension | You | Tinybeans | Qeepsake |
|---|---|---|---|
| Ownership | Solo developer | Tinybeans Group | **Tinybeans Group** (acquired Nov 2025) |
| Domain authority | Zero | Established, ~14 yrs | Established, ~11 yrs, now Tinybeans-owned |
| Content depth | None yet | Deep — parenting content is a core product | Moderate |
| Publishing cadence | None yet | Frequent | Low |
| Ad-free | **Yes, structurally** | No — ads on free tier | Inherited conflict via parent co. |
| Prompt saved with the moment | **Yes, unique** | No | No |
| Never-delete promise | **Yes** | Free-tier fallback | Read-only fallback |
| Household pricing | **Yes, one membership** | Per-account | Per-account |
| Free tier | **The daily question every day, forever**, unlimited text and voice, 100 photos lifetime, full export | ~20 uploads/mo, ads | Prompt volume metered by tier |
| Paid price | {{PRICE_YEAR}}/yr, {{PRICE_MONTH}}/mo | $74.99/yr or $7.99/mo | Tiered by prompt volume |
| Export | Full, free, always, offline HTML viewer | Limited | Limited |
| Platform | iPhone only | iOS + Android + web | SMS + iOS + Android |
| Print output | Planned, not built | Yes | Yes, core to the model |

**Where you lose, and should not pretend otherwise:** iPhone-only, no Android, no web, no print
product yet, no users, no reviews, no domain authority, solo developer. **Every comparison page must
say some version of this.** A page that concedes nothing converts worse than one that does, and on a
product whose entire pitch is trustworthiness it is actively off-brand.

---

## Prioritized action plan

**Quick wins — do with the build**

| Action | Impact | Effort | Depends on |
|---|---|---|---|
| Title tags + meta descriptions from the table | High | 1 hr | — |
| JSON-LD: `Organization`, `SoftwareApplication`, `FAQPage`, `HowTo` | Medium | 1 hr | — |
| `sitemap.xml`, `robots.txt`, canonicals | Medium | 30 min | Final URL list |
| Alt text on every asset as it's placed | Medium | 1 hr | Asset inventory |
| `prefers-reduced-motion` on every animation | High (UX + brand) | Built in | Design prompt |
| Explicit `width`/`height` on all images | High (CLS) | 30 min | — |
| Self-host + subset the font; drop any CDN reference | Medium | 1 hr | Font licence |
| Cookieless analytics, or none | Low SEO, high brand | 30 min | Domain |
| Per-page OG images from `social/out` | Medium | 1 hr | Asset manifest |

**Strategic — first quarter**

| Action | Impact | Effort | Depends on |
|---|---|---|---|
| ~~**Resolve the brand-name collision**~~ **Done Aug 27 2026 — renamed to Pocket Chronicle.** Its dependencies are still owed for the new name | **Highest** | Unknown | Trademark search + App Store name reservation |
| Build `/prompts` filterable, with the real token renderer | **Highest** | Multi-day | Library export + `app.js` token table |
| Ship all three comparison pages **at launch** | **Highest** | 1.5 days | Verified competitor facts |
| Launch the daily-prompt waitlist email | High | Multi-day | ESP + the two consent lanes per D3a |
| Publish blog posts 2 and 3 first | High | 1 day | — |
| Remaining three blog posts on a 2-week cadence | Medium | 1.5 days | — |
| Age-banded `/prompts` sub-pages | Medium | Multi-day | `/prompts` ranking first |
| Refresh comparison pages quarterly with dated verification | Medium | 1 hr/qtr | Ongoing |

**The name row is the dependency everything else sits on**, and the only item here that can
invalidate work already done. It said so should be resolved before the site is public, not after
— and it was not. The site went public on getvellumapp.com on Aug 18 2026 and the name moved on
Aug 27, which is precisely the sequence this line warned against; the cost was a dead domain with
no redirect, a re-drawn lockup, and 23 committed binaries carrying a name the product no longer
has. Keeping the warning rather than ticking the row, because its dependencies — a dated
trademark search, an App Store name reservation — are still owed, now for *Pocket Chronicle*.

**One process rule, because it's the thing that will bite:** every factual claim about a competitor
carries a *verified-on* date in the page source and gets re-checked quarterly. Prices and free-tier
caps in this category move — Tinybeans moved theirs ~87% in a single year. A stale claim about a
competitor's pricing, on a page that sells honesty, is a self-inflicted wound.

---

## If it were one thing

`/prompts`. It ranks for a cluster nobody defends, it's the only page anyone will link to
unprompted, it demonstrates the product better than the screenshots, and it doubles as the content
engine for the waitlist email. Every other page on this site asks for something. That one gives
something away, which in this category is the entire brand argument made without saying it.
