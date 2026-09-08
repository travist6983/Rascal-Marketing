# Marketing site accuracy pass — the update prompt
**Written Sep 7, 2026.** Everything below was audited against two things: the copy that is **actually deployed** at pocketchronicle.app (the detached worktree at commit `398eff1`, which lives only on `origin/claude/app-store-link-integration-5u9sj9`), and the **shipped app and API** in `Project-Rascal`. 114 raw findings were deduped to the 36 here.

Hand this whole file to whoever does the work. It is written to be followed top to bottom.

* * *
## What this is for
The app is live. The site was written as a pre-launch waitlist and a launch pass on Sep 7 fixed the launch framing — the store link is the CTA everywhere and `npm run check` now bans the waitlist-era phrases. **What that pass did not touch is what the app actually gives you.** The pricing table still sells a free tier that no longer exists: 100 free photographs, unlimited two-minute voice notes. The day is still described as one prompt. The recorder is still described as two minutes and hold-to-record. That is the work.

* * *
## Do these two things before you touch a page
### 1. Merge the launch branch into `main`, or every fix below gets reverted
The live site is **not** on `main`. `main` still carries the pre-launch copy, and `.github/workflows/pages-actions.yml:29` deploys on every push to `main` — so the next ordinary commit publishes the pre-launch site over the live one, and takes your fixes with it.

```bash
cd /Users/travis/repos/personal/Rascal-Marketing
git fetch origin
git checkout main && git merge origin/claude/app-store-link-integration-5u9sj9
git merge-base --is-ancestor 398eff1 main && echo MERGED   # must print MERGED
git push origin main
```

Branch every fix off that merge commit. Do not start until `MERGED` prints.
### 2. Know that the free-tier rule is built but not merged either
The rule this whole pass is about — **anything that needs storage is membership** — is implemented and tested on two branches that have not merged and are therefore **not deployed**: `origin/api/phase-147-api` and `origin/ios/phase-147-ios` (Sep 6, 2026).

The server half puts a `402 subscription_required` on `POST /media/upload-url` unless the household is **entitled**, with the message _"Adding photos, video and audio is part of membership."_ A household inside its fourteen days is entitled and passes; a free household does not. Reads are deliberately untouched — download, export, search and sync all still work on the free tier, so an archive already captured stays readable forever.

**Sequencing, and it matters:** today, a free household can still upload, because that gate is not in production. If the site ships the new free-tier copy first, the site is stricter than the product. **Publish the copy in the same window that phase 147 merges and deploys**, or hold the copy until it does.

> **[RESOLVED Sep 7 2026, later the same day.]** Phase 147 merged (PRs #197 and #198) and
> **deployed** while the copy pass was in flight. Verified against production rather than
> assumed: `https://rascal-api.fly.dev/openapi.json` carries the `402 subscription_required`
> paragraph on `POST /v1/media/upload-url`, and `services/media.py:144` gates on
> `if not household.entitled` with no feature flag behind it. So the gate is live and the
> sequencing worked out.
>
> The owner's answer to question 2 below — *say only what is true today* — was given while the
> gate was still unmerged, and the six sentences shipped in that form. They were flipped to the
> other version once the deploy was confirmed, so the site now says that adding new photographs,
> video and voice recordings is part of membership. Both answers were right when they were given;
> only the fact underneath moved.

* * *
## How to work
- **Voice is binding.** `docs/site-content.md` §Voice and §"Do not write". Plain, warm, specific, unhurried. Short declarative sentences. No exclamation marks. No "revolutionize", "effortlessly", "magical", "unlock", "upgrade", "premium", "pro". Never the word "baby" — the subject is a child. No urgency, no guilt, no countdowns, no invented testimonials. An absent feature is an em dash, never a red X. One test per sentence: would it embarrass you to read in 2040, in the archive it is selling?
  
- **Never hardcode a token.** `PRODUCT`, prices, the prompt count and the store link all come from `site.config.json`; `npm run check` fails on a literal `apps.apple.com` anywhere in `src/`.
  
- **Every content edit is followed by** `npm run build`**.** The Markdown twins (`/pricing.md`, `/llms.txt`, `/llms-full.txt`) are generated from the same rendered bodies. Never hand-edit a twin.
  
- **Edits come in pairs.** Every FAQ answer exists twice — the JSON-LD `acceptedAnswer` and the visible copy. The free and membership cards move together. The blog aside is five identical copies.
  
- **Do not hand-edit generated files:** `src/partials/prompt-library.html`, `marquee-a.html`, `marquee-b.html` come from `npm run prompts`.
  

* * *
## Ground truth — what the app actually does
Verified in the code on Sep 7, 2026. Where the site disagrees with this, the site is wrong.

| Claim | The truth | Source |
|---|---|---|
| Availability | Live on the App Store since Sep 7, 2026. Listing name `PocketChronicle.App`, subtitle "One prompt a day, kept forever", Lifestyle, 4+, iPhone. | The listing |
| Price | Free download. Monthly Membership $5.99, Annual Membership $59.99. One membership per household. | The listing; `site.config.json` |
| The day | **Two prompts.** One is always a question; the second is a mission — photo, video, voice or an activity. **Three at the weekend.** Members also get a weekly mission, a monthly measurement and sealed letters. | `api/src/rascal/services/scheduler.py`; `constants.py` `DAILY_SLOTS`, `SHARED_SLOTS` |
| The trial | 14 days, everything open, no card, nothing to cancel. Server-side only — there is no Apple introductory offer. | `constants.py:112` `TRIAL_DAYS = 14`; `docs/decisions.md` D1 |
| The free tier | **The daily question, and nothing that needs storage.** | `constants.py:326` `FREE_SLOTS = ("question",)` |
| Free photographs | **None, and there never was a cap.** No photo counter or column exists anywhere in `api/src`. | grep of `api/src` |
| Writing | Written and did-it entries need no storage and have no tier gate. | `api/src/rascal/routers/entries.py` — `child_access` only |
| Export | One tap, free on **every** tier, a zip with an offline `index.html` viewer. | `routers/export.py` — no entitlement gate |
| Search | Titles, bodies, captions and transcripts, on every tier. | migration `0004_full_text_search` |
| The recorder | **Up to ten minutes.** Tap to start, tap to pause, a check mark to finish. Not "hold to record". | `ios/.../Media/AudioPipeline.swift:42` `maximumDuration = 10 * 60`; the recorder's own copy reads "Up to ten minutes." |
| Transcription | On-device via `SpeechAnalyzer`, which needs **iOS 26**. The app runs on **iOS 18.6+**; on an older iPhone the recording saves and the transcript does not exist. Never call it Apple Intelligence. | `ios/.../Media/SpeechTranscription.swift` |
| Answering | The prompt decides the gesture: a question opens a text field, a photo mission the camera, a voice mission the recorder, an activity one tap. The + button is where a parent chooses. **The daily question is answered by typing.** | `ios/.../Composer/ComposerView.swift` |
| Filling in the past | Any entry backdates to any day, years back, from the composer's date control. "Look back" walks the camera roll month by month, reading only dates and counts, on the phone, uploading nothing until a photo is picked. | `ios/.../Composer/`, `ios/.../Backfill/` |
| Prompts | 133 in the library: 30 questions; 111 daily, 10 weekly, 12 monthly. | `api/seeds/prompts.yaml` |
| Notifications | One a day at most, at a time you pick, off whenever you want. | `ios/CLAUDE.md` |
| Sign-in | Apple, Google, **or a link sent to an email address added in Settings**. No Facebook login. | `ios/.../Onboarding/` |
| Privacy | No ads on any tier. Zero third-party dependencies — no analytics SDK, no ad SDK, no tracker in the binary. Account deletion waits seven days, then hard-deletes. | `ios/CLAUDE.md` rule 4; `docs/data-model.md` |
| Cold storage at 90 days; three deletion warnings | **Not built.** Phase 38; `media` has no `storage_tier` column. | `api/src/rascal/schemas/family.py`; `docs/api-contract.md` |

* * *
## Site-wide rules
Settle these once and apply them everywhere. They are the reason most of the individual findings exist.

1. MERGE FIRST. Merge origin/claude/app-store-link-integration-5u9sj9 (398eff1) into main and push before any other edit, then branch every fix below off that merge. Confirm with `git merge-base --is-ancestor 398eff1 main`. Pages deploys on push to main, and main still holds the pre-launch copy, so a fix branched off main reverts the launch across 38 files.
  
2. THE FREE TIER IS THE DAILY QUESTION, AND EVERYTHING THAT NEEDS STORAGE IS MEMBERSHIP. State it in that order and in those terms everywhere. Free: the daily question every day forever, search across the whole archive, a full export on every tier, everything already written or captured stays yours, no ads. Membership: the missions, and the photographs, video and voice recordings they ask for — plus the weekly mission, the monthly measurement, the sealed letters and the second parent. Never write "photographs without a limit" or any phrase that only means something against a free cap.
  
3. DELETE FREE_PHOTOS from site.config.json once its 12 render sites are rewritten, and leave a dated note in its place saying why. There is no number that makes it correct: no cap, counter or column has ever existed in api/src, and photographs are membership. Never reintroduce a free-tier quantity the code does not enforce.
  
4. THE VOICE RECORDER IS TEN MINUTES, AND IT IS TAP-TO-START. Anywhere the site states the length, the number is ten minutes; anywhere it describes the gesture, it is tap to start, tap again to pause, a check mark to finish. Never "hold to record", never two minutes.
  
5. TRANSCRIPTION CARRIES ITS CONDITION EVERY TIME IT IS CLAIMED. The formula is: on iOS 26 the phone writes the transcript itself; on an older iPhone the recording is kept and the transcript isn't. The app runs on iOS 18.6 and later. Never state the transcript unconditionally, and never call it Apple Intelligence — transcription is SpeechAnalyzer; only the tags and the personalised prompt need Apple Intelligence.
  
6. THE DAY IS TWO PROMPTS, THREE AT THE WEEKEND. A question always, plus a mission — a photo, a video, their voice, or an activity. Members also get a weekly mission, a monthly measurement and sealed letters. One notification a day at most. "One prompt a day" is the App Store subtitle's shorthand and must not be used as a factual statement of the loop anywhere on the site.
  
7. THE PROMPT DECIDES THE GESTURE; THE READER DOES NOT CHOOSE. A question opens on a text field, a photo mission opens the camera, a voice mission opens the recorder, an activity is one tap of Did it. The + button is where a parent picks for themselves. Never imply the daily question is answered by voice.
  
8. THE ARCHIVE RUNS BOTH DIRECTIONS. Never describe it as starting tomorrow or as needing to be kept "from the start". Any entry backdates to any day, years ago, from the composer's date control, and Look back walks the camera roll month by month to show the months never written about — reading only dates and counts, on the phone, uploading nothing until a photograph is picked.
  
9. NOTHING UNBUILT IS WRITTEN IN THE PRESENT TENSE. The ninety-day move to cold storage and the three-warning removal window are phase 38 and do not exist; delete both wherever they appear and use the privacy page's future-conditional shape if anything is said at all. Cut them across /promise, /, /pricing and /faq in one commit so the four pages never disagree half-way through.
  
10. THE WAITLIST CTA IS ALREADY RETIRED — DO NOT RE-SWEEP IT. The store link is the primary CTA everywhere ({{CTA_APP}} / {{CTA_APP_SUPPORT}}), the daily email at /waitlist is the secondary one ({{CTA}} / {{CTA_SUPPORT}}), and the /waitlist route keeps its name deliberately because it is bookmarked and indexed. Apple's badge artwork appears exactly once, in the home hero. The only surviving waitlist framing is the HTML comment at src/partials/signup.html:1, which ships because build.mjs does not strip comments and check.mjs strips them before its own launch sweep — fix the comment and teach the sweep to read comments.
  
11. THE EMAIL LIST IS LEGITIMATE AND STAYS. Describe it as one prompt a morning from the daily library — a question some days, a mission on others — at 8:00, free, unsubscribe anytime. Never frame it as a way to wait for a launch, and never say it draws from "the whole library": the weekly missions, monthly measurements and sealed letters are filtered out of the send.
  
12. VERIFIED_ON IS FOR COMPETITOR CLAIMS ONLY. Stop rendering it on /faq and /promise, where it dates facts about us; the live App Store listing is the evidence and needs no date. Where a launch date is needed, write "September 7, 2026" — as a literal in those two paragraphs, or via a new LAUNCHED_ON token the way LEGAL_UPDATED was split off. Do not move VERIFIED_ON's value to September to fix this; it would silently restamp two competitor comparisons nobody re-checked.
  
13. THE PRICING TABLE'S FREE COLUMN MUST STAY POSITIVE, AND THE NAIVE FIX BREAKS THE BUILD. check.mjs asserts worded free cells outnumber em dashes. It is 8 worded to 4 dashed today; dashing Voice notes and Photos makes it 6–6 and fails. Add these two rows, both true and both storage-free (the only entitlement gate in the service is on GET /today; moments.py and the backfill flow have none): `<tr><th scope="row">Filling in the past</th><td>Any day, any year</td><td class="is-ours">Any day, any year</td></tr>` and `<tr><th scope="row">Moments — this day in earlier years</th><td>Always</td><td class="is-ours">Always</td></tr>`. Never satisfy the assertion by leaving a false worded cell in place, and keep the worded rows above the dashed ones.
  
14. QUOTE ONLY REAL PROMPTS. Every prompt body shown in library chrome must exist in api/seeds/prompts.yaml verbatim. src/partials/prompt-library.html, marquee-a.html and marquee-b.html are generated by `npm run prompts` and must never be hand-edited.
  
15. PROMPT_COUNT (133) IS THE WHOLE LIBRARY; QUESTION_COUNT (30) IS THE QUESTIONS. Both values are correct and guarded by scripts/prompts.mjs — do not change them. Never put PROMPT_COUNT behind the word "questions", and never call all 133 "daily" (111 are daily, 10 weekly, 12 monthly). If the daily-email count is ever needed, add a guarded DAILY_PROMPT_COUNT token rather than typing 111 into markup.
  
16. THERE ARE THREE WAYS TO SIGN IN: Apple, Google, or a link sent to an email address added in Settings. Say all three wherever sign-in is listed, and keep the "no Facebook login" reason attached.
  
17. VOICE MAKES A FILE. Never group voice notes with written and did-it entries as "things that never made a file" — it is an m4a that has to be stored, which is why it is membership. Written and did-it entries are the two that produce nothing.
  
18. EDITS COME IN PAIRS AND IN ONE COMMIT. Every FAQ answer exists twice — JSON-LD acceptedAnswer and the visible twin — and both need the same edit or the structured data and the page disagree. The free and membership cards on / and the two tiers on /pricing move together; a half-corrected pair reads worse than either version. The blog aside is five identical copies needing five edits. And correcting the site without correcting ios/Rascal/Rascal/Subscription/MembershipCopy.swift:119 leaves the paywall contradicting the pricing page that sent the parent there.
  

* * *
## The mismatches
36 findings, deduped, in priority order. Each names every page it appears on, the copy that is there today, why it is wrong, and paste-ready replacement copy.
### Factually wrong
M2 — site.config.json:75; src/pages/pricing.html:3, :14, :30, :44, :68, :182-191, :275-276; src/pages/index.html:552, :561; src/pages/faq.html:32, :139; src/pages/terms.html:44, :52; src/pages/compare/tinybeans.html:101; src/pages/compare/camera-roll.html:143

**On the site now:**

> "FREE_PHOTOS": "100" — rendered as "{{FREE_PHOTOS}} photographs, and they are yours for good.", "{{FREE_PHOTOS}}, lifetime", "100 photos, lifetime", "Why {{FREE_PHOTOS}} photos is a lifetime number"

**Why it is wrong.** There is no free photo allowance and there never was one in code. FREE_SLOTS is ("question",) and no photo cap, counter or column exists anywhere in api/src. Under the owner's Sep 7 2026 storage rule photographs are membership, so no value of this token is correct. It renders in 12 places across 7 pages; "photographs without a limit" on the membership side only means something against the cap, so those lines go with it.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/constants.py:326 FREE_SLOTS: Final = ("question",); /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Subscription/MembershipCopy.swift:126-130 stayFree; /Users/travis/repos/personal/Project-Rascal/docs/roadmap-status.md:722

**Fix.** Delete the FREE_PHOTOS key from site.config.json after the 12 render sites are rewritten, and leave a `_free_photos_note` in its place: "Retired September 7 2026. There is no free photograph allowance — the free tier is the daily question, and everything that needs storage is membership. No cap was ever built; grep api/src for one and you will not find it." Then, site-wide, drop every free-column photo row (see the table rule) and replace the membership phrasing everywhere it appears: pricing.html:44 → "Photographs, video and their voice — everything that has to be stored somewhere."; index.html:560-561 → "Adds the missions, the photographs, the video, the voice notes and the second parent."; terms.html:52 → "Membership adds the missions, and with them photographs, video, their voice, letters you seal for later, and your child's other parent writing into the same archive. It buys more of the day. It has never bought access to your own archive and it never will."; compare/tinybeans.html:101 → "The daily question, every day, forever. No ads"; compare/camera-roll.html:143 → "— " in the free cell and "No limit with membership" in ours. Delete pricing.html:182-191 whole ("Why {{FREE_PHOTOS}} photos is a lifetime number") — the argument it makes no longer exists and the neighbouring "Why the question is the free part" column reads correctly alone. Replace the pricing.html:275-276 FAQ item with summary "What happens to the photographs I already have?" and answer "They stay exactly where they are — readable, searchable, exportable, on any tier, whether you paid once or never. What membership buys is adding new ones."

M3 — src/pages/pricing.html:3, :14, :29, :67, :121-126, :214-218, :268, :272; src/pages/index.html:552; src/pages/faq.html:32, :139; src/pages/terms.html:44, :138; src/pages/promise.html:80; src/pages/blog/record-your-kids-voice.html:146

**On the site now:**

> Voice notes, as many as you want, two minutes each. / record their voice as often as you like / everything you write, record and already have stays yours / new photo and video uploads pause

**Why it is wrong.** A voice note is an m4a that has to be stored, so under the storage rule it is membership. The free tier is the question slot alone. The site currently promises free recording in the lede, the free column, the comparison table, the meta description, the JSON-LD and the visible FAQ; and where it lists what stops when a membership ends it names photographs and video but not recordings, which reads as a promise that recordings carry on.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/constants.py:326 FREE_SLOTS = ("question",); /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Media/AudioPipeline.swift:37-38 (m4a, audio/m4a); MembershipCopy.swift:126-130

**Fix.** pricing.html:3 description → "description: The daily question is free every day, forever, with unlimited writing and a full export. Membership adds the missions and everything that has to be stored, from {{PRICE_MONTH}} a month." pricing.html:13-15 lede → "Every day, forever, with no card and no end date. You can write as much as you like and take the whole archive out whenever you want it. Membership is what fills in the rest of the day — the missions, and the photographs, video and recordings they ask for." Delete the pricing.html:29 free row; the membership column gains `<li><span class="tick tick--terra" aria-hidden="true">✓</span><span>Their voice, recorded — up to ten minutes at a time, as often as you like.</span></li>`. pricing.html:121-126 → "There is no card on file to charge, so nothing happens when the {{TRIAL}} are up except that the missions become part of membership — along with the photographs, the video and the recordings they ask for — and the daily question carries on the way it always has." pricing.html:268 → "The daily question arrives every day, forever, and everything you have already written and captured stays yours. The missions are the part that's membership." pricing.html:272 → "When it ends, the daily question carries on, and the missions — with the photographs, video and recordings they ask for — become part of membership." faq.html:32 and :139 (both, identically) → "Yes, and it isn't a trial — it has no end date. The daily question arrives every day, forever. Search and a full export, always. Everything you have already written and captured stays yours. The missions are the part that's membership, along with the photographs, video and recordings they ask for." terms.html:44 → "The daily question is free, every day, with no end date and no card. So is search across all of it, and a full export of the entire archive. Anything that needs storage — photographs, video, their voice — is part of membership. That is a commitment rather than a teaser — it has no expiry, it isn't a promotional rate, and we're not holding it open until enough people are inside." blog/record-your-kids-voice.html:146 → "prompt library is public and includes voice missions — recording assignments written for exactly this kind of keeping, and the recorder holds up to ten minutes — free to read and free to use in a notebook or any app you like. In {{PRODUCT}} they're part of membership; the daily question is the free one." For the "uploads pause" sentences at pricing.html:214-218, faq.html:34 and :143, promise.html:80 and terms.html:138, see M17 — do not simply add voice to a sentence describing something no route enforces.

M4 — src/pages/pricing.html:29, :67; src/pages/index.html:552; src/pages/faq.html:32, :42, :139, :171; src/pages/how-it-works.html:123

**On the site now:**

> two minutes each / Voice recordings up to two minutes. / Hold to record, up to two minutes.

**Why it is wrong.** The recorder allows ten minutes, and its own on-screen caption says so. Two minutes is wrong on every tier and in eight places, two of which are JSON-LD that Google may quote.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Media/AudioPipeline.swift:42 `nonisolated static let maximumDuration: TimeInterval = 10 * 60`, with the comment "Ten minutes. At the cap the recording stops and is kept"; ios/Rascal/Rascal/Composer/AudioRecorderSheet.swift:142 "Up to ten minutes."

**Fix.** Anywhere the site states the recorder's length, the number is ten minutes. pricing.html:67 → `<tr><th scope="row">Voice notes</th><td class="none">—</td><td class="is-ours">Up to ten minutes each, as many as you want</td></tr>`, moved below the worded free rows per the comment at :72. Delete pricing.html:29 and index.html:552's voice sentence (they become membership rows, M3). faq.html:42 and :171, how-it-works.html:123 — see M8, whose fix carries the ten-minute number.

M7 — src/pages/index.html:169; src/pages/how-it-works.html:2; src/pages/terms.html:24; src/pages/compare/qeepsake.html:90; src/pages/compare/tinybeans.html:113; src/pages/blog/the-photo-survives.html:180; src/pages/blog/streaks-are-a-bad-idea.html:179; src/pages/blog/record-your-kids-voice.html:190; src/pages/blog/an-archive-they-can-inherit.html:197; src/pages/blog/what-to-write-in-a-keepsake-book.html:190

**On the site now:**

> Three things, once a day / one prompt a day, in context / One card in the app, each morning / It sends one prompt like these every morning, and so does the email if you'd rather

**Why it is wrong.** The day holds two prompts: a question always, plus a mission — one on Monday/Wednesday/Friday, the other pool on Tuesday/Thursday, and both at the weekend. "Three things" is left over from before the rotation; "one prompt a day" and "one card each morning" undercount it. index.html:169's own card underneath already says "One on a weekday, two at the weekend", so the heading contradicts its own section. The blog aside is five identical copies and needs five separate edits.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/services/scheduler.py:402-411 _DAILY_ROTATION and the items-per-day table at :429-445 ("ordinary weekday 2 … Saturday 4 … Saturday, 1st or 15th 5"); api/src/rascal/constants.py:311 DAILY_SLOTS, :317 SHARED_SLOTS

**Fix.** index.html:169 → `<h2 class="t-section">Two things a day. Three at the weekend.</h2>` how-it-works.html:2 → "title: How {{PRODUCT}} works — the daily question and the mission" terms.html:24 → "{{PRODUCT}} is an iPhone app for keeping a private archive about your kid. Every day it asks you a question about them, and gives you a mission to go with it — a photo, a video, their voice, or something to go and do together. It files what you answer — the words, the photographs, the recordings — with the prompt that caused it, so it can still be found in twenty years." compare/qeepsake.html:90 → "Two cards in the app each morning — the question and a mission. Three at the weekend" compare/tinybeans.html:113 → "A question every day on any tier; missions with membership — one on a weekday, two at the weekend, plus a weekly one and a monthly measurement" All five blog asides → "It asks a question about your kid every morning, with a mission alongside it — a photo, their voice, something to go and do. One notification a day at most. The email carries one prompt a morning too, if you'd rather answer on paper:" — except an-archive-they-can-inherit.html:197, whose card above is a sealed letter, where the second sentence becomes "A sealed letter once a month."

M8 — src/pages/faq.html:42, :171; src/pages/how-it-works.html:123

**On the site now:**

> Hold to record, up to two minutes each.

**Why it is wrong.** It is not a hold gesture. The recorder is a tap button that toggles — "Start recording" / "Pause recording" on the same control, with a check mark to finish. A parent told to hold will let go and think it failed. The two-minute cap is wrong as well (M4), and in faq.html:42 this is JSON-LD.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Composer/AudioRecorderSheet.swift:172-198 (Button with "Start recording"/"Pause recording") and :142 ("Up to ten minutes."); Media/AudioPipeline.swift:42

**Fix.** faq.html:42 (JSON-LD) and :171 (visible), both → "Tap to start, tap again to pause, and a check mark when you're done. Up to ten minutes in one recording. On iOS 26 the phone writes a transcript itself, so you can search something you'll never have time to relisten to; on an older iPhone the recording is kept and the transcript isn't." how-it-works.html:123 → "Tap to record, up to ten minutes. Tap again to pause — what you have already recorded is safe either way."

M9 — src/pages/how-it-works.html:17, :97-99

**On the site now:**

> Answer it however it lands — Take a photo, shoot ten seconds of video, record their voice, write two sentences, or just go and do the thing. / Each of these is one tap from the card, and none of them opens a form.

**Why it is wrong.** You do not pick between them; the prompt does. ComposerView switches on the prompt's completion mode — a question is completion_mode text and opens on a text field, a photo mission opens the camera, an audio mission lands straight on the recorder, an activity is one tap of Did it. Voice answers a voice mission or a freeform entry from the + button; it is never how the daily question is answered. The tab row above :97 reads as a menu the reader chooses from, and :17 puts the same error in machine-readable HowTo data.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Composer/ComposerView.swift:189-201 (`switch request.mode` → didIt / media / text); api/seeds/prompts.yaml — every `kind: question` carries `completion_mode: text`

**Fix.** how-it-works.html:17 → `{ "@type": "HowToStep", "name": "Answer it the way it asks", "text": "The prompt decides the gesture. A question opens on a text field, a photo mission opens the camera, a voice mission opens the recorder, and an activity is one tap of Did it." },` how-it-works.html:97-99 → "The fifteen-second claim is a real constraint, not a slogan. You don't choose between these — the prompt does. A question opens on a text field, a photo mission opens the camera, a voice mission opens the recorder, and an activity is one tap. The + button is where you pick for yourself."

M10 — src/pages/index.html:322-323, :395-398; src/pages/how-it-works.html:123-124; src/pages/faq.html:42, :171; src/pages/blog/record-your-kids-voice.html:159, :171; src/pages/compare/qeepsake.html:234; src/pages/privacy.html:128

**On the site now:**

> It's transcribed on your phone, so you can search a recording you'll never have time to relisten to.

**Why it is wrong.** Stated eight times without the condition that decides it. On-device transcription is Apple's SpeechAnalyzer, which is iOS 26; the app's deployment target is 18.6, and the code's own comment calls the no-transcript phone "the majority case today". On those phones the recording saves and is kept, with no transcript and nothing to search. The privacy page additionally collapses three different requirements into one: transcription is SpeechAnalyzer (iOS 26, a downloaded speech model, not Apple Intelligence), while the tags and the personalised prompt are FoundationModels (iOS 26 plus Apple Intelligence hardware) — and the page never states the app's own iOS floor, so a reader cannot tell what their phone will do.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Media/SpeechTranscription.swift:17-20, :53; ios/Rascal/Rascal/Extraction/ExtractedDetails.swift:92; ios/Rascal/Rascal.xcodeproj/project.pbxproj:437 IPHONEOS_DEPLOYMENT_TARGET = 18.6

**Fix.** index.html:322-323 → "On iOS 26 it's transcribed on your phone, so you can search a recording you'll never have time to relisten to. On an older iPhone the recording is saved and kept exactly the same way — it simply has no transcript behind it." index.html:395-398 → "Voice notes recorded on iOS 26 are transcribed on your phone, so a sentence forty seconds into a recording you'll never relisten to is still one search away. On an older iPhone the recording is kept without one." how-it-works.html:123-124 → "On iOS 26 it is transcribed on your phone, so the words are searchable — and either way the audio never leaves for a transcription service. On an older iPhone the recording is saved the same way, without a transcript." faq.html:42 and :171 carry the caveat in the M8 fix. blog/record-your-kids-voice.html:159 → "That's the design {{PRODUCT}} uses: transcribed on the phone, filed with the prompt. Transcription needs iOS 26 — on an older phone the recording is kept and the transcript isn't, and nothing is lost that wasn't going to be." compare/qeepsake.html:234 → "You want voice recordings, transcribed on the phone — on iOS 26 — so they're searchable too." privacy.html:128 → "**Two honest limits on that.** {{PRODUCT}} runs on iOS 18.6 and later. All three of these need iOS 26, and the tags and the personalised prompt need Apple Intelligence on top of that. On a phone that can't do one of them, {{PRODUCT}} simply doesn't — a recording saves without a transcript rather than being sent to a server to be read. And the transcript and the tags, once produced, **are uploaded and stored on our servers as ordinary text**, in the clear, so that search can find them." Leave how-it-works.html:229-230 ("every transcript of something they said") alone — it is true of transcripts that exist and reads correctly beside the caveat above.

M11 — src/pages/faq.html:40, :167

**On the site now:**

> Everything you wrote, every transcript of something they said, and every prompt you were asked.

**Why it is wrong.** Search does not cover prompts. The query runs over four fields: an entry's title and body, and a media row's caption and transcript. Captions are in the index and the answer omits them; prompts are not and the answer promises them.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/models/entry.py:49-56 (ENTRY_SEARCH_VECTOR, MEDIA_SEARCH_VECTOR); api/src/rascal/routers/entries.py:120

**Fix.** faq.html:40 (JSON-LD) and :167 (visible), both → "Everything you wrote, every caption you added, and every transcript of something they said. You aren't searching filenames and dates — you're searching the answers, which is much closer to how you'll actually remember it."

M12 — src/pages/compare/camera-roll.html:65; src/pages/blog/the-photo-survives.html:160; src/pages/blog/what-to-write-in-a-keepsake-book.html:177

**On the site now:**

> all {{PROMPT_COUNT}} of its questions are published / {{PROMPT_COUNT}} questions {{PRODUCT}} asks

**Why it is wrong.** Renders as "133 questions". Counted from the seed: 133 prompts, of which 30 are questions — photo 43, activity 25, audio 12, video 12, letter 8, measurement 3. QUESTION_COUNT (30) is the token that belongs behind the word "questions", and docs/site-content.md §/prompts forbids exactly this phrasing on that page's H1 for the same reason. Both tokens' values are correct and guarded — do not change site.config.json here.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml (133 records, 30 `kind: question`, verified by parse); site.config.json:179-180; scripts/prompts.mjs:380-392 sets process.exitCode = 1 on drift in either token

**Fix.** compare/camera-roll.html:65 → "{{PRODUCT}} asks one a day, and <a href="/prompts">all {{QUESTION_COUNT}} of its questions are published alongside every mission, free to read." blog/the-photo-survives.html:160 → `<a href="/prompts">{{PROMPT_COUNT}} prompts {{PRODUCT}} asks</a> are published, free,` blog/what-to-write-in-a-keepsake-book.html:177 → `<a href="/prompts">all {{PROMPT_COUNT}} of its prompts are published here</a>`

M13 — src/pages/waitlist.html:3, :18, :26, :46; src/pages/prompts.html:110

**On the site now:**

> One real question from the library, by email, every morning, starting tomorrow. / The email draws from the whole library, missions included / one a day comes by email too — the same ones on this page.

**Why it is wrong.** Two errors pulling opposite ways. The send is not questions only: pick_prompt filters `Prompt.cadence == "daily"` across every kind, and only 30 of the 111 daily prompts are questions, so on roughly three mornings in four the email is a photo, voice, video or activity mission. And it is not the whole library either: 22 prompts — 10 weekly and 12 monthly, including the eight sealed letters and the three measurements — never go out, deliberately, because a monthly letter sent daily would misrepresent the product. The page was rewritten from waitlist to daily email around the older belief that the send is a question.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/services/broadcast.py:308, :327 (`Prompt.active.is_(True), Prompt.cadence == "daily"`) and the pick_prompt docstring at :292; api/seeds/prompts.yaml parsed: 111 daily, 10 weekly, 12 monthly

**Fix.** waitlist.html:3 → "description: One prompt from {{PRODUCT}}'s library, by email, every morning — a question some days, a mission on others. Answer it in the app or a notebook. Free." waitlist.html:18 → "One real prompt from the library, by email, every morning, starting tomorrow. A question some mornings, and on the others a photo, their voice, or something to go and do. Answer it in the app, in a notebook, or in your head on the way to school. Free, and not a trial." waitlist.html:26 → "Every prompt is public, so nothing here is on faith —" waitlist.html:46 → "The email draws from the daily prompts in the library, missions included, whatever you end up paying in the app. The weekly missions, the monthly measurements and the sealed letters stay in the app." prompts.html:110 → "Every one of them is in the app, and the daily ones come by email too, one a morning — the same prompts you're reading here. Answer them anywhere. Backdating means nothing you wrote in a notebook is wasted." Do not type 111 into markup: if the owner wants the number stated, it needs a DAILY_PROMPT_COUNT key in site.config.json guarded in scripts/prompts.mjs the same way PROMPT_COUNT and QUESTION_COUNT are.

M14 — src/pages/waitlist.html:76

**On the site now:**

> Tomorrow, 7:00

**Why it is wrong.** The broadcast goes out at 08:00. The job runs hourly and acts only on the send hour, which is 8 in America/Detroit.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/config.py:283-284 broadcast_send_hour: int = 8, broadcast_timezone: str = "America/Detroit"; api/src/rascal/jobs/broadcast.py:48

**Fix.** Tomorrow, 8:00

M21 — src/pages/thanks.html:17 and its opening comment; src/pages/unsubscribed.html:26, :33; scripts/check.mjs:605; docs/site-content.md §Sitemap

**On the site now:**

> You're on the list. / Unsubscribed. / Your address stays on a do-not-email list so that a future signup form can't put you back by accident. That list is the reason the unsubscribe sticks.

**Why it is wrong.** Neither page can be reached. The subscribe confirmation redirects to the home page with ?confirmed=1 and site.js:846 draws the banner there; the daily email's unsubscribe is Resend's own token by design, so an unsubscribe lands on Resend's page. Nothing on the site links to either route, yet both still describe themselves as landing pages in their opening comments. /unsubscribed additionally describes a mechanism that does not exist: there is no do-not-email list of ours, the flag is Resend's, and a future signup plus one click on the confirmation link flips it back — confirm_contact PATCHes unsubscribed: false with no suppression check. The page's own last paragraph ("you can sign up again") already contradicts its middle one.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/routers/subscribe.py confirm() → RedirectResponse(f"{site}/?confirmed=1", 303); config.py:249; api/src/rascal/services/marketing.py add_contact()/confirm_contact(); api/src/rascal/services/broadcast.py UNSUBSCRIBE_TOKEN; api/src/rascal/models/email_broadcast.py ("there is no `subscribers` table, none may be created"); site-live/src/assets/site.js:846; scripts/check.mjs:605

**Fix.** Owner picks per page (see owner decisions), and whichever way, the false mechanism goes first. If /unsubscribed is kept, :33 → "You stay unsubscribed until you ask to come back. Signing up again takes the form and a click on the confirmation link — nothing happens by accident, and nothing happens without you. If you'd rather your address were off the list entirely rather than marked unsubscribed, <a href="mailto:{{SUPPORT_EMAIL}}">ask us and we'll remove it." If either page is deleted: drop '/thanks' from the ROUTES list at scripts/check.mjs:605 and remove the route from the sitemap in docs/site-content.md. Do not move the do-not-email paragraph to /privacy as written — the honest version above is the one that travels.

M26 — src/pages/compare/camera-roll.html:163

**On the site now:**

> Written, voice, and did-it entries

**Why it is wrong.** The row is headed "Things that never made a file", and a voice note makes a file — an m4a that has to be stored, which is the whole reason voice sits inside membership. Written and did-it are the two that produce nothing.

**Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Media/AudioPipeline.swift:37-38 (fileExtension "m4a", contentType "audio/m4a"); api/src/rascal/constants.py:233 MEDIA_KINDS includes "audio"

**Fix.** Written and did-it entries

M36 — (cross-repository) /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Subscription/MembershipCopy.swift:119; /Users/travis/repos/personal/Project-Rascal/api/seeds/email_copy.yaml

**On the site now:**

> "Video, and photographs without a limit" (MembershipCopy.swift:119); "That's the whole idea behind Vellum" (email_copy.yaml)

**Why it is wrong.** Two stale strings downstream of this site's fixes. The paywall a parent reaches after downloading carries the identical "photographs without a limit" phrasing written against the free cap that never existed — correct the site and not the app, and the paywall contradicts the pricing page that sent them there. Separately, the welcome email a new subscriber gets still uses "Vellum", the name retired on Aug 27 2026; the site has been renamed twice since. Neither is a site edit; both are the same fact told wrong somewhere a reader will see it.

**Source of truth.** ios/Rascal/Rascal/Subscription/MembershipCopy.swift:119 against its own correct stayFree list at :126-130; api/seeds/email_copy.yaml

**Fix.** Hand to whoever owns the app repository, alongside the M2/M3 site commit. MembershipCopy.swift:119 → "Photographs, video and their voice — everything that has to be stored somewhere." And replace "Vellum" in email_copy.yaml with the token the app repo uses for the product name. The site cannot fix either, but the site's correction is only half-true until they land.
### Stale (pre-launch)
M1 — (repository, not a page) — deployed tree is a detached worktree at 398eff1; .github/workflows/pages-actions.yml:29

**On the site now:**

> 398eff1 Ship the App Store link sitewide and retire the waitlist framing

**Why it is wrong.** Verified: `git branch -a --contains HEAD` returns only remotes/origin/claude/app-store-link-integration-5u9sj9; `git merge-base --is-ancestor HEAD main` is false; main is at 8f75cb4 and origin/main at 6df36d9, both carrying the pre-launch copy (waitlist eyebrow, "in private testing and opening soon", "Ships with the App Store launch", no APP_STORE_URL). `git diff --stat origin/main HEAD` = 38 files, 589 insertions. Pages deploys on every push to main, so the next commit to main reverts the live site to pre-launch copy — including every fix in this list if it is branched off main.

**Source of truth.** git log/branch/merge-base as above; .github/workflows/pages-actions.yml:29 (`on: push: branches: [main]`)

**Fix.** No copy change. Before any edit: merge origin/claude/app-store-link-integration-5u9sj9 into main, push, and confirm `git merge-base --is-ancestor 398eff1 main` succeeds. Branch every fix below off that merge commit. Until it lands, treat main as a live revert waiting for a push.

M5 — src/pages/faq.html:54, :207; src/pages/promise.html:171; src/pages/compare/tinybeans.html:236

**On the site now:**

> As of {{VERIFIED_ON}}: {{PRODUCT}} is iPhone only. There is no Android app, no web app, and no printed books. It is new on the App Store

**Why it is wrong.** VERIFIED_ON renders August 17, 2026 — three weeks before the app was on the App Store. site.config.json's own note (:196-207) says the token is the competitor-claim re-check date and nothing else. Four sentences use it to date facts about us, one of which ("new on the App Store") was false on that date. Moving the token to September 7 would silently restamp the Tinybeans and Qeepsake claims nobody re-checked, so the token must not move.

**Source of truth.** site.config.json:192 VERIFIED_ON = "August 17, 2026" and the note at :196-207; [https://apps.apple.com/us/app/pocketchronicle-app/id6800155810](https://apps.apple.com/us/app/pocketchronicle-app/id6800155810)

**Fix.** Stop rendering VERIFIED_ON for our own availability; the live listing is the evidence and needs no date. faq.html:54 (JSON-LD) and :207 (visible), both → "Not today. {{PRODUCT}} is on the App Store for iPhone, and there is no Android app and no web app. We'd rather say that plainly than hint at a roadmap we can't promise." promise.html:171 → "A trust page that only lists strengths isn't one. {{PRODUCT}} is iPhone only. There is no Android app and no web app. There is no printed book. It arrived on the App Store on September 7, 2026, so there is very little history behind it — and there are no reviews and no testimonials on this site, nor will there be invented ones, which for a product selling trustworthiness is the single unrecoverable mistake." compare/tinybeans.html:236 → "{{PRODUCT}} is iPhone only. There is no Android app, no web app, and no printed books. It arrived on the App Store on September 7, 2026, so it has almost no reviews behind it — and there are no testimonials on this site, because inventing them would be worse than not having them. It's built by one person; Tinybeans is an established company that has run this category for years." If the owner would rather not have the date as a literal in two paragraphs, add LAUNCHED_ON = "September 7, 2026" to site.config.json the way LEGAL_UPDATED was split off, and leave VERIFIED_ON for competitors only. Do not change VERIFIED_ON's value here.

M6 — src/partials/signup.html:1

**On the site now:**

> And as a second edit: teach the LAUNCH_BANNED sweep to run over comments too, or it will keep certifying pre-launch phrasing it cannot see.
> 
> ### Promise not built
> 
> M15 — src/pages/promise.html:86; src/pages/index.html:474-477; src/pages/pricing.html:222-227; src/pages/faq.html:34, :143
> 
> **On the site now:**
> 
> > After ninety days, original photos move to cheaper cold storage: thumbnails stay instant, search still works, and pulling a full-resolution original back takes about an hour.
> 
> **Why it is wrong.** Nothing implements it. `media` has no `storage_tier` column, the archive-tier move at 90 days lapsed is phase 38, and the API reports the constant "hot" rather than a read. There is no cold-storage path, no restore path and no hour-long retrieval. The "thumbnails stay instant" half cannot be true at all — services/media.py sets thumb_key=None. The privacy page and the terms page already carry the correct future-tense version of the same policy, so the site contradicts itself on its own trust page, and /waitlist:90 summarises it as "nothing deleted unless you ask", which is the accurate line.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/schemas/family.py:231-235 ("A constant `hot` today … phase 38, `media` has no `storage_tier` column yet … It is not a read."); docs/api-contract.md:2286-2287; site-live/src/pages/privacy.html:196-228 and terms.html:107-149
> 
> **Fix.** Cut it in one commit across all five sites so the pages never disagree half-way through. index.html:474-477 — delete the cold-storage sentence; the paragraph ends at the preceding sentence. pricing.html:222-227 — delete the whole "After ninety days, photos get cheaper to store" card, heading and rule; the section reads correctly with three cards. promise.html:86 — replace the heading and its paragraph with the privacy page's shape. Heading: "Nothing ages out today". Body: "Stopping paying doesn't start a clock on your photographs, video or recordings. An archive that has been both unpaid and unopened for years costs money to store, and we expect to eventually move older originals to slower storage — never text, and never before this page says so. None of that is built, so none of it is written here as though it were." faq.html:34 (JSON-LD) → "The full version is on the promise page." faq.html:143 (visible) → `<a href="/promise">The full version is on the promise page.</a>` Bring the sentence back on the day phase 38 ships, with the real retrieval time in it.
> 
> M16 — src/pages/promise.html:101; src/pages/index.html:480-483; src/pages/pricing.html:232-236
> 
> **On the site now:**
> 
> > you get warned three times — ninety days out, thirty days out, seven days out — each with a free one-click export of the whole archive. Sign in once during that window and it's cancelled outright. If we can't reach you, we keep it.
> 
> **Why it is wrong.** There is no media-removal path for a lapsed archive and therefore no warning schedule: no 90/30/7-day job, no warning email, no cancel-on-sign-in for this trigger. `lifecycle_notices` and `lifecycle_notice_deliveries` were specified in data-model.md and never migrated. (The site's S3 delete capability does exist — s3.delete_objects, called from services/deletion.py:437 — but only for user-requested account deletion, a different trigger with a different clock. Cancel-on-sign-in is built for that one alone.) This is a safeguard a reader cannot hold anyone to.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/schemas/family.py:231-235; no warning-email service under api/src/rascal/services/; api/src/rascal/services/deletion.py:224, :437 (account-deletion path only); site-live/src/pages/privacy.html:214-228 and terms.html:108-128, which already record this
> 
> **Fix.** Same commit as M15. index.html:480-483 → "**We never delete a word you wrote unless you ask us to.** The export is free on every tier and always one tap away, so the whole archive is yours to take at any point." pricing.html:232-236 — delete the paragraph; keep the heading above it, which is the owner-approved sentence and is true, and put one built fact under it: "Asking us to is the one thing that does delete an archive. It waits seven days, and signing in during that week calls it off." promise.html:101 → "If we ever need to age out media from an archive that has been both unpaid and unopened for years, this page changes first, you get an email and a free export of the whole archive before it could apply to you, and signing in once cancels it. It will never touch a word you wrote. None of that is built today, and we would rather say so than describe a safeguard you can't yet hold us to." Leave /waitlist:90 ("nothing deleted unless you ask") as written — after this edit it agrees with /promise.
> 
> M17 — src/pages/pricing.html:214-218; src/pages/faq.html:34, :143; src/pages/promise.html:80; src/pages/terms.html:138; src/pages/index.html:477
> 
> **On the site now:**
> 
> > The missions go back to being part of membership, and new photo and video uploads pause.
> 
> **Why it is wrong.** Nothing in the API stops a free household uploading. The only entitlement gate in the service is on GET /today, which decides which prompt slots a household is served (routers/today.py:113-115 via locked_slots_for). The media routes gate on guardian role alone — entry_access_from_body("parent") and media_access("parent") — so a lapsed household can still create media rows and upload bytes. The sentence describes an intent, not a behaviour. Do not simply add voice notes to it (M3) while it still promises something no route does.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/routers/media.py:41-138 (only entry_access_from_body / media_access; no access_for, no is_member); api/src/rascal/routers/today.py:108-118 is the sole tier gate; api/src/rascal/routers/moments.py has no gate at all
> 
> **Fix.** Owner's call between two, and whichever is chosen must land on all six sites at once (see owner decisions). If the gate is built first: "The missions go back to being part of membership, and new photographs, video and voice recordings pause." If it is not built: say only what is true — "The missions go back to being part of membership. Everything already in the archive stays exactly where it is." and delete the upload clause everywhere. terms.html:138 currently says the missions are "the whole of what changes", which is the honest version if the gate does not exist and the wrong version if it does — it moves with the rest.
> 
> ### Minor
> 
> M18 — src/pages/index.html:454-455; src/pages/faq.html:50, :199; src/pages/promise.html:45
> 
> **On the site now:**
> 
> > Sign in with Apple, or Google. There is no Facebook login
> 
> **Why it is wrong.** There is a third way in and the site names two. A parent can add an email address in Settings and sign in from a link sent to it — the credential provider, the route, the sheet and the onboarding screen all ship. /privacy lists all three; /promise, whose job is completeness, lists two.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Settings/CredentialsSheet.swift:130-200 ("Add an email address", "check your email for the link"); ios/Rascal/Rascal/Onboarding/SignInLink.swift; api/src/rascal/services/email_sign_in.py; api/src/rascal/constants.py CREDENTIAL_PROVIDERS includes "email"
> 
> **Fix.** index.html:454-455 → "Sign in with Apple, with Google, or with a link sent to your email. No Facebook login" faq.html:50 (JSON-LD) and :199 (visible), both → "With Apple or Google, or with a link sent to an email address you add in Settings. There is no Facebook login — routing a private record of a child through an ad company contradicts the thing being sold." promise.html:45 → "Sign in with Apple, with Google, or with a link sent to your email address. There is no Facebook login, because routing a private record of a child through an ad company contradicts the thing being sold."
> 
> M19 — src/pages/waitlist.html:78; src/pages/thanks.html:26; src/pages/404.html:23; src/pages/prompts.html:52; src/pages/blog/record-your-kids-voice.html:72; src/pages/blog/an-archive-they-can-inherit.html:156
> 
> **On the site now:**
> 
> > What did they say today that you want to remember? / What are they pretending to be this week? / Don't correct the words they say wrong. / Seal it until a birthday you choose.
> 
> **Why it is wrong.** Six prompt cards quote bodies that are not in the library, each drawn in library chrome with a kind chip and, in four cases, under a sentence promising that every prompt is published and checkable. A reader who filters /prompts cannot find them. The site's own strongest claim is that the library is public; invented cards are the cheapest way to break it.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml (all 133 bodies checked); rendered at src/partials/prompt-library.html:52, :82, :292, :552
> 
> **Fix.** waitlist.html:78 and 404.html:23 → `<p class="promptbox__body">What did they say this week that you want to remember exactly?</p>` thanks.html:26 → `<p class="promptbox__body">What&rsquo;s their answer to &quot;what do you want to be when you grow up&quot; &mdash; this week's version?</p>` prompts.html:52 → `<em>&ldquo;What's their answer to &lsquo;what do you want to be when you grow up&rsquo; &mdash; this week's version?&rdquo;</em> is as good at nine as at four` blog/record-your-kids-voice.html:72 → `<p class="promptbox__body">Record them telling you a story. Any story. Don&rsquo;t correct a single word.</p>` blog/an-archive-they-can-inherit.html:156 → `<p class="promptbox__body">Write them a letter about exactly who they are right now. They won&rsquo;t be this person next year.</p>` Note that src/partials/marquee-a.html and marquee-b.html are generated by scripts/prompts.mjs and were checked card by card — every body in them matches the seed, so they need no edit and must never be hand-edited.
> 
> M20 — src/pages/how-it-works.html:41-44 and :193-197; src/pages/index.html:403-406; src/pages/compare/camera-roll.html:101; src/pages/faq.html ("My kid is seven. Is it too late?")
> 
> **On the site now:**
> 
> > It starts tomorrow morning and runs to the morning they turn eighteen. / An archive you can hand over has to be kept separately, on purpose, from the start.
> 
> **Why it is wrong.** Incomplete rather than false, and incomplete on the pages where it costs most. Any entry backdates to any day, years ago, from the composer's date control, and the app also ships Look back, which walks the camera roll month by month and shows the months never written about — reading only dates and counts, on the phone, uploading nothing until a photograph is picked. Forward-only framing on /compare/camera-roll turns the site's strongest answer into a concession, and the FAQ's "is it too late" answer never mentions Look back at all.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/ios/Rascal/Rascal/Backfill/ — BackfillScanner.swift, BackfillSuggestionsScreen.swift:3, :51, BackfillMonthPickerScreen.swift, AddToArchiveSheet.swift:64, BackfillScan.swift:1-13; ios/Rascal/Rascal/Composer/ComposerView.swift:116 (_occurredAt / dateWasChosen)
> 
> **Fix.** how-it-works.html:41-44 → "So here is how it actually goes — laid out the way {{PRODUCT}} lays out everything: on a timeline. It runs from tomorrow morning to the morning they turn eighteen, and backwards over every month that already happened." Add to the backdating scene at how-it-works.html:193-197: "Look back walks your camera roll month by month and shows you the months with photographs and nothing written. It reads dates and counts on your phone and uploads nothing until you pick one." Add to the end of index.html:403-406: "And Look back walks your camera roll month by month, showing you the months you have never written about. It reads dates and counts on your phone and uploads nothing until you pick a photograph." compare/camera-roll.html:101 → "The good parts are in there, mixed with everything else in your life, and separating them out is a project. An archive you can hand over has to be kept separately, on purpose — though not necessarily from the start. Any entry backdates to the day it actually happened, and Look back walks your camera roll month by month to find the months you never wrote about. It reads dates and counts on the phone and uploads nothing." Add a table row to compare/camera-roll: `<tr><th scope="row">Filling in the past</th><td>Everything, in the order you took it</td><td class="is-ours">Look back finds the months you never wrote about</td></tr>` Add to the FAQ's "My kid is seven" answer, both the JSON-LD and the visible copy: "And Look back walks your camera roll month by month to show you the months with photographs and nothing written — on your phone, reading only dates and counts, uploading nothing until you pick one."
> 
> M22 — src/pages/index.html:208-209, :317-320; src/pages/how-it-works.html:17
> 
> **On the site now:**
> 
> > shoot ten seconds of video / Some missions ask for ten seconds of audio — a song they're mangling, how they say a word wrong, what they think a job is.
> 
> **Why it is wrong.** No video mission asks for ten seconds — the briefest asks for thirty, and most ask for a whole take (the bedtime routine start to finish, an interview of ten questions). No audio mission names a length except "Record two minutes of dinner", and the recorder holds ten minutes. "What they think a job is" is not a prompt in the library.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml — the twelve `kind: video` and twelve `kind: audio` bodies; ios/Rascal/Rascal/Media/AudioPipeline.swift:42
> 
> **Fix.** index.html:208-209 → "Take a photo, film thirty seconds, record their voice, or just go do something —" index.html:317-320 → "Some missions ask for their voice — them singing, whatever they're singing; them telling a joke; two minutes of dinner with nobody announcing it. The recorder holds up to ten minutes." how-it-works.html:17 is rewritten by M9, which removes the ten-second video from the HowTo data.
> 
> M23 — src/pages/index.html:218-219; src/pages/how-it-works.html:163-164
> 
> **On the site now:**
> 
> > a measurement mission lands monthly — height, hand, foot, the things you'll want a number for later.
> 
> **Why it is wrong.** The monthly slot is not guaranteed to be a measurement. Its SlotSpec draws from every mission kind, and the monthly pool is four prompts: three measurements and one that sends you back through your camera roll to this month last year.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/services/scheduler.py:76-79 (monthly SlotSpec, kinds=MISSION_KINDS); the four non-letter `cadence: monthly` records in api/seeds/prompts.yaml
> 
> **Fix.** index.html:218-219 → "Bigger missions land weekly; once a month something asks for a number — height, hand, foot — or sends you back through this month last year in your camera roll." how-it-works.html:163-164 → "Once a month something asks for a number — height, hand, foot, the things you'll want on a chart later and will never reconstruct from memory — or sends you back through this month last year in your camera roll."
> 
> M24 — src/pages/how-it-works.html:162-163
> 
> **On the site now:**
> 
> > Once a week something slightly bigger lands — film the bedtime routine start to finish, one take.
> 
> **Why it is wrong.** That prompt is not the weekly one. "Film the bedtime routine start to finish, one take." is `cadence: daily`, a video prompt served in the mission_b slot on a Tuesday or Thursday. The weekly slot fires on Saturdays and its pool is ten prompts: nine activities and one interview video.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml (that record is cadence: daily); api/src/rascal/services/scheduler.py:449-450 (weekly fires on Saturday); the ten `cadence: weekly` records
> 
> **Fix.** Once a week something slightly bigger lands — take them somewhere neither of you has been, or build something together that needs more than one sitting.
> 
> M25 — src/pages/how-it-works.html:56 and :61 (body at :60-64)
> 
> **On the site now:**
> 
> > Tomorrow · 7:00 a.m.
> 
> **Why it is wrong.** The prompts are written at 5 a.m. in the child's timezone, so the card genuinely is there in the morning — but the one notification defaults to 7 p.m., chosen so the question gets answered in conversation over dinner. The scene stamps a morning notification the app does not send by default, with "One notification, at a time you pick" sitting directly under it.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/constants.py:367 DEFAULT_NOTIFY_LOCAL_TIME = dt.time(19, 0); ios/Rascal/Rascal/Push/NotifyTime.swift:18; api/src/rascal/services/scheduler.py SCHEDULER_LOCAL_HOUR = 5
> 
> **Fix.** Keep the morning heading and say what the notification actually does. Replace the body at :60-64 with: "The day's prompts are written before you wake up. One notification carries them, at a time you pick — seven in the evening unless you change it. Open it and there is the day's question — and, with membership, a mission beside it. Not a feed, not a dashboard, not eleven things you're behind on."
> 
> M27 — src/pages/pricing.html:239
> 
> **On the site now:**
> 
> > **We have never deleted a word a parent wrote.**
> 
> **Why it is wrong.** The owner replaced this exact sentence on Aug 17 2026 with the form at the heading three lines above it, because a reader who has just deleted their own account should not have to reconcile it. The page now carries both the approved wording and the one it replaced.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/docs/decisions.md open item 14(c) — reworded rather than kept, replacement approved Aug 17 2026
> 
> **Fix.** Delete the line. The heading at :231 already says it in the approved form.
> 
> M28 — src/pages/faq.html:68-71
> 
> **On the site now:**
> 
> > Where something isn't built yet — the Android app, the printed book, the handover to a grown child — this page says so instead of talking around it.
> 
> **Why it is wrong.** The page names three unbuilt things and answers one. There is no printed-book question anywhere on the page and no occurrence of the word "book". Meanwhile two things that genuinely are not built — the ninety-day cold storage and the removal warnings — are linked from this page as though they were (fixed in M15/M16).
> 
> **Source of truth.** grep of src/pages/faq.html for "book" returns nothing; api/src/rascal/schemas/family.py:231-235
> 
> **Fix.** Short answers, grouped by subject. Where something isn't built yet — the Android app, the printed book — this page says so instead of talking around it. Then add an item under "The archive", in both the JSON-LD and the visible list: summary "Is there a printed book?", answer "Not yet. The export is the object that exists today — a zip you can hold onto and hand over. A printed book is something we want to make and have not made."
> 
> M29 — src/pages/prompts.html:14
> 
> **On the site now:**
> 
> > "description": "All {{PROMPT_COUNT}} daily prompts — questions, photo and video missions, voice recordings, activities, letters and monthly measurements.",
> 
> **Why it is wrong.** 22 of the 133 are not daily — 10 weekly and 12 monthly. The sentence contradicts itself, calling all 133 daily and then listing the monthly measurements. It is the machine-readable copy a crawler reads.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml, parsed: 111 daily, 10 weekly, 12 monthly
> 
> **Fix.** "description": "All {{PROMPT_COUNT}} prompts — questions, photo and video missions, voice recordings, activities, sealed letters and monthly measurements.",
> 
> M30 — src/pages/blog/what-to-write-in-a-keepsake-book.html:69
> 
> **On the site now:**
> 
> > the questions below work from one to twelve
> 
> **Why it is wrong.** Wrong at both ends against the library this page sends readers to. min_age_months is 24 at the lowest, so nothing is written for a one-year-old, and max_age_months reaches 216 — /prompts has an Ages 13+ band.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml (min 24, max 216); the bands in site-live/scripts/prompts.mjs (2–3, 4–5, 6–8, 9–12, 13+)
> 
> **Fix.** the questions below work from two to the teens
> 
> M31 — site.config.json:192 against the evidence comments at src/pages/compare/tinybeans.html:43, 68, 96, 102, 108, 114, 120, 126, 132, 138 and src/pages/compare/qeepsake.html:29, 77, 85, 92, 100, 109, 116, 123, 131, 139
> 
> **On the site now:**
> 
> > Tinybeans figures verified {{VERIFIED_ON}} · re-checked quarterly
> 
> **Why it is wrong.** VERIFIED_ON renders August 17, 2026, but every source comment backing the competitor claims on both compare pages is dated 2026-08-15. The published check date is two days ahead of any evidence in the repository. Separate from M5, which is about the token being used for our own availability.
> 
> **Source of truth.** site.config.json:192; the twenty inline `verified 2026-08-15` comments listed above
> 
> **Fix.** Set VERIFIED_ON to "August 15, 2026" in site.config.json so the date matches its sources, or re-check the Tinybeans and Qeepsake figures and move the token and all twenty comments together in one commit. The rendered lines need no rewording.
> 
> M32 — src/pages/index.html:681; src/pages/index.html:178-186
> 
> **On the site now:**
> 
> > …and 130 more after that.
> 
> **Why it is wrong.** Two small durability defects on one page. (a) 130 is a hardcoded literal derived from PROMPT_COUNT minus the three cards shown. It is correct today (133 − 3) and nothing checks it; the prompts.mjs guard covers only the two tokens, so it goes stale silently the day a prompt is added. (b) The deck's filter row offers All / Questions / Photo / Voice / Video / Activity / Letters with no Measurement button, while scripts/prompts.mjs:338 deals a measurement card into the deck with its own sage label — a reader who filters by every named kind never reaches one of the cards in front of them.
> 
> **Source of truth.** site-live/scripts/prompts.mjs:338 and the token guard at :380-392; site.config.json:179-180
> 
> **Fix.** Convert the literal to a token or add a third assertion to scripts/prompts.mjs: if the rendered home page's "and N more" does not equal PROMPT_COUNT minus the deck's card count, set process.exitCode = 1. And add a Measurement button to the filter row at index.html:178-186 so every kind in the deck is reachable.
> 
> ### Needs an owner decision
> 
> M33 — src/pages/pricing.html:28, :66; src/pages/index.html:551; src/pages/promise.html:79; src/pages/terms.html:44, :136; src/pages/compare/tinybeans.html:191
> 
> **On the site now:**
> 
> > As many written entries and _did it_ entries as you want. / text and did-it entries never stop / written and _did it_ entries carry on without a limit
> 
> **Why it is wrong.** Written and did-it entries need no storage, so the Sep 7 storage rule does not settle them, and the code does not either: FREE_SLOTS governs which prompt slots a day serves, not what a person may write from the + button, and routers/entries.py has no entitlement check. docs/decisions.md D3 says a free household keeps unlimited text and did_it entries, but the shipped paywall's stayFree list does not mention them. Seven places on five pages assert it, and they must all move together or the site will contradict itself.
> 
> **Source of truth.** /Users/travis/repos/personal/Project-Rascal/api/src/rascal/constants.py:326 FREE_SLOTS = ("question",); api/src/rascal/routers/entries.py (no tier gate); docs/decisions.md D3; ios/Rascal/Rascal/Subscription/MembershipCopy.swift:126-130 (does not list them)
> 
> **Fix.** Blocked on the owner. If they stay free: leave all seven lines as written, and add them to MembershipCopy.swift's stayFree list so the app and the site agree. If they do not: pricing.html:28 → "As many written entries as you want, on the day's question or any day you go back to."; pricing.html:66 free cell becomes an em dash and the row moves down with the others; index.html:551 — delete the sentence, leaving "A question about your kid every day, forever. Search and a full export, always."; promise.html:79 → "You keep answering the daily question, every day, with nothing to renew."; terms.html:44 — drop the clause so the sentence reads "So is search across all of it, and a full export of the entire archive."; terms.html:136 → "**The daily question never stops.** It keeps arriving every day, whether you pay or not."; compare/tinybeans.html:191 → "The whole archive stays readable, the daily question never stops, and the complete export stays free — forever, including the offline viewer." Ship neither version until the owner has said which.
> 
> M34 — site.config.json:57; every store CTA site-wide (header.html:69, footer, and the {{CTA_APP}} pill on all 21 pages)
> 
> **On the site now:**
> 
> > "PRODUCT": "Pocket Chronicle",
> 
> **Why it is wrong.** The App Store listing name is "PocketChronicle.App". Every store CTA on the site says one name and lands on a page headed another. This is not necessarily an error — Apple's name field is often the domain-styled one — but the site never acknowledges the difference, so a parent searching the store for the name they read here may not find it.
> 
> **Source of truth.** [https://apps.apple.com/us/app/pocketchronicle-app/id6800155810](https://apps.apple.com/us/app/pocketchronicle-app/id6800155810) — listing name "PocketChronicle.App", subtitle "One prompt a day, kept forever"
> 
> **Fix.** Owner's call. Either rename the App Store listing to "Pocket Chronicle" so the two agree, or leave PRODUCT alone and add one line under the store button on /pricing: "On the App Store it's listed as PocketChronicle.App." Do not hardcode either name in markup — CLAUDE.md forbids it and npm run check fails on a literal.
> 
> M35 — site.config.json:176 (assembled into the Organization sameAs, so it renders in JSON-LD on every page)
> 
> **On the site now:**
> 
> > "SOCIAL_INSTAGRAM": "[https://www.instagram.com/pocketchronicle.app](https://www.instagram.com/pocketchronicle.app)",
> 
> **Why it is wrong.** The file's own _social_note (:154-173) records that this string has never been opened and confirmed, that instagram.com returns 200 for handles that do not exist, and that the posting path addresses its target by numeric id so nothing in the repository can corroborate it. It is nevertheless published in machine-readable sameAs telling crawlers that profile is this product.
> 
> **Source of truth.** site.config.json:154-173 _social_note — "It has NOT been opened and confirmed from here… the weakest-evidenced string in this file"
> 
> **Fix.** A person opens the URL signed out and confirms the account is ours and has posts. If it resolves, add a dated line to _social_note recording who checked it and when. If it does not, delete the key and the footer column with it — the note already records why a bare platform link is worse than none.
> 
> * * *
> 
> ## Questions only you can answer
> 
> Nothing in this group ships until it is answered.
> 
> 1. Do written entries and did-it entries stay free forever — yes or no? They need no storage, so the Sep 7 storage rule does not settle them, routers/entries.py has no tier gate, docs/decisions.md D3 says yes, and the shipped paywall's stayFree list does not mention them. Yes: leave all seven site lines as written and add them to MembershipCopy.swift's stayFree list so the app agrees. No: seven edits across /pricing (×2), /, /promise, /terms (×2) and /compare/tinybeans, all in one commit, and the pricing table's free column loses another worded cell (see the table rule). Nothing on this ships either way until you answer.
>   
> 2. **[Corrected after the audit — read this before answering.]** The auditors read `main`, where no upload gate exists. It does exist: phase 147 built it on `origin/api/phase-147-api`, unmerged and undeployed (see _Do these two things_, item 2). So the real question is not whether to build it but **when to merge and deploy it**, and the site copy should ship in that same window. The original finding, kept because its copy options are still the right ones: _Pick one: build the free-tier upload gate, or stop saying uploads pause. Nothing in the API stops a lapsed household uploading — media.py gates on guardian role alone and the only tier gate in the service is GET /today. Build it: the six "uploads pause" sentences become "…and new photographs, video and voice recordings pause." Don't build it: delete the upload clause from all six and say only "The missions go back to being part of membership. Everything already in the archive stays exactly where it is." Adding voice notes to a sentence no route enforces makes the claim bigger and still false._
>   
> 3. Rename the App Store listing to "Pocket Chronicle", or add a line to the site? The listing is "PocketChronicle.App" and every store CTA on the site says "Pocket Chronicle". Rename: the two agree and no copy changes. Keep: add one line under the store button on /pricing — "On the App Store it's listed as PocketChronicle.App." Doing neither means a parent searching for the name they read here may not find it.
>   
> 4. /thanks: delete it, or point the confirmation redirect at it? Nothing reaches it today — subscribe.py redirects to /?confirmed=1 and site.js:846 draws the banner there. Delete: also drop '/thanks' from scripts/check.mjs:605 and from the sitemap in docs/site-content.md. Keep: change the redirect in subscribe.py. What cannot stay is a page whose opening comment says "Where the confirmation link lands" when it lands somewhere else.
>   
> 5. /unsubscribed: delete it, or give it a way in? Resend owns the unsubscribe token by design, so an unsubscribe lands on Resend's page and nothing links here. Either way, the do-not-email paragraph at :33 is wrong as written and must not be moved to another page unedited — there is no list of ours, and a re-signup plus one confirmation click flips the flag back.
>   
> 6. Has anyone opened [https://www.instagram.com/pocketchronicle.app](https://www.instagram.com/pocketchronicle.app) signed out and confirmed the account is ours with posts on it — yes or no? Yes: add a dated line to _social_note recording who and when. No: delete SOCIAL_INSTAGRAM and the footer column, because it is currently published in Organization sameAs as a machine-readable claim nothing in the repository can corroborate.
>   
> 7. Change the App Store subtitle, or accept that the site and the listing describe the day differently? The listing says "One prompt a day, kept forever"; the scheduler serves two, three at the weekend. The site's fixes follow the code. If you would rather they match, the subtitle is the one thing to change — it is the surface a reader can check against the app in ten seconds, and changing it is cheaper than five blog pages plus /how-it-works.
>   
> 8. Is VERIFIED_ON's value August 17 or August 15? Every evidence comment behind the Tinybeans and Qeepsake claims is dated 2026-08-15, so the published check date is two days ahead of its sources. Set it to August 15 (no re-check needed, no rewording), or re-check both competitors now and move the token and all twenty comments in one commit.
>   
> 
> * * *
> 
> ## Verification
> 
> 1. Confirm the merge landed before anything else: `cd /Users/travis/repos/personal/Project-Rascal && git merge-base --is-ancestor 398eff1 main && echo MERGED`. If this does not print MERGED, stop — every edit below is on a branch that main will revert on its next push (.github/workflows/pages-actions.yml:29 deploys on push to main).
>   
> 2. After every content edit, from the site root: `npm run build`. This is not optional formatting. scripts/markdown.mjs generates each page's Markdown twin (route + ".md"), plus /llms.txt and /llms-full.txt, from the same rendered bodies as the HTML during the build — skip it and the twins ship the old copy while the HTML ships the new. Never hand-edit a .md twin or llms*.txt; edit src/pages/ and rebuild.
>   
> 3. Then `npm run check` — the launch break-test. It verifies the twins exist and parse clean (no leaked HTML, no unresolved {{TOKEN}}, no pronoun-token leaks), titles, headings, links, alt text, 320px overflow and the form ladder in real Chromium; it fails on a literal apps.apple.com anywhere in src/, on any page carrying no store link, and on the LAUNCH_BANNED phrase list ("coming soon", "opening soon", "until the app opens", "in private testing", "join the waitlist"). CLAUDE.md's committing rule is `npm run build && npm run check` together.
>   
> 4. Watch specifically for the pricing-table assertion in that run: check.mjs asserts the free column's worded cells outnumber its em dashes. Dashing Voice notes and Photos without adding the two new worded rows produces `/pricing: the free column is 6 entries against 6 em dashes — it reads as a punishment list` and fails the build.
>   
> 5. `npm run prompts` after any prompt-library change, and confirm it exits zero: scripts/prompts.mjs:380-392 sets process.exitCode = 1 if PROMPT_COUNT or QUESTION_COUNT drifts from the seed. Re-verify the numbers independently with `python3 -c "import yaml,collections;d=yaml.safe_load(open('/Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml'));print(len(d),collections.Counter(p['kind'] for p in d),collections.Counter(p['cadence'] for p in d))"` — expect 133 records, question 30, and 111 daily / 10 weekly / 12 monthly.
>   
> 6. Prove the stale strings are gone, not just edited: `grep -rn 'FREE_PHOTOS\|two minutes\|Hold to record\|VERIFIED_ON' src/ site.config.json` should return only the four legitimate VERIFIED_ON sites on /compare/tinybeans and /compare/qeepsake, and nothing else. `grep -rniE "waitlist form|private testing|opening soon|ships with the App Store|before it goes live" src/` should return nothing.
>   
> 7. Prove the unbuilt promises are gone from the rendered output, twins included: `grep -rn 'cold storage\|ninety days out\|storage_tier' dist/` should return nothing after the build.
>   
> 8. Check every quoted prompt body against the seed: for each card body edited in M19, `grep -F "<the body text>" /Users/travis/repos/personal/Project-Rascal/api/seeds/prompts.yaml` must match. Also diff the regenerated library — `git diff --stat src/partials/prompt-library.html src/partials/marquee-a.html src/partials/marquee-b.html` should be empty, since these are generated and were verified card-by-card against the current seed.
>   
> 9. Spot-read four Markdown twins after the build to confirm the fixes propagated: dist/pricing.md, dist/faq.md, dist/promise.md and dist/llms-full.txt — each should carry the new free-tier sentence and none should contain "100 photos", "two minutes" or "cold storage".
>   
> 10. Hand the two cross-repository strings to whoever owns Project-Rascal and confirm they land in the same window: ios/Rascal/Rascal/Subscription/MembershipCopy.swift:119 ("Video, and photographs without a limit") and the "Vellum" name in api/seeds/email_copy.yaml. The site's free-tier correction is only half-true until the paywall agrees with it.
>   
> 
> * * *
> 
> ## Provenance
> 
> Four auditors read the deployed tree page by page against the app and API source and produced 114 findings; a fifth deduped and prioritised them into the 36 above. Every quote was read out of commit `398eff1`, which is what pocketchronicle.app serves today. Every "source of truth" is a file and line you can open.
> 
> Two findings reach outside this repository and are listed as M36 and in the verification steps: `ios/Rascal/Rascal/Subscription/MembershipCopy.swift` still says "Video, and photographs without a limit" on the paywall, and `api/seeds/email_copy.yaml` still says "Vellum". The site's free-tier correction is only half true until the paywall agrees with it.
