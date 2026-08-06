# assets

Screenshot slots for the app section ("What lands on your phone"). The app is
not built yet, so every slot currently renders a designed empty state rather
than a placeholder image.

## Swapping a real screenshot in

Set `src` on the matching key in the `SHOTS` object at the top of `app.js`:

```js
const SHOTS = {
  today: { src: 'assets/today.png', alt: "…", w: 1290, h: 2796 },
  …
};
```

That is the only edit. No markup change, no CSS change. The slot already
reserves the exact aspect ratio via `aspect-ratio` plus explicit `width` and
`height`, so swapping in a real PNG causes no layout shift, and the scroll
choreography treats both states identically.

## Expected files

| File | Size | `SHOTS` key | Where it appears |
|---|---|---|---|
| `assets/today.png` | 1290 × 2796 | `today` | Beat 01 — "The prompt arrives on the phone". Loads eagerly; it is the first slot in the section. |
| `assets/composer.png` | 1290 × 2796 | `composer` | Beat 02 — "Answering takes under fifteen seconds" |
| `assets/timeline.png` | 1290 × 2796 | `timeline` | Beat 03 — "Every answer keeps his age on it" |
| `assets/detail.png` | 1290 × 2796 | `detail` | Beat 04 — "Nothing is ever deleted" |
| `assets/og.png` | 1200 × 630 | — | Social preview. See below. |

1290 × 2796 is the iPhone 15/16 Pro Max capture size. Any 1290-wide capture at
that ratio works; the frame crops with `object-fit: cover`.

Everything except the first slot is `loading="lazy"` and `decoding="async"`.

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
