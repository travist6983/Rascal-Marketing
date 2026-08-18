# assets

Every captured image and video in the project lives here. **This is the one
place** — the landing page reads it by relative path, and it is also the
Remotion project's public directory, so `video/` reads the same files through
`staticFile()`. One copy of each capture, two consumers.

```
assets/
  screens/        31 app screenshots — stills off the device
  recordings/     4 screen recordings of the app in use
  fonts/          webfont copies the video serves (not for the site)
  og.png          social preview, 1200 × 630 — not captured yet
```

| | Reads it as |
|---|---|
| The site | `assets/screens/today-two-missions.png` — a relative path in `app.js` or `index.html` |
| The video | `staticFile("screens/today-two-missions.png")` — relative to `assets/`, set by `Config.setPublicDir("../assets")` in `video/remotion.config.ts` |

Note the video's paths have no `assets/` prefix: `assets/` *is* its public
directory root.

Filenames are `area-what-it-shows.png`, kebab-case, no ordinals — `today-*`,
`timeline-*`, `entry-*`, `composer-*`, `photo-*`, `onboarding-*`, `settings-*`.
Grouping beats numbering here because the set will grow in the middle, and a
capture that has to be renumbered is a capture whose name is already stale.

## screens/

31 captures from the build of 12 August 2026, all **1206 × 2622** — iPhone 16
Pro, status bar set to Apple's 9:41. Named for what they show, grouped by area
rather than numbered, so the set can grow without renumbering.

### Read this before using any of them

Four things carry across the whole set. None is a reason not to use these — they
are the best material we have — but each decides *which* screens are safe.

1. **The archive is written he/him.** Nearly every screen with copy in it says
   "him" or "his": *"Ask him ten questions about his mom"*, *"What did he cry
   about today?"*, *"Photograph his hands"*, and a `his-words` tag. The
   marketing site deliberately runs they/them and says so in the README — using
   these as-is puts the site in public contradiction with itself. The app
   supports all three (see `onboarding-pronouns.png`), so **re-capturing against
   a they/them archive removes the problem entirely** and is worth doing before
   any of the text-bearing screens go on the site.
2. **Photos are placeholders.** Every photo entry renders as a soft gradient
   blob, and in the recordings as an empty camera-icon box. Any screen leading
   with photography is unusable until real images are seeded.
3. **Two screens carry real personal data.** `settings-account-edit.png` shows a
   real name and `dev@rascal.local`; `settings-root.png` shows the same email.
   That address also still says *rascal*, which is the old product name.
4. **Two screens are development-only.** `onboarding-welcome.png` has a "Use the
   development account" link under the Apple button, and
   `settings-sync-diagnostics.png` is internal tooling. Neither should be shown
   publicly without an edit.

They are also **heavy** — 31 MB for the set, several over 2 MB each. Fine in the
video, too heavy to serve from the landing page as-is; downscale or convert
before wiring any into `SHOTS`.

### The set

**Rating** is marketing usefulness, not image quality. ★★★ carries a message on
its own; ★★ supports one; ★ is a reference capture.

#### Today, Timeline, Moments — the daily loop

| File | What it shows | Good for | |
|---|---|---|---|
| `today-two-missions.png` | The Today tab: a VIDEO mission and a QUESTION mission stacked as tinted cards, with "Capture it" / "Write it" buttons and a "3 waiting" row below | The single best "what the app is" shot. Beat 01, App Store screen 1, the hero everywhere | ★★★ |
| `timeline-all.png` | The archive, date-grouped, with a `4y 1m` age pill, a photo entry and a written one | Proves the archive exists and that age is stamped on everything. Beat 03 | ★★★ |
| `moments-on-this-day.png` | "On this day" resurfacing — an entry from 1 year ago with a `3y 1m` pill | The retention argument: the archive gives back, it doesn't only swallow | ★★ |
| `timeline-search.png` | Search for "moon", two matching entries | Shows the archive is searchable years later | ★★ |
| `timeline-filter-voice.png` | Timeline filtered to Voice — two recordings with waveforms and durations | Best of the three filter shots; the waveforms read instantly | ★★ |
| `timeline-filter-sealed.png` | Filtered to one sealed letter, "Opens at 18" | Pairs with the sealed-entry screens for a letters-focused post | ★★ |
| `timeline-filter-photos.png` | Filtered to Photos | Reference only — placeholder imagery | ★ |

#### Entry detail — one answer, close up

| File | What it shows | Good for | |
|---|---|---|---|
| `entry-question-answered.png` | The question *"What did he cry about today?"* above the answer *"Ten minutes, no phone — He built a tower and knocked it down eleven times. I stayed for all eleven."* | **The most emotionally complete screen in the set.** Question and answer in one frame, no placeholder imagery. Beat 04, and the strongest social card | ★★★ |
| `entry-written-note.png` | *"Hangaburger"* — a note about a mispronunciation nobody wants to correct | The product's whole thesis in one screen. Pairs with the site's `mispronounce` prompt card | ★★★ |
| `entry-sealed-locked.png` | A pink locked card: "Sealed until 18", written and waiting, with "Open it" | The most *distinctive* feature — nothing else in the category does this. Lead with it to differentiate | ★★★ |
| `entry-sealed-open.png` | The same letter opened: *"Dear you, on the day you turn eighteen…"* | The emotional payoff of the pair. Use the two together, locked then open | ★★★ |
| `entry-voice.png` | A voice entry, waveform and play button, 1:47, with a transcript beginning *"So the bus was a dinosaur bus…"* | Shows voice capture **and** that it is transcribed and searchable | ★★★ |
| `entry-video.png` | A video entry, 0:21, *"Full report, unprompted — Four minutes on why the neighbour's dog is actually a wolf"* | Video capture. Weakened by the placeholder frame behind it | ★★ |
| `entry-tag-editor.png` | Adding a tag, keyboard up, `outdoors` and `garden` already on the entry | Organisation. Utility shot — a feature-grid tile, not a hero | ★ |
| `entry-photos-nine.png` · `entry-photos-three.png` · `entry-photo-single.png` | Photo entries, 9 / 3 / 1 images, with a filmstrip and caption | Layout reference. Unusable publicly until real photos are seeded | ★ |

#### Capture

| File | What it shows | Good for | |
|---|---|---|---|
| `composer-empty.png` | The composer sheet: "Choose" and "Voice" buttons over an empty "What happened" field | The only composer still, and it is **empty** — it cannot carry "answering takes under fifteen seconds". Beat 02 needs a re-capture mid-typing | ★ |
| `photo-fullscreen.png` | A full-bleed photo with no UI at all | Nothing to show while photos are placeholders | ★ |
| `photo-viewer-dark.png` | The dark photo viewer with a close button | Reference only | ★ |

#### Onboarding — the "it takes a minute" argument

> **Re-captured Aug 18 2026 for the Vellum rename — resolved.** `onboarding-welcome.png` was
> the only screenshot here that showed the product name (a `DOGEAR` eyebrow). It was
> re-captured off a device from `main` after the iOS rename merged, with
> `CFBundleDisplayName` verified as **Vellum** in the built `.app` rather than only in
> source. Same 1206×2622, same 9:41 status bar; the eyebrow now reads `VELLUM`.
>
> Every other screenshot was checked individually and needed nothing — they are in-app
> content screens whose chrome is generic (TODAY / TIMELINE / MOMENTS / SETTINGS). That
> includes all seven used on the live site.
>
> **Two things changed with the app, not with the capture.** The screen gained a "Continue
> with Google" row (Google sign-in shipped in phases 55/58, after the original Aug 12
> capture), and the layout shifts up slightly to fit it.
>
> **And that creates a copy problem worth knowing before you publish this.** The supporting
> line still reads *"Your archive is tied to your Apple ID. There's nothing else to set up."*
> — which is no longer true for anyone who takes the Google path. That is an in-app copy
> bug, not a capture artefact, and it is filed against the app rather than fixed here. Crop
> below the Apple button, or wait for the app to fix the line, before using this as a hero.

| File | What it shows | Good for | |
|---|---|---|---|
| `onboarding-welcome.png` | *"Let's save today before it's gone."* under a **`VELLUM`** eyebrow, with Sign in with Apple and Continue with Google | Ready-made hero copy, and correct branding. **Crop out the "Use the development account" link — and see the Apple ID caveat above before using the sub-headline** | ★★★ |
| `onboarding-pronouns.png` | *"What are Hendrix's pronouns?"* — he/him, she/her, they/them | **Directly answers the site's they/them position**, and evidence the app was built for it. Worth its own post | ★★★ |
| `onboarding-birthdate.png` | A date wheel: *"It's what stamps every entry with an exact age, forever."* | Explains the age-stamping the timeline shows. Good second panel in a carousel | ★★ |
| `onboarding-notifications.png` | *"One note a day? … Never more than one. Off whenever you want."* | The anti-engagement promise, in the app's own words. Strong for a privacy/calm-tech angle | ★★ |
| `onboarding-name.png` · `onboarding-timezone.png` · `onboarding-avatar.png` | Name entry, timezone, optional avatar | Setup-flow completeness — an App Store "how it works" strip | ★ |

#### Settings

| File | What it shows | Good for | |
|---|---|---|---|
| `settings-root.png` | Archive, You, Export, Syncing — including *"Export the archive — every entry, photo and recording, as a zip you can keep forever"* | The lock-in answer: your data leaves whenever you want. Crop the email row | ★★ |
| `settings-archive-edit.png` | Child name, birthday, all three pronoun options, timezone | Backup for the pronouns story | ★★ |
| `settings-account-edit.png` | Real name and `dev@rascal.local` | **Not for public use** — personal data and the old product name | — |
| `settings-sync-diagnostics.png` | Dry run / reset sync position | **Not for public use** — internal tooling | — |

### The four wired into the landing page

The app section ("What lands on your phone") has four slots. `SHOTS` in `app.js`
still has `src: null` for all of them, so the page renders designed empty
states. Set `src` to promote a capture:

```js
const SHOTS = {
  today: { src: 'assets/screens/today-two-missions.png', alt: "…", w: 1206, h: 2622 },
  …
};
```

That is the only edit. No markup change, no CSS change — the slot reserves its
aspect ratio via `aspect-ratio` plus explicit `width` and `height`, so swapping
in a real PNG causes no layout shift and the scroll choreography treats both
states identically. **Update `w`/`h` to 1206 × 2622 at the same time**; they are
still set to the 1290 × 2796 of a Pro Max, and leaving them would crop the
capture slightly under `object-fit: cover`.

| `SHOTS` key | Beat | Recommended file | |
|---|---|---|---|
| `today` | 01 — "The prompt arrives on the phone" | `today-two-missions.png` | Ready. Loads eagerly; first slot in the section |
| `composer` | 02 — "Answering takes under fifteen seconds" | `composer-empty.png` | **Needs a re-capture** — the only composer shot is empty and sells nothing |
| `timeline` | 03 — "Every answer keeps their age on it" | `timeline-all.png` | Ready. The age pills are the point of the beat |
| `detail` | 04 — "Nothing is ever deleted" | `entry-question-answered.png` | Ready, pending the pronoun decision |

Everything except the first slot is `loading="lazy"` and `decoding="async"`.

Anything beyond those four still belongs here — the video can use any of them,
and the site's four are only the ones currently promoted.

## recordings/

Four clips from the same 12 August 2026 build, all 1206 × 2622 and 8.7–9.6
seconds.

**They are encoded at 1.2–2.1 fps average with a 5.6 fps ceiling**, so the
transitions step rather than glide. They read fine as a loop of held states —
what the app looks like — but they will not carry a "look how smooth this is"
message. Anything showing motion as the point wants a 60 fps re-record.

Every caveat from the screenshots applies here too: he/him copy throughout, and
photos rendering as empty camera-icon tiles, which is more obvious in motion
than in the stills.

| File | The arc | Good for | |
|---|---|---|---|
| `tour-tabs.mp4` | Moves across the tab bar — Timeline, then Moments, showing each surface in turn | The best overall "here is the app" clip. A silent autoplay loop on the landing page, or the spine of a longer edit | ★★★ |
| `tour-filters.mp4` | Timeline on All, then cycling the Photos / Video / Voice / Written / Sealed filters, ending on the single sealed letter | Shows the archive has shape and is sorted by kind. Good middle section of an edit | ★★ |
| `composer-opens.mp4` | Today with its two missions, then the composer sheet sliding up | The capture gesture. Undercut by the composer being empty when it arrives — nothing is typed | ★★ |
| `entry-opens.mp4` | Timeline, then a photo entry expanding into the full-screen viewer, "1 of 9" | The expand transition. Least useful of the four while photos are placeholders | ★ |

To use one in the video, see the snippet at the end of this section.

**Commit `.mp4`, not `.mov`.** A recording comes off an iPhone as a QuickTime
`.mov` that no browser plays reliably and that git would carry at full capture
size forever, so `*.mov` is gitignored here. Convert next to the original and
commit the result — ffmpeg ships with Remotion, so there is nothing to install:

```bash
npx --prefix video remotion ffmpeg -i assets/recordings/composer.mov \
  -vcodec libx264 -crf 24 -pix_fmt yuv420p -an \
  assets/recordings/composer.mp4
```

`-an` drops the audio track, which a UI recording has no use for and which
doubles the file for nothing. `-crf 24` is a reasonable quality/size trade for
screen content; lower is better and bigger. `-pix_fmt yuv420p` is what makes it
play in Safari.

Keep an eye on size — these are committed, so they are cloned by everyone and by
every CI run. If a clip is only ever going to be composited into a video and
never served by the site, it does not have to be committed at all.

To use one in the video:

```tsx
import { Video } from "@remotion/media";
import { staticFile } from "remotion";

<Video src={staticFile("recordings/composer.mp4")} />
```

`@remotion/media` is not installed yet — `cd video && npx remotion add
@remotion/media` when the first recording lands.

## fonts/

Nunito and Source Sans 3, copied from the repo root's `fonts/`. These exist only
because Remotion serves a single public directory and the video needs the same
two faces the site uses. **The site does not read these** — it has its own copy
at `fonts/` referenced by `styles.css`. If you change one, change both.

## og.png

`index.html` deliberately has **no** `og:image` tag. Until `assets/og.png`
exists, pointing at it would give every share a broken image, which is worse
than the text-only preview that title and description already produce.

When the file lands, add one line to `<head>`:

```html
<meta property="og:image" content="assets/og.png">
```

1200 × 630. Keep it countdown-free — a social card is cached by every platform
that scrapes it and cannot tick.
