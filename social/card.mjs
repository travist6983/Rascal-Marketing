/**
 * Card rendering — the shared engine.
 *
 * Two callers: `scripts/social-cards.mjs` renders the whole library for review,
 * `scripts/social-queue.mjs` renders one card at a time into the posting queue.
 * The layout, the fonts and the Chrome invocation live here so the two can't
 * drift into producing different cards from the same prompt.
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

/** The self-hosted variable fonts, inlined — no network, no CORS, no fallback. */
export function fontFaces() {
  const face = (family, file, weights) => {
    const path = join(root, 'fonts', file);
    if (!existsSync(path)) throw new Error(`missing ${path} — the card sets its type in ${family}`);
    const data = readFileSync(path).toString('base64');
    return (
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weights};` +
      `font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');}`
    );
  };
  return [
    face('Nunito', 'nunito-var-latin.woff2', '600 800'),
    face('Source Sans 3', 'source-sans-3-var-latin.woff2', '400 600')
  ].join('\n');
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
 * One headless shot per card. Chrome writes a good deal of unsolicited noise to
 * stderr on macOS — allocator warnings, GPU probes — so only a non-zero exit or
 * a missing file counts as a failure.
 *
 * Deliberately no `--user-data-dir`: pointing each shot at a throwaway profile
 * is the textbook isolation, and on this Chrome build it hangs forever — a
 * single invocation with a fresh profile never returns. The default profile is
 * what works, so that is what this uses.
 */
export function shoot(chrome, html, png, size) {
  return new Promise((ok, fail) => {
    const child = spawn(
      chrome,
      [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--allow-file-access-from-files',
        '--virtual-time-budget=4000',
        `--window-size=${size.w},${size.h}`,
        `--screenshot=${png}`,
        html
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', fail);
    child.on('close', (code) => {
      if (code !== 0 || !existsSync(png)) {
        fail(new Error(`chrome exited ${code} for ${basename(html)}\n${stderr.trim()}`));
        return;
      }
      ok();
    });
  });
}

/** Bounded fan-out — Chrome is a heavy process and 113 at once is a swap storm. */
export async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  });
  await Promise.all(runners);
}
