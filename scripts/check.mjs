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

/* --- deck advances, drags, and snaps back --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const top = () => page.locator('.pcard[aria-hidden="false"] .pcard__text').innerText();

  const first = await top();
  await page.click('#dealAnother');
  await page.waitForTimeout(700);
  if ((await top()) === first) fail.push('deck: "Deal another" did not advance the card');

  const before = await top();
  const box = await page.locator('.pcard[aria-hidden="false"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  if ((await top()) === before) fail.push('deck: dragging past the threshold did not deal');

  const held = await top();
  const box2 = await page.locator('.pcard[aria-hidden="false"]').boundingBox();
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
  await page.mouse.down();
  await page.mouse.move(box2.x + box2.width / 2 - 40, box2.y + box2.height / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  if ((await top()) !== held) fail.push('deck: a short drag dealt instead of snapping back');

  if ((await page.locator('.pcard').count()) !== 4)
    fail.push('deck: the stack is not holding four cards');

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
console.log('✓ renders clean at 3 sizes; deck deals, drags and snaps; form validates');
