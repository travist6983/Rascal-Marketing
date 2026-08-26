/**
 * Card rendering — the shared engine.
 *
 * Two callers: `scripts/social-cards.mjs` renders the whole library for review,
 * `scripts/social-queue.mjs` renders one card at a time into the posting queue.
 * The layout, the fonts and the Chrome invocation live here so the two can't
 * drift into producing different cards from the same prompt.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND } from './prompts.js';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Instagram portrait is what the design was drawn for; the other two reuse it. */
export const SIZES = {
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 }
};

const CHROMES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
].filter(Boolean);

/* --------------------------------------------------------------------------
   Copy
   -------------------------------------------------------------------------- */

/**
 * One sentence per piece. The split consumes exactly the whitespace between
 * sentences, so the edges a caller depends on — the space before a marked verb,
 * the space after it — survive untouched.
 */
function sentences(text) {
  if (text === '') return [''];
  return text.split(/(?<=[.?!][”’"']?)\s+(?=[A-Z“‘"'])/);
}

/**
 * Two blocks: the instruction, then everything after it.
 *
 * Not one line per sentence — "Record them telling you a story. Any story. Don't
 * correct the words they say wrong." strands "Any story." on a line of its own
 * and the card reads as a list. The break that matters is the one after the
 * ask; the rest is the aside, and it can wrap as prose.
 *
 * Built from the three pieces rather than by searching a joined string, so a
 * verb that happens to repeat later in the sentence can't mark the wrong one.
 */
export function blocks({ pre, verb, post }) {
  const head = sentences(pre);
  const tail = sentences(post);
  const all = [
    ...head.slice(0, -1).map((text) => [{ text }]),
    [{ text: head[head.length - 1] }, { mark: verb }, { text: tail[0] }],
    ...tail.slice(1).map((text) => [{ text }])
  ];

  const [first, ...rest] = all;
  if (rest.length === 0) return [first];
  const aside = rest.flatMap((sentence, i) => (i === 0 ? sentence : [{ text: ' ' }, ...sentence]));
  return [first, aside];
}

/** The prompt as one plain string — for titles, filenames and caption input. */
export const plain = ({ pre, verb, post }) => `${pre}${verb}${post}`;

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join('-')
    .replace(/-+/g, '-');
}

export const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

/** Every face this repo ships, with the weight range each one is subset to. */
const FACES = {
  Nunito: { file: 'nunito-var-latin.woff2', weights: '600 800' },
  'Source Sans 3': { file: 'source-sans-3-var-latin.woff2', weights: '400 600' }
};

/**
 * The self-hosted variable fonts, inlined — no network, no CORS, no fallback.
 *
 * Which faces a surface needs is the surface's call, and the two surfaces
 * disagree: a prompt card sets its body copy in Source Sans 3, and an ad sets
 * body copy in the system stack the landing page itself uses, so it wants
 * Nunito on its own. Default to both, because a card asked for both long
 * before an ad asked for one.
 *
 * Asking for a face this repo does not ship throws. Left to itself it would
 * render the fallback and look merely a little off, which is the defect a
 * headline is worst at showing you.
 */
export function fontFaces(families = Object.keys(FACES)) {
  return families
    .map((family) => {
      const face = FACES[family];
      if (!face) {
        throw new Error(`no face "${family}" — this repo ships ${Object.keys(FACES).join(', ')}`);
      }
      const path = join(root, 'fonts', face.file);
      if (!existsSync(path)) throw new Error(`missing ${path} — the type is set in ${family}`);
      const data = readFileSync(path).toString('base64');
      return (
        `@font-face{font-family:'${family}';font-style:normal;font-weight:${face.weights};` +
        `font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');}`
      );
    })
    .join('\n');
}

/** Reads the two files every card needs. Both callers want the same pair. */
export function loadAssets() {
  return { css: readFileSync(join(root, 'social', 'card.css'), 'utf8'), fonts: fontFaces() };
}

/**
 * Shrinks the body until it fits its box, after the webfont has actually loaded.
 * Measuring before `document.fonts.ready` measures the fallback, which is a
 * different width, and the card ships either overset or half empty.
 */
const FIT = `
document.fonts.ready.then(function () {
  var body = document.querySelector('.body');
  var box = document.querySelector('.body-box');
  var size = parseFloat(getComputedStyle(body).fontSize);
  var floor = size * 0.62;
  while (size > floor && body.scrollHeight > box.clientHeight) {
    size -= 1;
    body.style.fontSize = size + 'px';
  }
  document.documentElement.dataset.fitted = 'true';
});
`;

export function cardHtml(prompt, { css, fonts, size }) {
  const kind = KIND[prompt.kind];
  if (!kind) throw new Error(`no palette for kind "${prompt.kind}" — add it to social/prompts.js`);

  const body = blocks(prompt)
    .map((runs) => {
      const inner = runs
        .map((run) => (run.mark ? `<mark>${escapeHtml(run.mark)}</mark>` : escapeHtml(run.text)))
        .join('');
      return `<span class="line">${inner}</span>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en" data-size="${size.name}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(plain(prompt))}</title>
<style>
${fonts}
:root { --w: ${size.w}px; --h: ${size.h}px; }
${css}
</style>
</head>
<body>
<article class="card" style="--tint: ${kind.ink}; --tint-soft: ${kind.bg}">
  <p class="badge">${escapeHtml(prompt.kind)}</p>
  <div class="body-box"><p class="body">${body}</p></div>
  <p class="wordmark">Vellum</p>
</article>
<script>${FIT}</script>
</body>
</html>
`;
}

/* --------------------------------------------------------------------------
   Chrome
   -------------------------------------------------------------------------- */

export function findChrome() {
  const found = CHROMES.find((path) => existsSync(path));
  if (!found) {
    throw new Error(
      `no Chrome found. Looked in:\n  ${CHROMES.join('\n  ')}\n` +
        'Set CHROME=/path/to/binary to point at one.'
    );
  }
  return found;
}

/**
 * One headless shot per card, taken through Playwright rather than Chrome's own
 * `--screenshot` flag. That flag only ever writes PNG, and Instagram's
 * publishing API accepts JPEG only — so the encoder had to become something
 * this file chooses rather than something Chrome decides.
 *
 * Still the very same binary `findChrome()` locates, handed over as
 * `executablePath`. The cards were tuned against that renderer; borrowing
 * Playwright's bundled Chromium instead would quietly reflow the type. And
 * Playwright gives it a profile of its own without reproducing the hang that
 * made the old CLI path avoid `--user-data-dir`.
 *
 * A browser per shot, which is the process-per-card the CLI spawn already paid
 * for. Holding one open across cards would be faster, but it needs a shutdown
 * the two callers don't have, and an un-closed browser keeps the event loop
 * alive — a render that finishes and then hangs is worse than a slow one.
 *
 * Format follows the extension: `.jpg`/`.jpeg` encodes JPEG, anything else PNG.
 * The queue writes JPEG because Instagram requires it; the review renders stay
 * PNG because nothing outside this machine ever fetches those.
 *
 * The wait is on the card's own `data-fitted` flag rather than a fixed time
 * budget. The fit script sets it once the webfont has loaded and the body has
 * been shrunk to its box, which is exactly when the card is finished — earlier
 * is a half-drawn card, later is dead time. The contact sheet runs no fit
 * script, so it waits on the fonts alone.
 */
export async function shoot(chrome, html, out, size) {
  const { chromium } = await import('playwright').catch(() => {
    throw new Error('playwright is missing — run `npm install`');
  });

  const jpeg = /\.jpe?g$/i.test(out);
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    const page = await browser.newPage({
      viewport: { width: size.w, height: size.h },
      deviceScaleFactor: 1
    });
    await page.goto(pathToFileURL(html).href);
    await page.waitForFunction(
      () =>
        document.fonts.status === 'loaded' &&
        (!document.querySelector('.body-box') ||
          document.documentElement.dataset.fitted === 'true'),
      null,
      { timeout: 15000 }
    );
    await page.screenshot({
      path: out,
      type: jpeg ? 'jpeg' : 'png',
      ...(jpeg ? { quality: 92 } : {})
    });
  } catch (error) {
    throw new Error(`${basename(html)} failed to render — ${error.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }
}

/** Bounded fan-out — Chrome is a heavy process and 113 at once is a swap storm. */
export async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  });
  await Promise.all(runners);
}
