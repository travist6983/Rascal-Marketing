#!/usr/bin/env node
/**
 * Checks the BUILT site (dist/) for the things that are easy to ship broken.
 *
 *   npm run build && npm run check
 *
 * Two passes.
 *
 * STATIC — every dist html file:
 *   - title present, unique, and ≤60 chars; meta description present and ≤158
 *   - exactly one <h1>; heading levels never skip (no h2 → h4)
 *   - every <img> has alt, width and height (missing dimensions is the most
 *     common CLS cause; missing alt is an accessibility failure)
 *   - NO pronoun-token leaks: a literal {their} on the page whose job is
 *     proving the prompts are well written is a public failure. seo-plan.md
 *     marks this row Critical, and this is the launch break-test it asks for.
 *   - no unresolved {{TOKEN}} — except {{DOMAIN}}, which stays literal on
 *     purpose until a domain is bought. {{PRODUCT}} used to be exempt too,
 *     "until the name is resolved". It resolved (Dogear → Vellum, Aug 17
 *     2026), so the exemption is gone: a typo in the config key would
 *     otherwise ship a literal {{PRODUCT}} on every page and still report
 *     zero failures. The rename is exactly the operation this should guard.
 *   - every internal link and anchor resolves to a built file / a real id
 *   - every og: image referenced actually exists
 *   - every <script type="application/ld+json"> parses as JSON
 *
 * BROWSER — key routes through a real Chromium over a local server:
 *   - no uncaught errors, no console errors
 *   - no sideways scroll at 320px
 *   - the webfont actually loaded (a silent fallback ruins every headline)
 *   - the waitlist form's validation ladder answers in the right register
 *   - unknown URLs really return status 404
 *   Screenshots land in screenshots/.
 */
import { readFile, readdir, stat, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';
import { createServer } from 'node:http';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const fail = [];
const warn = [];

/* ------------------------------------------------------------------ static */

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const files = await walk(dist);
const htmlFiles = files.filter((f) => extname(f) === '.html');
const fileSet = new Set(files.map((f) => '/' + relative(dist, f).split('\\').join('/')));

/* route → file lookup for link checking */
function routeExists(href) {
  const path = href.replace(/[?#].*$/, '');
  if (path === '/' ) return fileSet.has('/index.html');
  const clean = path.replace(/\/$/, '');
  return (
    fileSet.has(clean) ||
    fileSet.has(clean + '/index.html') ||
    fileSet.has(clean + '.html')
  );
}

const PRONOUN_LEAK =
  /\{(they|them|their|theirs|themself|they_are|they_were|they_have|they_do|They|Them|Their|name)\}/;

const ids = new Map(); // page route -> Set of ids
const pages = [];

for (const file of htmlFiles) {
  const rel = '/' + relative(dist, file).split('\\').join('/');
  const html = await readFile(file, 'utf8');
  pages.push({ rel, html });
  const set = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) set.add(m[1]);
  ids.set(rel, set);
}

const seenTitles = new Map();

for (const { rel, html } of pages) {
  const where = rel;

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim();
  if (!title) fail.push(`${where}: missing <title>`);
  else {
    if (title.length > 60 && rel !== '/index.html')
      warn.push(`${where}: title is ${title.length} chars (cap 60): ${title}`);
    if (seenTitles.has(title)) fail.push(`${where}: duplicate title with ${seenTitles.get(title)}`);
    seenTitles.set(title, where);
  }

  const desc = (html.match(/<meta name="description" content="([\s\S]*?)"/) || [])[1];
  if (!desc) fail.push(`${where}: missing meta description`);
  else if (desc.length > 158) warn.push(`${where}: description ${desc.length} chars (cap 158)`);

  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');

  const h1s = body.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) fail.push(`${where}: ${h1s.length} <h1> elements (must be exactly 1)`);

  let prev = 0;
  for (const m of body.matchAll(/<h([1-6])[\s>]/g)) {
    const level = Number(m[1]);
    if (prev && level > prev + 1) {
      fail.push(`${where}: heading skips a level (h${prev} → h${level})`);
      break;
    }
    prev = level;
  }

  for (const m of body.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\salt="/.test(tag)) fail.push(`${where}: <img> without alt: ${tag.slice(0, 80)}`);
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag))
      fail.push(`${where}: <img> without width/height (CLS): ${tag.slice(0, 80)}`);
  }

  const leak = body.match(PRONOUN_LEAK);
  if (leak) fail.push(`${where}: PRONOUN TOKEN LEAKED: "${leak[0]}" — the renderer did not run`);

  /* An unexpanded include renders as an invisible comment, which is exactly
     why it has to be a hard failure: the page looks fine and has no nav. */
  if (html.includes('<!--#include'))
    fail.push(`${where}: unexpanded <!--#include --> shipped to dist`);
  if (!html.includes('class="masthead"')) fail.push(`${where}: site header missing`);
  if (!html.includes('class="foot"')) fail.push(`${where}: site footer missing`);

  for (const m of html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) {
    if (m[1] !== 'DOMAIN')
      fail.push(`${where}: unresolved token {{${m[1]}}}`);
  }

  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith('//')) continue;
    if (!routeExists(href)) fail.push(`${where}: dead internal link ${href}`);
    else {
      const hash = (href.match(/#(.+)$/) || [])[1];
      if (hash) {
        const path = href.replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
        const target =
          path === '/' ? '/index.html'
          : fileSet.has(path) ? path
          : fileSet.has(path + '/index.html') ? path + '/index.html'
          : path + '.html';
        const set = ids.get(target);
        if (set && !set.has(hash)) fail.push(`${where}: link to missing anchor ${href}`);
      }
    }
  }

  const og = (html.match(/property="og:image[^"]*" content="([^"]+)"/) || [])[1];
  if (og && og.startsWith('/') && !fileSet.has(og)) fail.push(`${where}: og image missing ${og}`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail.push(`${where}: JSON-LD does not parse — ${e.message}`);
    }
  }
}

/* every og file referenced from front matter must exist */
try {
  await stat(join(dist, 'robots.txt'));
} catch {
  fail.push('dist/robots.txt missing');
}

/* ------------------------------------------------------- markdown twins */
/* Every page that declares a markdown alternate must ship one; llms.txt must
   exist and every link in it must resolve; the twins must be actual markdown —
   no unresolved tokens (DOMAIN excepted) and no leaked HTML tags. */
let mdCount = 0;
for (const { rel, html } of pages) {
  const alt = (html.match(/rel="alternate" type="text\/markdown" href="([^"]+)"/) || [])[1];
  if (!alt) continue;
  mdCount++;
  let md;
  try {
    md = await readFile(join(dist, alt.slice(1)), 'utf8');
  } catch {
    fail.push(`${rel}: declared markdown twin ${alt} missing`);
    continue;
  }
  for (const t of md.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) {
    if (t[1] !== 'DOMAIN') fail.push(`${alt}: unresolved token {{${t[1]}}}`);
  }
  const tagLeak = md.match(/<\/?[a-z][a-z0-9-]*[\s>]/);
  if (tagLeak) fail.push(`${alt}: leaked HTML: ${tagLeak[0]}`);
  /* backslash-escaped braces are the md form of the HTML's entity-encoded
     demonstration tokens — deliberate, not a renderer failure */
  const mdLeak = md.replace(/\\[{}]/g, '').match(PRONOUN_LEAK);
  if (mdLeak) fail.push(`${alt}: PRONOUN TOKEN LEAKED: "${mdLeak[0]}"`);
}
try {
  const llms = await readFile(join(dist, 'llms.txt'), 'utf8');
  for (const m of llms.matchAll(/\]\((\/[^)]+)\)/g)) {
    try {
      await stat(join(dist, m[1].slice(1)));
    } catch {
      fail.push(`llms.txt: dead link ${m[1]}`);
    }
  }
  await stat(join(dist, 'llms-full.txt'));
} catch {
  fail.push('dist/llms.txt or llms-full.txt missing');
}

console.log(`static: checked ${pages.length} pages, ${mdCount} markdown twins`);

/* ----------------------------------------------------------------- browser */

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json'
};

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const clean = decodeURIComponent(pathname).replace(/\/$/, '');
  const tries = pathname.endsWith('/') ? [pathname + 'index.html'] : extname(clean) ? [clean] : [clean + '/index.html', clean + '.html'];
  for (const t of tries) {
    try {
      const file = join(dist, t);
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      return res.end(body);
    } catch {}
  }
  try {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(await readFile(join(dist, '404.html')));
  } catch {
    res.writeHead(404);
    res.end('miss');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const { chromium } = await import('playwright');
const shots = join(root, 'screenshots');
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

const ROUTES = ['/', '/how-it-works', '/prompts', '/pricing', '/promise', '/faq',
  '/compare/tinybeans', '/compare/qeepsake', '/compare/camera-roll',
  '/blog', '/blog/the-photo-survives', '/waitlist', '/thanks'];

for (const [name, viewport] of [
  ['desktop', { width: 1400, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
  ['mobile-320', { width: 320, height: 700 }]
]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail.push(`${name}: uncaught ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') fail.push(`${name}: console ${m.text()}`);
  });

  for (const route of ROUTES) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const wide = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    if (wide) fail.push(`${name} ${route}: horizontal scroll`);
    const font = await page.evaluate(() => document.fonts.check('700 22px Nunito'));
    if (!font) fail.push(`${name} ${route}: Nunito did not load`);
    if (name === 'desktop' && (route === '/' || route === '/blog' || route === '/prompts')) {
      await page.screenshot({ path: join(shots, `check-${route.replace(/\W+/g, '-') || 'home'}.png`), fullPage: false });
    }
  }

  /* the form ladder, once per context, on /waitlist */
  await page.goto(base + '/waitlist', { waitUntil: 'networkidle' });
  const laddered = await page.evaluate(() => {
    const form = document.querySelector('[data-signup]');
    const input = form && form.querySelector('input[type=email]');
    const msg = form && form.querySelector('[data-signup-msg]');
    if (!form || !input || !msg) return 'form pieces missing';
    input.value = 'not-an-email';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    if (!/look like an email/.test(msg.textContent)) return 'invalid-email message wrong: ' + msg.textContent;
    if (input.getAttribute('aria-invalid') !== 'true') return 'aria-invalid not set';
    return '';
  });
  if (laddered) fail.push(`${name} /waitlist: ${laddered}`);

  await ctx.close();
}

/* real 404 status */
const res = await fetch(base + '/definitely-not-a-page');
if (res.status !== 404) fail.push(`unknown URL returned ${res.status}, expected 404`);

await browser.close();
server.close();

/* ------------------------------------------------------------------ report */

for (const w of warn) console.log('  ~ ' + w);
if (fail.length) {
  console.error(`\n${fail.length} failure(s):`);
  for (const f of fail) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`\nok — ${pages.length} pages, ${warn.length} warning(s), 0 failures`);
