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
  ['mobile', { width: 390, height: 844 }]
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

/* --- reduced motion: gentler, not absent --- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    reducedMotion: 'reduce'
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail.push(`reduced-motion: uncaught ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const before = await page.locator('.pcard[aria-hidden="false"] .pcard__text').innerText();
  await page.click('#dealAnother');
  await page.waitForTimeout(600);
  const after = await page.locator('.pcard[aria-hidden="false"] .pcard__text').innerText();
  if (before === after)
    fail.push('reduced-motion: the deck stopped working instead of cross-fading');

  // A reveal that never fires would hide content outright.
  const opacity = await page.locator('.shape').first().evaluate(
    (el) => Number(getComputedStyle(el).opacity)
  );
  if (opacity < 0.99) fail.push('reduced-motion: the shape cards never became visible');

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

await browser.close();

if (fail.length) {
  console.error(fail.map((f) => '✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(
  '✓ renders clean at 3 sizes; deck reads speed as well as distance and can be\n' +
  '  caught mid-flight; reduced motion still works; form validates'
);
