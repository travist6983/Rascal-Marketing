#!/usr/bin/env node
/**
 * Renders the page in a real browser and fails on the things that are easy to
 * ship broken: JS errors, sideways scroll, a webfont that silently fell back,
 * a deck that stops advancing, and the form's validation ladder.
 * Screenshots land in screenshots/.
 *
 *   npm run check
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'screenshots');
const url = 'file://' + join(root, 'index.html');
await mkdir(shots, { recursive: true });

const fail = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined
});

/* --- renders cleanly at three sizes --- */
for (const [name, viewport] of [
  ['desktop', { width: 1400, height: 1000 }],
  ['tablet', { width: 820, height: 1180 }],
  ['mobile', { width: 390, height: 844 }],
  ['mobile-375', { width: 375, height: 812 }]
]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail.push(`${name}: uncaught ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') fail.push(`${name}: console ${m.text()}`);
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (over > 0) fail.push(`${name}: page scrolls sideways by ${over}px`);

  const fonts = await page.evaluate(
    () =>
      document.fonts.check('800 2rem Nunito') &&
      document.fonts.check('400 1rem "Source Sans 3"')
  );
  if (!fonts) fail.push(`${name}: a webfont fell back to a system face`);

  const stray = await page.locator('.signup__done:visible').count();
  if (stray) fail.push(`${name}: the success card is visible before submitting`);

  await page.screenshot({ path: join(shots, `${name}.png`), fullPage: true });
  await ctx.close();
}

/* --- deck: the apple-design behaviours ---
   A gesture is a distance *and* a speed. These check the deck reads both, and
   that a card already in flight can still be caught. */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();

  /** Drag the top card `dist` px left, pausing `gap` ms between moves. */
  const swipe = async (dist, gap, steps = 6) => {
    const box = await page.locator('.pcard[aria-hidden="false"]').boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(cx - (dist / steps) * i, cy);
      await page.waitForTimeout(gap);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
  };

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);

  const top = () => page.locator('.pcard[aria-hidden="false"] .pcard__text').innerText();

  const first = await top();
  await page.click('#dealAnother');
  await page.waitForTimeout(900);
  if ((await top()) === first) fail.push('deck: "Deal another" did not advance the card');

  // Same distance, two speeds — momentum projection has to separate them.
  // Few, large, tight steps: even if the runner stalls and stretches the gaps,
  // the per-sample displacement stays big enough to read as a flick.
  const beforeFlick = await page.evaluate(() => cursor);
  await swipe(72, 5, 3);
  if ((await page.evaluate(() => cursor)) === beforeFlick)
    fail.push('deck: a fast flick did not carry the card away (momentum projection)');

  const beforeSlow = await page.evaluate(() => cursor);
  await swipe(72, 150);
  if ((await page.evaluate(() => cursor)) !== beforeSlow)
    fail.push('deck: a slow drag of the same distance dealt instead of springing back');

  if ((await page.locator('.pcard:not([data-flying])').count()) !== 4)
    fail.push('deck: the stack is not holding four cards');

  // Interruptibility — the principle the whole rewrite is for.
  await page.click('#dealAnother');
  await page.waitForTimeout(90);
  if ((await page.locator('.pcard[data-flying]').count()) === 0) {
    fail.push('deck: no card was in flight to try catching');
  } else {
    const at = await page.evaluate(() => {
      const r = document.querySelector('.pcard[data-flying]').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.waitForTimeout(60);
    if ((await page.locator('.pcard[data-flying]').count()) !== 0)
      fail.push('deck: a card in flight could not be caught (interruptibility)');
    await page.mouse.up();
    await page.waitForTimeout(700);
  }

  await ctx.close();
}

/* --- the form's three validation messages --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const err = () => page.locator('[data-signup="hero"] [data-role="error"]').innerText();
  const submit = '[data-signup="hero"] [data-role="submit"]';

  await page.click(submit);
  await page.waitForTimeout(120);
  if (!(await err()).includes('Add an email address')) fail.push('form: empty case not caught');

  await page.fill('#email-hero', 'nope');
  await page.click(submit);
  await page.waitForTimeout(120);
  if (!(await err()).includes('missing an @')) fail.push('form: missing @ not caught');

  await page.fill('#email-hero', 'a@b');
  await page.click(submit);
  await page.waitForTimeout(120);
  if (!(await err()).includes('isn’t complete')) fail.push('form: incomplete domain not caught');

  await ctx.close();
}


/* --- countdown never shows a negative or a dead zero --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const state = await page.locator('[data-role="countdown"]').getAttribute('data-state');
  if (!['counting', 'grace', 'shipped'].includes(state))
    fail.push(`countdown: unknown state "${state}"`);

  if (state === 'counting') {
    const vals = await page.evaluate(() =>
      ['days', 'hours', 'minutes'].map((u) => {
        const host = document.querySelector(`[data-unit="${u}"]`);
        return host ? host.textContent.length : -1;
      })
    );
    if (vals.some((v) => v <= 0)) fail.push('countdown: a unit rendered nothing');

    // The digit tracks encode the value as a translateY; read it back.
    const read = await page.evaluate(() =>
      ['days', 'hours', 'minutes'].map((u) =>
        [...document.querySelectorAll(`[data-unit="${u}"] .digit__track`)]
          .map((t) => {
            const m = /translateY\(([-\d.]+)em\)/.exec(t.style.transform || '');
            return m ? -Number(m[1]) : NaN;
          })
          .join('')
      )
    );
    read.forEach((digits, i) => {
      const n = Number(digits);
      if (!Number.isFinite(n) || n < 0)
        fail.push(`countdown: unit ${i} rendered a non-negative-safe value "${digits}"`);
    });
  }

  const closeText = await page.locator('[data-role="closeCountdown"]').innerText();
  if (/-\d/.test(closeText)) fail.push(`countdown: close line shows a negative — "${closeText}"`);

  await ctx.close();
}

/* --- every SHOTS slot reserves its aspect ratio while src is null --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const slots = await page.evaluate(() => {
    const keys = Object.keys(SHOTS);
    const screens = [...document.querySelectorAll('.device__screen')];
    return {
      keys: keys.length,
      screens: screens.length,
      anySrc: keys.some((k) => SHOTS[k].src),
      boxes: screens.map((s) => {
        const r = s.getBoundingClientRect();
        return { h: Math.round(r.height), ratio: r.width > 0 ? r.height / r.width : 0 };
      })
    };
  });

  if (slots.screens !== slots.keys)
    fail.push(`shots: ${slots.keys} entries in SHOTS but ${slots.screens} slots rendered`);
  if (!slots.anySrc) {
    const want = 2796 / 1290;
    slots.boxes.forEach((b, i) => {
      if (b.h <= 0) fail.push(`shots: slot ${i} has zero height with src null`);
      if (Math.abs(b.ratio - want) > 0.02)
        fail.push(`shots: slot ${i} ratio ${b.ratio.toFixed(2)} != ${want.toFixed(2)}`);
    });
  }
  await ctx.close();
}

/* --- reduced motion renders a complete page, not a disabled one --- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    reducedMotion: 'reduce'
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail.push(`reduced-motion: uncaught ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // Nothing may be left mid-transform or invisible.
  const hidden = await page.evaluate(() => {
    const sel = ['.ln__i', '.shape', '.beat__copy', '.beat__shot', '.entry__body'];
    const out = [];
    sel.forEach((s) => {
      document.querySelectorAll(s).forEach((el) => {
        const cs = getComputedStyle(el);
        if (Number(cs.opacity) < 0.99) out.push(`${s} opacity ${cs.opacity}`);
        if (cs.transform && cs.transform !== 'none') out.push(`${s} transform ${cs.transform}`);
      });
    });
    return out.slice(0, 5);
  });
  hidden.forEach((h) => fail.push(`reduced-motion: ${h}`));

  // The countdown must still be live.
  const before = await page.locator('[data-role="closeCountdown"]').innerText();
  if (!before.trim()) fail.push('reduced-motion: countdown rendered empty');
  const ticking = await page.evaluate(() => typeof paintCountdown === 'function');
  if (!ticking) fail.push('reduced-motion: countdown updater missing');

  // The deck must still work.
  const first = await page.locator('.pcard[aria-hidden="false"] .pcard__text').innerText();
  await page.click('#dealAnother');
  await page.waitForTimeout(500);
  if ((await page.locator('.pcard[aria-hidden="false"] .pcard__text').innerText()) === first)
    fail.push('reduced-motion: the deck stopped advancing');

  await ctx.close();
}

await browser.close();

if (fail.length) {
  console.error(fail.map((f) => '✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(
  '✓ renders clean at 4 widths incl. 375px; countdown non-negative; every SHOTS\n' +
  '  slot reserves its ratio; reduced motion renders complete; deck reads speed\n' +
  '  and catches mid-flight; form validates'
);
