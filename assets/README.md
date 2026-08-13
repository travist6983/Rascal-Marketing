# assets

Every captured image and video in the project lives here. **This is the one
place** — the landing page reads it by relative path, and it is also the
Remotion project's public directory, so `video/` reads the same files through
`staticFile()`. One copy of each capture, two consumers.

```
assets/
  screens/        app screenshots — stills off the device
  recordings/     screen recordings of the app in use
  fonts/          webfont copies the video serves (not for the site)
  og.png          social preview, 1200 × 630
```

| | Reads it as |
|---|---|
| The site | `assets/screens/today.png` — a relative path in `app.js` or `index.html` |
| The video | `staticFile("screens/today.png")` — relative to `assets/`, set by `Config.setPublicDir("../assets")` in `video/remotion.config.ts` |

Note the video's paths have no `assets/` prefix: `assets/` *is* its public
directory root.

## screens/

App screenshots. Name them for what they show, in kebab-case:
`today-arrival.png`, `composer-mid-capture.png`, `timeline-scrolled.png`.

**1290 × 2796** is the iPhone 15/16 Pro Max capture size and what the layout
expects. Any 1290-wide capture at that ratio works; the frame crops with
`object-fit: cover`. PNG.

Four of these are wired into the landing page's app section ("What lands on your
phone"). The app isn't built yet, so every slot currently renders a designed
empty state — set `src` on the matching key in the `SHOTS` object at the top of
`app.js` to swap a real one in:

```js
const SHOTS = {
  today: { src: 'assets/screens/today.png', alt: "…", w: 1290, h: 2796 },
  …
};
```

That is the only edit. No markup change, no CSS change. The slot already
reserves the exact aspect ratio via `aspect-ratio` plus explicit `width` and
`height`, so swapping in a real PNG causes no layout shift, and the scroll
choreography treats both states identically.

| `SHOTS` key | Expected file | Where it appears |
|---|---|---|
| `today` | `screens/today.png` | Beat 01 — "The prompt arrives on the phone". Loads eagerly; it is the first slot in the section. |
| `composer` | `screens/composer.png` | Beat 02 — "Answering takes under fifteen seconds" |
| `timeline` | `screens/timeline.png` | Beat 03 — "Every answer keeps their age on it" |
| `detail` | `screens/detail.png` | Beat 04 — "Nothing is ever deleted" |

Everything except the first slot is `loading="lazy"` and `decoding="async"`.

Anything beyond those four is still worth putting here — the video can use any
of them, and the site's four are just the ones currently promoted into `SHOTS`.

## recordings/

Screen recordings of the app in use. Same device, same 1290 × 2796 portrait.

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
