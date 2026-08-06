#!/usr/bin/env node
/**
 * The apple-design pass changed behaviour more than pixels, and behaviour does
 * not survive a single screenshot. This films the deck and lays the frames out
 * as a contact sheet.
 *
 *   node scripts/motion-filmstrip.mjs
 *
 * Screenshots take ~100ms each, far too coarse to show a spring, so the page's
 * requestAnimationFrame is swapped for a queue this script pumps on a virtual
 * clock. Frames then land exactly STEP ms apart however slow the capture is.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'screenshots');
const url = 'file://' + join(root, 'index.html');
const STEP = 40; // ms of animation between frames
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined
});

async function openDeck() {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);          // let the opening deal settle
  await page.evaluate(() => window.scrollTo(0, 0));

  const box = await page.locator('.deck').boundingBox();
  const left = Math.max(0, box.x - 320);
  const clip = {
    x: left,
    y: Math.max(0, box.y - 24),
    width: Math.min(1400 - left, box.width + 640),
    height: box.height + 48
  };

  // Take over the page's animation clock.
  await page.evaluate(() => {
    window.__queue = [];
    window.__now = performance.now();
    window.requestAnimationFrame = (cb) => { window.__queue.push(cb); return 1; };
    window.__pump = (dt) => {
      window.__now += dt;
      const q = window.__queue;
      window.__queue = [];
      q.forEach((cb) => cb(window.__now));
    };
  });

  const pump = (dt = STEP) => page.evaluate((d) => window.__pump(d), dt);
  return { ctx, page, clip, pump };
}

async function sheet(name, caption, frames) {
  const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; padding:26px; background:#FDFAF4;
         font-family: ui-sans-serif, system-ui, sans-serif; color:#23253C; }
  h1 { margin:0 0 4px; font-size:19px; letter-spacing:-0.01em; }
  p  { margin:0 0 20px; font-size:14px; line-height:1.5; color:#6E6A63; max-width:92ch; }
  .strip { display:flex; gap:10px; align-items:flex-start; }
  figure { margin:0; flex:1 1 0; min-width:0; }
  img { width:100%; display:block; border:1px solid #EDE5DA; border-radius:8px; }
  figcaption { margin-top:7px; font-family: ui-monospace, Menlo, monospace;
               font-size:10.5px; letter-spacing:.03em; color:#6E6A63; text-align:center; }
  figcaption b { display:block; font-weight:600; color:#C05A2B; }
</style>
<h1>${name}</h1>
<p>${caption}</p>
<div class="strip">
  ${frames.map((f) => `<figure><img src="data:image/png;base64,${f.data}"><figcaption>${f.at}${f.note ? `<b>${f.note}</b>` : ''}</figcaption></figure>`).join('\n  ')}
</div>`;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const htmlPath = join(shots, `${slug}.html`);
  await writeFile(htmlPath, html);

  const ctx = await browser.newContext({ viewport: { width: 1600, height: 300 } });
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(shots, `${slug}.png`), fullPage: true });
  await ctx.close();
  console.log('  screenshots/' + slug + '.png');
}

console.log('filmstrips:');

/* ---- 1. a flick leaves carrying the gesture's own speed ---------------- */
{
  const { ctx, page, clip, pump } = await openDeck();
  const box = await page.locator('.pcard[aria-hidden="false"]').boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  const frames = [];
  const shot = async (at, note) =>
    frames.push({ at, note, data: (await page.screenshot({ clip })).toString('base64') });

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await pump(16);
  await shot('grab', 'lifts');

  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(cx - 12 * i, cy);
    await page.waitForTimeout(8);
    await pump(16);
  }
  await shot('release', '72px, fast');

  await page.mouse.up();
  for (let i = 1; i <= 6; i++) {
    await pump(STEP);
    await shot(`+${i * STEP}ms`, i === 6 ? 'settled' : '');
  }

  await ctx.close();
  await sheet(
    'Flick',
    'The card is dragged only 72px, but quickly. Release velocity is measured over the last 80ms of ' +
      'pointer travel, the resting point is projected from it with Apple’s decay function, and that ' +
      'projection — not the 72px — decides the card leaves. Dragged the same distance slowly, it springs back.',
    frames
  );
}

/* ---- 2. a card in flight can be caught --------------------------------- */
{
  const { ctx, page, clip, pump } = await openDeck();
  const frames = [];
  const shot = async (at, note) =>
    frames.push({ at, note, data: (await page.screenshot({ clip })).toString('base64') });

  await page.evaluate(() => advance(1, 900));   // the same synthetic flick the button uses
  await pump(16);
  await shot('0ms', 'dealt away');
  await pump(STEP);
  await shot(`${STEP}ms`, 'in flight');
  await pump(STEP);
  await shot(`${2 * STEP}ms`, '');

  const at = await page.evaluate(() => {
    const el = document.querySelector('.pcard[data-flying]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  if (at) {
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await pump(16);
    await shot('grab', 'caught');

    for (let i = 1; i <= 3; i++) {
      await page.mouse.move(at.x - 70 * i, at.y);
      await page.waitForTimeout(10);
      await pump(16);
      await shot(`drag ${i}`, i === 1 ? 'follows pointer' : '');
    }
    await page.mouse.up();
    await pump(STEP);
    await shot('release', '');
  }

  await ctx.close();
  await sheet(
    'Caught mid-flight',
    'The card is dealt away, then grabbed while it is still moving. It is picked up from its live ' +
      'on-screen position rather than snapping to a logical value, and the gesture takes over at once — ' +
      'no waiting for the outgoing animation to finish. On main this is impossible: the exit is a CSS ' +
      'transition and advance() ignores input for its full 460ms.',
    frames
  );
}

await browser.close();
