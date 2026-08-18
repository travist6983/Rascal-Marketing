#!/usr/bin/env node
/**
 * Renders the OG card set into src/assets/og/ as 1200×630 PNGs. `npm run og`.
 *
 * Zero config: the manifest below is the whole input. Each card is a plain
 * HTML page screenshotted with Playwright, styled to match the site system —
 * same cream, same ink, same Nunito, same single ember accent.
 *
 * NOTE: the "133" in prompts.png is baked into the image. When the prompt
 * library count changes, regenerate the set with `npm run og`.
 *
 * Deliberately absent: the product name, child photos, screenshots. The name is
 * settled (Vellum) but not cleared — no trademark search has been run, and the
 * cards carry the promise instead ("one question a day"). Keeping the name out
 * of the pixels is also what makes a rename cheap: these 18 PNGs did not need
 * re-rendering when Dogear became Vellum, and would not need it again.
 *
 * Also renders src/assets/icon-180.png (the apple-touch-icon) from icon.svg,
 * so every image asset the layout references comes out of one command.
 */
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'og');

/* Chromium fetches @font-face over CORS, and file:// origins are opaque to
   each other, so a file:// URL to the woff2 silently falls back to Helvetica.
   A data: URI dodges the whole question. */
const fontData = await readFile(join(root, 'fonts', 'nunito-var-latin.woff2'));
const fontUrl = `data:font/woff2;base64,${fontData.toString('base64')}`;

/* file → label → headline → the one phrase tinted ember. */
const CARDS = [
  ['default.png', '', 'One question a day. A childhood you can find again.', 'find'],
  ['home.png', 'No streaks · no ads', 'One question and one small mission a day.', 'one small mission'],
  ['how-it-works.png', 'How it works', 'One question. One mission. It files itself.', 'files'],
  ['prompts.png', 'The library', '133 questions worth asking about your kid.', '133'],
  ['pricing.png', 'Pricing', "Free isn't a trial that runs out.", 'Free'],
  ['promise.png', 'The promise', 'Text is never deleted. Not ever.', 'never'],
  ['faq.png', 'FAQ', 'Questions, answered plainly.', 'plainly'],
  ['waitlist.png', 'The waitlist', "Get tomorrow's prompt.", "tomorrow's"],
  ['blog.png', 'The blog', 'Notes on keeping a childhood.', 'childhood'],
  ['blog-the-photo-survives.png', 'Memory', "The photo survives. The story doesn't.", 'story'],
  ['blog-what-to-write-in-a-keepsake-book.png', 'Prompts', 'What to write in a keepsake book when you have no idea what to write.', 'keepsake book'],
  ['blog-streaks-are-a-bad-idea.png', 'Design', 'Streaks are a bad idea in a parenting app.', 'bad idea'],
  ['blog-record-your-kids-voice.png', 'How-to', 'Record their voice before it changes.', 'voice'],
  ['blog-an-archive-they-can-inherit.png', 'Archives', 'An archive your kid can actually inherit.', 'inherit'],
  ['compare-tinybeans.png', 'Compared', 'A private, ad-free alternative to Tinybeans.', 'ad-free'],
  ['compare-qeepsake.png', 'Compared', 'Prompted journaling, compared honestly.', 'honestly'],
  ['compare-camera-roll.png', 'Compared', 'Why not just use your camera roll?', 'camera roll']
];

/* ------------------------------------------------------------------ helpers */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Display text gets real apostrophes. Applied to headline and accent alike,
   so the accent phrase still matches after the swap. */
const typo = (s) => s.replace(/'/g, '’');

function markAccent(headline, accent) {
  const h = typo(headline);
  const a = typo(accent);
  const i = h.indexOf(a);
  if (i === -1) throw new Error(`accent "${accent}" not found in "${headline}"`);
  return (
    esc(h.slice(0, i)) + '<span class="accent">' + esc(a) + '</span>' + esc(h.slice(i + a.length))
  );
}

function cardHtml({ label, headlineHtml }) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Nunito';
    src: url('${fontUrl}') format('woff2');
    font-weight: 200 1000;
    font-style: normal;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    position: relative;
    overflow: hidden;
    background: #FDFAF4;
    font-family: 'Nunito', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .frame { position: absolute; inset: 24px; border: 1px solid #EDE5DA; border-radius: 28px; }
  .text { position: absolute; left: 96px; right: 96px; bottom: 96px; }
  .label {
    font-size: 22px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: #B4ADA3; margin-bottom: 24px;
  }
  .headline {
    font-size: 72px; font-weight: 800; line-height: 1.12;
    letter-spacing: -0.01em; color: #23253C; text-align: left;
  }
  .headline .accent { color: #C05A2B; }
  .brand { position: absolute; right: 96px; bottom: 46px; display: flex; align-items: center; gap: 11px; }
  .brand .dot { width: 14px; height: 14px; border-radius: 50%; background: #C05A2B; }
  .brand .line { font-size: 22px; font-weight: 700; color: #6E6A63; }
</style></head>
<body>
  <div class="frame"></div>
  <div class="text">
    ${label ? `<div class="label">${esc(label)}</div>` : ''}
    <div class="headline">${headlineHtml}</div>
  </div>
  <div class="brand"><div class="dot"></div><div class="line">one question a day</div></div>
</body></html>`;
}

/* --------------------------------------------------------------------- main */

await mkdir(outDir, { recursive: true });
const tmp = await mkdtemp(join(tmpdir(), 'og-'));
const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1
  });

  for (const [file, label, headline, accent] of CARDS) {
    const stage = join(tmp, file.replace(/\.png$/, '.html'));
    await writeFile(stage, cardHtml({ label, headlineHtml: markAccent(headline, accent) }));
    await page.goto(pathToFileURL(stage).href);
    await page.evaluate(() => document.fonts.ready);

    /* Auto-shrink: long titles step down from 72px until they hold within
       four lines and never overflow sideways. */
    await page.evaluate(() => {
      const el = document.querySelector('.headline');
      let size = 72;
      const fits = () => {
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        return el.scrollHeight <= lh * 4 + 2 && el.scrollWidth <= el.clientWidth + 1;
      };
      el.style.fontSize = size + 'px';
      while (!fits() && size > 40) {
        size -= 2;
        el.style.fontSize = size + 'px';
      }
    });

    await page.screenshot({
      path: join(outDir, file),
      clip: { x: 0, y: 0, width: 1200, height: 630 }
    });
    console.log(`  og/${file}`);
  }

  /* icon-180.png — the apple-touch-icon, rendered from icon.svg at exactly
     180px. The SVG's own rounded rect is the background; everything outside
     its corners stays transparent (omitBackground). */
  const svg = (await readFile(join(root, 'src', 'assets', 'icon.svg'), 'utf8')).replace(
    '<svg ',
    '<svg width="180" height="180" '
  );
  const iconStage = join(tmp, 'icon.html');
  await writeFile(
    iconStage,
    `<!doctype html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; }
      html, body { background: transparent; }
      svg { display: block; }
    </style></head><body>${svg}</body></html>`
  );
  const iconPage = await browser.newPage({
    viewport: { width: 180, height: 180 },
    deviceScaleFactor: 1
  });
  await iconPage.goto(pathToFileURL(iconStage).href);
  await iconPage.screenshot({
    path: join(root, 'src', 'assets', 'icon-180.png'),
    omitBackground: true,
    clip: { x: 0, y: 0, width: 180, height: 180 }
  });
  console.log('  icon-180.png');
} finally {
  await browser.close();
  await rm(tmp, { recursive: true, force: true });
}

console.log(`rendered ${CARDS.length} OG cards → src/assets/og/`);
