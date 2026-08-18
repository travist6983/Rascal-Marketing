# Dogear — Claude Design prompt sequence (final)

> **Historical record. The product is now called Vellum** (owner decision, Aug 17 2026).
> This file is left saying "Dogear" on purpose: it is a transcript of prompts that were
> actually sent to Claude Design, and its output is checked in at `docs/marketing-site/`.
> Rewriting the name here would misrepresent what was run. It also references
> `dogear-site-content.md` and `dogear-seo-plan.md`, which no longer exist — they were
> merged into `docs/site-content.md` and `docs/seo-plan.md` on Aug 15 2026.
> **If you re-run this sequence, substitute Vellum throughout and re-point those two
> attachments first.**

**Three prompts, run in order, in one Claude Design project on Fable.** Wait for each to finish
and read its report before pasting the next. Prompt 1 produces decisions you need to approve
before Prompt 2 can be correct.

**Before Prompt 1:** connect `travist6983/Rascal-Marketing` via Import. Connect the app repo as a
second source, or vendor its `tokens/` and `export_viewer/assets/` into the marketing repo first
(recommended — it keeps the marketing repo self-contained). Attach `dogear-site-content.md` and
`design-system.md`.

**What Claude Design is for here, and what it is not.** It designs and prototypes. It does not
ship. Production build happens afterward in Claude Code from `dogear-site-content.md` and
`dogear-seo-plan.md`. So: high fidelity on the home page, layout stubs everywhere else, and a
handoff pack precise enough that the rebuild is transcription rather than reinterpretation.

---

# PROMPT 1 — Foundation: extend the design system to the web

You are extending an existing, settled design system onto a new surface. **You are not designing a
brand.** Dogear is a shipped-quality iOS app with a mature design system, and the marketing site
has to look like it was made by the same person on the same afternoon.

## Sources and precedence

1. **`tokens/colors.css` + `export_viewer/assets/app.css`** — authoritative for every colour,
   gradient, radius and shadow. Read values from these files.
2. **`design-system.md`** — authoritative for rules the CSS cannot express: semantic colour
   assignment, the ink ramp, anti-patterns, motion doctrine. It is an **iOS** specification. Take
   the scale and the rules; ignore `.typeRole()`, `@ScaledMetric`, `UIFontMetrics` and every other
   SwiftUI mechanism.

Value conflict → 1 wins. Rule conflict → 2 wins.

## PREFLIGHT — hard stop, all four

**P1 — Token source reachable.** Report exact hex for: canvas, surface, terracotta,
terracottaDeep, terracottaSoft, periwinkle, periwinkleSoft, periwinkleBorder, sage, sageInk,
sageBorder, ink, inkMuted, inkFaint, border, chipPlain, sealedBorder, and the three stops of
`Gradients.wash`. **If you cannot open these files, stop.** Do not proceed from hex codes quoted in
prose — copying a value instead of compiling it is the exact failure this system forbids.

**P2 — Asset manifest.** Inventory `assets/` and `social/out/`. Table: filename, dimensions,
format, transparency, one sentence on what it depicts. **Stop and show me this before using
anything.** Much of `social/out` is 1080×1350 Instagram artwork and will not survive a hero.

**P3 — Screenshot inventory.** Every app screenshot available, and which screen each shows. If
there are none, say so and stop.

**P4 — Anti-pattern acknowledgement.** Read the anti-pattern list in `design-system.md` and restate
it in your own words. It has been violated by three consecutive design imports. Paper grain in
particular has been dropped three times and is settled as rejected — do not reintroduce it.

## The actual work: seven gaps the iOS system does not cover

`design-system.md` describes a 393pt phone. **These seven things do not exist in it and are
guaranteed to be needed.** Do not improvise them silently. For each, propose a value derived from
an existing token, state the derivation, and flag it for my approval.

**G1 — Contrast failure on terracotta. Solve this first; it constrains everything else.**
I measured cream `#FDFAF4` on terracotta `#C05A2B` at **4.25:1**, and terracotta text on cream at
the same. That fails WCAG AA for normal text (4.5:1). On iOS it survives because
`PrimaryButtonStyle` sets 17pt semibold near the large-text threshold; at web body size it does
not. **Verify my number against the real `surface` token, then solve it.** The system already
solved this exact problem once — `design-system.md` maps `done` to `sageInk` in the widget palette
"because sage is a fill and needs an ink at this size." Propose the equivalent for terracotta,
following that precedent. Report the ratio you achieve. Periwinkle measures 4.73:1 and passes;
check it anyway.

**G2 — Hover.** No hover state exists in an iOS design system. `TapScaleButtonStyle` is 0.98 over
0.12s on press and is the only nearby precedent. Propose hover for: primary button, secondary
button, card, nav link, inline text link. Keep it quiet.

**G3 — Focus.** No focus ring exists and the palette has no token for one. **Every interactive
element needs a visible `:focus-visible` ring** — this site will be keyboard-navigated and audited.
Propose a ring derived from an existing token. It must clear 3:1 against both `canvas` and
`surface`.

**G4 — Breakpoints and grid.** Nothing above 393pt has ever been designed. Propose a breakpoint
set, a max content width, a column grid, and the gutter and margin scale at each stop. State
where the phone layout stops being the right answer.

**G5 — Desktop type.** The app's scale tops out at 34pt display. A desktop hero needs more.
Propose fluid `clamp()` for hero and section headings that **lands exactly on the app's values at
phone width** and grows above it. The phone end of the curve is not negotiable.

**G6 — Links.** Inline text links do not exist in the app. Propose colour, underline treatment,
hover, visited, and focus. Note that terracotta at body size is blocked by G1.

**G7 — Web form states.** The app has sheet fields and onboarding fields; the web needs idle,
focus, filled, invalid, submitting, success, and duplicate-value. **There is no red in this
palette and you may not add one.** `design-system.md` is explicit: a disabled primary is
`chipPlain` under `inkFaint`, never red, never struck through. Solve invalid without red.

## Deliverable

1. **`tokens.css`** — every custom property, sourced. Web-only additions in a separate, commented
   block so it is obvious what is inherited and what is new.
2. **A component catalog page** — one scrollable page drawing every token and every state: the
   full swatch set, the type ramp at phone and desktop, buttons in all states including focus and
   disabled, cards, chips, badges, form fields in all seven states, links, and the wash gradient.
   Model it on `DesignSystemCatalog.swift`, which does exactly this job in the app.
3. **A contrast table** — every foreground/background pairing you introduce, with its measured
   ratio and pass/fail against AA. Not estimates. Compute them.
4. **A decisions report** — G1 through G7, each with the value proposed, the token it derives from,
   the reasoning, and your confidence. Anything you were unsure about goes in an open-questions
   list rather than into the CSS.

## Out of scope for Prompt 1

No pages. No home page. No copy. No illustrations. Foundation only. If you find yourself designing
a hero, stop — that is Prompt 2 and it will be wrong without this approved first.

---

# PROMPT 2 — The home page

The foundation is approved. Build the home page as a high-fidelity, fully interactive prototype.
**This is the page the whole project is judged on.**

## The bar

Someone lands here from a link, knows nothing, and inside eight seconds thinks *who made this.*
Not from volume — from craft. Every edge intentional, every transition timed, nothing generic,
nothing that could be swapped into another product without anyone noticing.

**Where WOW comes from, precisely:** one signature interaction that people play with and remember,
surrounded by quiet, dense, high-craft detail. Not fourteen animated sections. A page where
everything shouts has no loud thing in it.

## Eight movements, not thirteen sections

Copy comes verbatim from `dogear-site-content.md` §2. You are not rewriting it. The mapping:

1. **Hero** — content §2.1, with the H1 **changed** to *"Your camera roll has the photos. Dogear
   has the reasons."* Subhead as written. Primary CTA is now **`Get tomorrow's prompt`**, support
   line *One a day, by email, until Dogear launches. Free.*
2. **The thesis** — §2.2. Quiet. Type-driven. Almost nothing moves.
3. **★ THE PROMPT ENGINE** — §2.3 + §2.4 + §2.5, fused into one interactive centerpiece. Spec below.
4. **Miss a day** — §2.6. The quietest section on the page. Do not decorate it. Its power is that
   it arrives after the loudest thing and says almost nothing.
5. **The archive** — §2.7 + §2.8. Timeline screenshots, search, ages on date headers, backdating.
6. **What Dogear won't do** — §2.9. Five promises. This is the trust hinge; give it real space.
7. **Handoff + pricing** — §2.10 then §2.11. Emotional beat, then the ask, in that order and never
   reversed.
8. **FAQ + final CTA** — §2.12 + §2.13.

Sections displaced from the original thirteen are not deleted — they move to supporting pages in
Prompt 3.

## ★ Movement 3 — the centerpiece, specified

This replaces three separate sections with one thing people touch. There is an existing card-changer
prototype in the repo; treat it as a **pattern to re-express, not code to copy** — `support.js` is
prototype scaffolding and is explicitly not portable.

**What it is:** a life-size prompt card, centered, rendered in the real design system, that a
visitor can drive.

**What it demonstrates, in one object:**
- **Cycling prompt bodies** — real sentences from the 113-prompt library, changing on a slow,
  readable interval, and on demand. This is the product's actual value proposition and it should
  be the thing on screen the longest.
- **The three completion shapes** — did it / captured it / wrote it. Let the visitor switch between
  them and watch the same card become three different entries. **This is the single best idea on
  the page**: no competitor has it, and it is impossible to explain in prose and obvious in one
  interaction.
- **Semantic colour, taught without a caption.** Terracotta cards for missions and photos.
  Periwinkle for questions and voice. Sage for completed. A visitor should absorb the colour
  language without being told it exists.
- **The 15-second claim, made literal.** Show the capture happening at the speed it actually
  happens. Do not fake a loading state — there isn't one.

**Interaction requirements:**
- Works on touch and with a mouse. Tap targets ≥44px.
- **Keyboard operable.** Arrow keys or tab-and-enter move between prompts and shapes. A focus ring
  is visible on every control. Announce state changes with `aria-live="polite"`.
- Auto-advance pauses on hover, on focus, and on any interaction, and does not resume until the
  visitor leaves. Nothing yanks the card out from under someone reading it.
- Under `prefers-reduced-motion: reduce`: transitions become instant swaps. **The component still
  works completely** — it is not decoration, and degrading it to a static image loses the argument.

## Motion doctrine

**High density, low amplitude.** Many small things settling, one thing worth watching.

**Yes:** fade-and-rise on entry, ~0.28s ease-out, ~16px travel, staggered 40–60ms in a group ·
rules and underlines that draw left to right · a thumbnail mosaic filling one tile at a time · a
number counting up once, on entry, once only · hover at 0.98 scale over 0.12s · long-period,
low-amplitude drift on decorative shapes only.

**No:** scroll-jacking or hijacked scroll position, ever · parallax beyond ~15% differential ·
rotation past a couple of degrees, and **zero rotation on anything containing content** · bounce,
elastic, or overshoot easing · confetti, particles, bursts — the app deliberately refuses a
completion burst and the site does not get to be louder than the product · letter-by-letter text
assembly · any motion that delays a reader reaching the words.

**`prefers-reduced-motion: reduce` is honoured by every single animation.** Plain opacity or
nothing. The app honours it everywhere. This is the first thing I will check.

**LCP rule:** the `<h1>` renders immediately, in final position, at final size. It does not fade
in, slide in, or wait on a font. Animate everything below it.

## Constraints

**Stack.** Vanilla HTML, CSS, JS. **No React, no Vue, no Tailwind, no Framer Motion, no GSAP, no
bundler, no npm runtime dependency.** Motion is CSS animations, CSS transitions,
`IntersectionObserver`, scroll-driven animations, and the View Transitions API. All native, all
sufficient. The production repo is no-build-step and this prototype must be transcribable into it.

**Fonts.** Nunito for headlines, weights 600 and 700, self-hosted and subset. System sans for body.
**No Google Fonts CDN and no third-party request of any kind** — a site whose headline promise is
that nobody is tracking your kid cannot phone a third party. Positioning requirement, not
performance.

**Colour is meaning, not decoration.** Terracotta = missions, photo/video, primary actions.
Periwinkle = questions, voice, written entries. Sage = completed. Do not tint a question card
terracotta because terracotta is the brand colour. Never pure black, never pure white, including
over media. Ink is a three-step ramp and **`inkFaint` is not a text colour for anything a reader
must read** (~2.1:1 on canvas).

**Rejected — do not propose, do not drift toward:** risograph, halftone, misregistration,
screen-print texture, **paper grain** · condensed or rotated display type · rotated or angled cards,
passport stamps, receipt-spike stacks — content is never set on an angle · full-bleed photo cards as
a primary layout · high-saturation electric accents · frosted glass and `backdrop-filter` panels ·
streak counters, guilt copy, red urgency states — **the palette has no red and you may not add
one** · dark mode · **stock photography of children, ever.**

**No false urgency.** No countdowns, no "200 spots left", no scarcity of any kind. The product's
entire position is that it does not manipulate parents. A landing page that does contradicts it on
sight.

**Imagery.** App screenshots in movements 3 and 5, in a device frame or on a soft cream card with a
real shadow, never bleeding to the viewport edge. Where a section needs a visual and no asset fits:
abstract or recreated app UI in SVG, built from tokens — prompt cards, timeline rows, waveforms,
date headers, the floating tab bar with its terracotta centre disc. Never a person, never a
generic illustration-library family.

## Deliverable and self-audit

The working page, plus a report:

1. **Verified vs. reasoned.** State plainly which token values you read from a file and which you
   inferred. If you never opened `tokens/colors.css`, that goes in the first line, not a footnote.
2. **Motion inventory.** Every animation, duration, easing, trigger, and confirmation it has a
   reduced-motion branch. Anything without one is listed as a defect.
3. **Contrast table** for every new pairing, measured.
4. **Anti-pattern self-audit.** Walk the rejected list item by item and state where you came
   closest to each. **"None apply" is not an acceptable answer** — find the nearest miss. Paper
   grain, rotated cards, frosted glass, and a red error state are the four that have slipped
   through before.
5. **Ranked confidence list**, most to least, with reasons.
6. **Open questions** — everything you wanted to guess at and didn't.

**Break-tests you actually run, and report as run or not run:**
- Force `prefers-reduced-motion: reduce`. Every animation degrades. The centerpiece still works.
- Narrow to 320px. No horizontal scroll, no tap target under 44px.
- Keyboard only, no mouse. Reach and operate every control in movement 3, with a visible focus ring
  at every stop.

**Adversarial re-read.** When you think you're done, re-read the anti-pattern list and the motion
doctrine against your own output as though looking for reasons to reject it. Report findings —
including none, if it's none, but look first.

## Stop and ask

A token gap, a CSS-vs-`design-system.md` conflict the precedence rule doesn't resolve, or a section
needing a visual nothing in the assets can supply — **stop and report. Do not invent.** A reported
gap costs me five minutes; an invented token costs a regression I find three phases later.

---

# PROMPT 3 — Supporting pages and handoff pack

Home page approved. Two jobs, and the second matters more than it sounds.

## Job 1 — Layout stubs for eight routes

**Stubs, not finished pages.** Real structure, real components, real tokens, real responsive
behaviour — with headings and section shells in place and body copy indicated rather than fully
set. The point is to prove the system holds across page types and to give Claude Code a layout to
build against.

| Route | What it needs to prove |
|---|---|
| `/how-it-works` | Long-form editorial layout — sections, sub-sections, inline media |
| `/prompts` | **The hardest one.** Filter controls, a dense browsable list, per-item anchors. Design the empty state and the no-results state |
| `/pricing` | Two-tier comparison plus a competitor table, without a red "not included" column |
| `/what-we-dont-do` | Five long-form promises. Prove restraint holds over a full page |
| `/about` | First-person editorial, single column |
| `/vs/tinybeans` | Comparison table pattern, reusable for `/vs/qeepsake` |
| `/journal` + one post template | Index cards and an article layout |
| `/404` | One screen |

Plus the site-wide shell: header with persistent CTA, sticky behaviour, mobile nav, footer.

**`/prompts` carries a hard constraint.** Library bodies store pronoun tokens — `{they}`,
`{their}`, `{name}`, thirteen in all — and are rendered at display time. The renderer already
exists in `export_viewer/assets/app.js`. **Reuse that table; do not write a second one.** Default
to the they/them column with a neutral stand-in for `{name}`. A literal `{their}` on the page whose
job is proving the prompts are well written is a public failure, so include it as a break-test.

## Job 2 — The handoff pack

The production build happens elsewhere, in Claude Code, from `dogear-site-content.md` and
`dogear-seo-plan.md`. **Your handoff is what makes that a transcription instead of a
reinterpretation.** Produce:

1. **Final `tokens.css`**, inherited and web-only blocks clearly separated.
2. **A component spec** — for each component you built: variants, all states (default, hover,
   active, focus-visible, disabled, loading, error), the tokens it uses, its keyboard behaviour,
   and how it's announced to a screen reader.
3. **A motion spec** — every animation as a named, reusable primitive: duration, easing, trigger,
   stagger, reduced-motion branch. Claude Code should be able to apply these by name without
   re-deriving a single timing.
4. **A responsive spec** — every breakpoint, what changes at each, and which components restructure
   rather than reflow.
5. **An asset map** — every asset used, from where, at what size, with its alt text.
6. **An accessibility statement** — the contrast table, the focus-ring treatment, keyboard paths
   through every interactive component, and any known gaps stated rather than omitted.
7. **A "do not change in production" list** — the decisions that will look arbitrary to an engineer
   and are not. Semantic colour assignment, the absence of red, the reduced-motion branches, the
   pronoun renderer, the no-third-party-request rule. Say why for each. **This list is the one that
   prevents the site drifting away from the app six weeks after launch**, which is the failure this
   whole exercise exists to avoid.

## Out of scope

No backend, no real form submission, no email templates, no blog post bodies, no CMS, no analytics
(leave a marked slot — **do not add GA4**), no App Store badges (the app hasn't shipped), and
nothing implying Dogear is available now. It is a waitlist.

**Two unresolved slots.** Do not guess either; leave a visible `TODO:` in the markup and list both
in your report: the production domain and every email address, and the waitlist form's POST
endpoint. Build the form completely — all seven states — against a stubbed handler with a clearly
marked integration point.
