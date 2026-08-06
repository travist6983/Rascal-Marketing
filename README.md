# RASCAL — marketing site

Landing page for RASCAL: one prompt a day about your kid, free by email, iOS app later.

A static port of `RASCAL Landing.dc.html` from Claude Design. No framework, no build
step — `index.html`, `styles.css`, `app.js` and two self-hosted webfonts.

## Running it

```bash
npm install        # only needed for `npm run check`
npm run serve      # http://localhost:4173
```

Opening `index.html` directly in a browser also works; nothing depends on a server.

## Turning the signup on

The design's form was a prototype: it waited 800ms and declared success without
sending anything. The port keeps every visible state — validation, the sending
label, the success card — but refuses to fake a signup. Until an endpoint is set,
submitting a valid address says plainly that nothing was stored.

Set one line at the top of `app.js`:

```js
const SIGNUP = {
  ENDPOINT: 'https://formspree.io/f/xxxxxxxx',   // or Buttondown, or your own /api/subscribe
  SOURCE: 'rascal-landing'
};
```

It posts `{ email, source }` as JSON and treats any non-2xx as a failure. If your
provider wants form-encoded fields or different names, adjust the `fetch` call in
the signup block at the bottom of `app.js`.

## Deploying

Live at **https://travist6983.github.io/Rascal-Marketing/**

Pages serves the `gh-pages` branch, which holds only what the site needs:
`index.html`, `styles.css`, `app.js`, `fonts/` and a `.nojekyll` marker. Nothing
on that branch is edited by hand — `.github/workflows/pages.yml` rebuilds and
force-pushes it on every push to `main`.

That route was chosen over `actions/deploy-pages` deliberately. Creating a Pages
site through the API needs repo-admin rights that `GITHUB_TOKEN` doesn't have
(`Resource not accessible by integration`), whereas pushing a branch needs only
`contents: write` — and creating `gh-pages` got GitHub to turn Pages on by
itself.

## Checking it

```bash
npm run check
```

Renders the page in Chromium at desktop, tablet and mobile widths and fails on
JS errors, sideways scroll, a webfont that silently fell back, a success card
visible before submitting, a card deck that stops advancing, and any of the
form's three validation messages going missing. Screenshots land in
`screenshots/`.

## What's what

| Path | |
|---|---|
| `index.html` | All the markup and copy |
| `styles.css` | The design's inline styles, lifted into classes |
| `app.js` | Card deck, drag-to-deal, scroll reveals, timeline, signup |
| `fonts/` | Nunito and Source Sans 3, self-hosted |
| `scripts/build-artifact.mjs` | Bundles everything into one self-contained file |
| `scripts/check.mjs` | The browser checks above |
| `scripts/serve.mjs` | Local static server |

## Notes on the port

- The original ran on Claude Design's preview runtime, which pulls React,
  ReactDOM and Babel from a CDN at page load and interprets the `x-dc` template
  DSL in the browser. That's a design-tool harness, so it's gone; the `DCLogic`
  component's logic is reproduced in plain JS with the same transform maths,
  easings and thresholds.
- The design's `data-props` (`stackDepth`, `dragToDeal`, `submitDelayMs`) are
  kept as a `PROPS` object in `app.js`.
- The fonts were `<link>`ed from Google Fonts; they're self-hosted here so the
  page makes no third-party requests at all.
- The three cards' hover states were React state in the original and are plain
  CSS `:hover` here.
- The design commits to one warm paper palette, so the page is deliberately
  single-theme rather than light/dark aware.
