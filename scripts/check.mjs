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
 *   - every link and button that contains no text has an accessible name, so an
 *     artwork-only control cannot go unnamed while everything else passes
 *   - NO pronoun-token leaks: a literal {their} on the page whose job is
 *     proving the prompts are well written is a public failure. seo-plan.md
 *     marks this row Critical, and this is the launch break-test it asks for.
 *   - no unresolved {{TOKEN}}. Nothing is exempt any more. {{PRODUCT}} was,
 *     "until the name is resolved", and {{DOMAIN}} was, until a domain was
 *     bought. Both resolved (Vellum Aug 17 2026, getvellumapp.com Aug 18), and
 *     an exemption that outlives its reason is worse than no check: DOMAIN's
 *     covered a real bug for a day — SUPPORT_EMAIL is "hello@{{DOMAIN}}", the
 *     token expander ran one pass, and `mailto:hello@{{DOMAIN}}` was sitting in
 *     five pages, four twins and site.js while this file reported zero failures.
 *     A rename or a domain move is exactly the operation this should guard.
 *   - every internal link and anchor resolves to a built file / a real id
 *   - every og: image referenced actually exists
 *   - the domain is used consistently: canonicals self-reference on ORIGIN and
 *     only on indexable pages, OG URLs are absolute, sitemap.xml and the set of
 *     canonicals agree exactly, robots.txt points at the sitemap, CNAME matches
 *     ORIGIN's host, and nothing shipped still names the old project URL
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

  /* Scripts and comments both come out before the markup passes below, and for the
     same reason: neither renders, so neither should be able to trip a check about what
     a reader sees. Comments were included until Aug 18 2026, when a source comment
     explaining why the brand lockup is inlined mentioned an image tag by name in its
     prose — and the alt-text pass read the description as the thing described, failing
     all 21 pages twice for an <img> that does not exist. Prose about markup should not
     have to avoid naming tags.

     Deliberately scoped to `body`: the unexpanded-include check below reads `html`,
     because an unexpanded include IS a comment and stripping them would blind it. */
  const body = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

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

  /* An interactive element whose only content is artwork has no text to be named by, so
     its accessible name lives entirely in an attribute — and an attribute is exactly what
     a reviewer's eye slides past. The masthead and footer marks are the live case: both
     are anchors wrapping an inline SVG, and if `aria-label` were dropped the site's home
     link would be unnamed on all 21 pages while every other check still passed. The alt
     pass below only inspects image tags, so it cannot see this.

     Named by, in order: aria-label, aria-labelledby, a title attribute, an <img> with a
     non-empty alt, or an <svg> carrying its own <title>. Text content anywhere inside
     counts, which is why the ordinary nav links never reach this check. */
  for (const m of body.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const [, tag, attrs, inner] = m;
    const text = inner.replace(/<[^>]*>/g, '').replace(/&[a-z]+;|&#\d+;/gi, ' ').trim();
    if (text) continue;
    const named =
      /\saria-label="[^"]+"/.test(attrs) ||
      /\saria-labelledby="[^"]+"/.test(attrs) ||
      /\stitle="[^"]+"/.test(attrs) ||
      /<img\b[^>]*\salt="[^"]+"/.test(inner) ||
      /<title[\s>]/.test(inner);
    if (!named)
      fail.push(`${where}: <${tag}> has no text and no accessible name: ${m[0].slice(0, 90)}`);
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

  for (const m of html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g))
    fail.push(`${where}: unresolved token {{${m[1]}}}`);

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

/* --------------------------------------------------------------- the origin */
/* Everything here names the domain somewhere a reader never looks — a canonical,
   a sitemap <loc>, the CNAME the deploy reads — which is why it needs a machine
   to check it. The failures are all quiet and all expensive: a canonical on the
   wrong host de-indexes the page carrying it, a sitemap of URLs nothing claims
   is crawl budget spent on nothing, and a missing CNAME drops Pages back to the
   project URL, where every root-absolute link on the site 404s.

   The whole pass is gated on ORIGIN, so it stays honest if the domain is ever
   given up: an empty ORIGIN means the build emits none of this, and none of it
   is then required. */
const config = JSON.parse(await readFile(join(root, 'site.config.json'), 'utf8'));
const origin = (config.ORIGIN || '').replace(/\/$/, '');

if (origin) {
  const host = new URL(origin).host;
  const self = (route) => origin + (route === '/' ? '/' : route);

  if (!origin.startsWith('https://'))
    fail.push(`site.config.json: ORIGIN is not https — ${origin}`);
  /* SUPPORT_EMAIL is built from DOMAIN, the canonicals from ORIGIN. If those two
     ever disagree the site invites mail to one domain and ranks another, and
     nothing on the page looks wrong. */
  if (config.DOMAIN !== host)
    fail.push(`site.config.json: DOMAIN "${config.DOMAIN}" is not ORIGIN's host "${host}"`);

  try {
    const cname = (await readFile(join(dist, 'CNAME'), 'utf8')).trim();
    if (cname !== host) fail.push(`dist/CNAME is "${cname}", ORIGIN's host is "${host}"`);
  } catch {
    fail.push('dist/CNAME missing — Pages would fall back to the project URL');
  }

  const robotsTxt = await readFile(join(dist, 'robots.txt'), 'utf8').catch(() => '');
  if (!robotsTxt.includes(`Sitemap: ${origin}/sitemap.xml`))
    fail.push(`robots.txt does not point at ${origin}/sitemap.xml`);

  let sitemap = '';
  try {
    sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
  } catch {
    fail.push('dist/sitemap.xml missing while ORIGIN is set');
  }
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  /* Canonicals self-reference, absolutely, and a noindex page carries none:
     keeping a URL and dropping it are not two things to ask in one breath. */
  const canonicals = new Set();
  for (const { rel, html } of pages) {
    const route = rel === '/index.html' ? '/' : rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
    const want = self(route);
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];

    if (/<meta name="robots" content="noindex">/.test(html)) {
      if (canon) fail.push(`${rel}: noindex page also carries a canonical (${canon})`);
    } else if (!canon) {
      fail.push(`${rel}: no canonical while ORIGIN is set`);
    } else if (canon !== want) {
      fail.push(`${rel}: canonical is ${canon}, should be ${want}`);
    } else {
      canonicals.add(want);
    }

    const ogUrl = (html.match(/property="og:url" content="([^"]+)"/) || [])[1];
    if (ogUrl !== want) fail.push(`${rel}: og:url is ${ogUrl || 'missing'}, should be ${want}`);
    /* Absolute, or the card is blank everywhere the link gets pasted. */
    for (const prop of ['og:image', 'twitter:image']) {
      const v = (html.match(new RegExp(`"${prop}" content="([^"]+)"`)) || [])[1];
      if (!v || !v.startsWith(origin + '/'))
        fail.push(`${rel}: ${prop} must be absolute on ${origin} — got ${v || 'nothing'}`);
    }
  }

  for (const loc of locs)
    if (!canonicals.has(loc)) fail.push(`sitemap.xml lists ${loc}, which no page claims as its canonical`);
  for (const want of canonicals)
    if (!locs.includes(want)) fail.push(`${want} is canonical but missing from sitemap.xml`);
}

/* The project URL (travist6983.github.io/Rascal-Marketing) was the deploy target
   until the custom domain existed. A leftover reference in shipped output points
   at a URL that now only redirects, and in a canonical or an OG tag it hands the
   ranking away. Swept across the twins and the llms indexes too — they carry
   links of their own. */
for (const file of files.filter((f) => /\.(html|md|txt|xml)$/.test(f))) {
  const stale = (await readFile(file, 'utf8')).match(/[^\s"'<>()]*github\.io[^\s"'<>()]*/);
  if (stale) fail.push(`/${relative(dist, file)}: stale project URL ${stale[0]}`);
}

/* ------------------------------------------------- the free tier, in words */
/* On Aug 21 2026 the owner reversed D2 and narrowed D3 in the app repo: the free
   tier became the daily question only, and the missions became part of
   membership. "Every question and every mission, forever, uncapped" was true
   when it was written and false the next morning — and it was not in one place.
   It was on the home page, on /faq, inside TWO FAQPage JSON-LD blocks, in the
   /pricing FAQ, in the Qeepsake and Tinybeans comparisons, in the sitewide
   SoftwareApplication offer in layout.html, in the llms.txt summary this build
   writes, and baked into the pixels of two committed OG cards.

   Nothing in this file would have failed if any one of them came back. That is
   the gap this section closes, and it is deliberately a COPY assertion in a
   suite that otherwise checks structure — because the failure this phase
   existed to fix was never structural. The page was valid HTML the whole time.

   Run over dist/ rather than src/, because the markdown twins and llms*.txt are
   generated from the rendered bodies: a correction applied to a page and not
   rebuilt shows up here and nowhere else. */
/* Break-tested, eight ways, and the break-test earned its keep on the first
   run: five of these ten patterns were written with `\b` word boundaries that a
   generator turned into literal 0x08 bytes, so they matched nothing and would
   have matched nothing forever. The suite was green either way. Re-introducing
   the claim was the only thing that could tell the difference — which is the
   same lesson the app repo wrote down when a listener guard was pinned by two
   substrings that survived the edit that broke it. If you add a pattern here,
   break it before you trust it. */
const TIER_BANNED = [
  [/every question and every mission/i, 'the free tier is the daily question; the missions are membership'],
  [/every prompt,? (?:is )?free|all the prompts,? free/i, 'only the daily question is free; 103 of the 133 prompts are missions'],
  [/free inside the app forever/i, 'true of the daily question, false of the library'],
  [/that'?s the line,? and it'?s the only one/i, 'photos are no longer the only line — missions, video and the second parent are too'],
  [/\bnothing is (?:ever )?locked\b/i, 'the promise is narrowed: nothing you WRITE OR CAPTURE is locked. The day is.'],
  [/\bprompts?(?: volume)?(?: (?:are|is))? never metered\b/i, 'the QUESTION is never metered; the missions are metered by tier now'],
  [/\b[A-Z][a-z]+ Plus\b/, 'the paid tier is called membership — never Plus, Premium, Pro'],
  [/\b(?:Premium|Unlock|Upgrade)\b/i, 'banned by the app\'s own copy rules — a person JOINS, they do not upgrade'],
  [/\bPro\b/, 'banned tier word (Product, Promise and Prompts are fine — this is the bare word)'],
  [/limited time|only \d+ left|join before|don'?t lose|you'?ve missed/i, 'no urgency, no scarcity, no guilt — anywhere, ever'],
];
for (const file of files.filter((f) => /\.(html|md|txt)$/.test(f))) {
  const raw = await readFile(file, 'utf8');
  /* HTML comments are where a removal explains itself, and an explanation that
     quotes the banned phrase is the opposite of a regression. Strip them first
     so the note above a deleted row cannot fail the build the row's deletion
     was the point of. */
  const visible = raw.replace(/<!--[\s\S]*?-->/g, '');
  for (const [re, why] of TIER_BANNED) {
    const hit = visible.match(re);
    if (hit) fail.push(`/${relative(dist, file)}: tier copy "${hit[0]}" — ${why}`);
  }
}

/* The other half: one sentence that must be PRESENT. D3 as narrowed says the
   archive is never locked and the day is, and this is that promise in the
   reader's own words. The phase brief requires it near the table and at least
   as prominent as the price, so it is asserted on the page and in the twin —
   a promise that survives in HTML and vanishes from the Markdown an LLM reads
   has been half-deleted. */
for (const rel of ['pricing/index.html', 'pricing.md']) {
  let text;
  try {
    text = await readFile(join(dist, rel), 'utf8');
  } catch {
    fail.push(`${rel} is missing — /pricing must ship both an HTML page and a Markdown twin`);
    continue;
  }
  if (!/ever locked behind payment/i.test(text))
    fail.push(`/${rel}: the load-bearing promise is gone — "Nothing you write or capture is ever locked behind payment"`);
  if (!/membership buys more of the day/i.test(text))
    fail.push(`/${rel}: the second half of the promise is gone — "Membership buys more of the day — never access to your own archive"`);
}

/* The pricing table's paid column is named, and the free column is not a row of
   dashes. free-tier-copy.md rule 6 says the free tier is described positively
   and first; a table whose free side is all em dashes reads as a punishment
   list whatever the prose above it says, so the shape is asserted rather than
   trusted to survive the next edit. */
{
  const html = await readFile(join(dist, 'pricing', 'index.html'), 'utf8').catch(() => '');
  const table = (html.match(/<table class="tbl">[\s\S]*?<\/table>/) || [''])[0];
  if (!table) fail.push('/pricing: the comparison table is gone');
  else {
    if (!/<th scope="col" class="is-ours">Membership<\/th>/.test(table))
      fail.push('/pricing: the paid column must be headed "Membership"');
    const freeCells = [...table.matchAll(/<th scope="row">[\s\S]*?<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map((m) => m[1].replace(/<[^>]*>/g, '').trim());
    const worded = freeCells.filter((c) => c && c !== '—').length;
    const dashed = freeCells.filter((c) => c === '—').length;
    if (worded <= dashed)
      fail.push(`/pricing: the free column is ${worded} entries against ${dashed} em dashes — it reads as a punishment list`);
  }
}

/* ------------------------------------------- the two links the app follows */
/* The iOS paywall renders Terms and Privacy from build variables TERMS_URL and
   PRIVACY_URL, which must be exactly these two routes. It is a cross-repository
   dependency that fails SILENTLY in both directions: the app refuses to render a
   link with no host, but it will happily render one pointing at a 404, so a
   rename here leaves an App Review reviewer following a dead link and nothing on
   either side goes red. Missing Terms/Privacy on a subscription paywall is a
   rejection under guideline 3.1.2(c). Three lines to make a rename loud.
   The finding, and the values, are in Project-Rascal's
   docs/design/design-conformance-110.md §7.4. */
for (const route of ['terms', 'privacy']) {
  let page;
  try {
    page = await readFile(join(dist, route, 'index.html'), 'utf8');
  } catch {
    fail.push(`/${route} does not exist — the iOS paywall links to it and cannot tell that it 404s`);
    continue;
  }
  if (/name="robots" content="noindex/.test(page))
    fail.push(`/${route} is noindex — a legal page an App Review reviewer follows must be indexable`);
  if (origin && !page.includes(`<link rel="canonical" href="${origin}/${route}"`))
    fail.push(`/${route}: canonical must be exactly ${origin}/${route}, with no trailing slash`);
}

/* ------------------------------------------------------- markdown twins */
/* Every page that declares a markdown alternate must ship one; llms.txt must
   exist and every link in it must resolve; the twins must be actual markdown —
   no unresolved tokens and no leaked HTML tags. */
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
  for (const t of md.matchAll(/\{\{([A-Z0-9_]+)\}\}/g))
    fail.push(`${alt}: unresolved token {{${t[1]}}}`);
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
    /* `load` and then fonts, deliberately not `networkidle`. The signup form
       loads Cloudflare Turnstile, which holds a blob: request open for as long
       as the widget lives, so networkidle NEVER fires on /waitlist or on / and
       this suite died at the goto — before the report at the bottom, which is
       why every static failure it found was invisible. A break-test that cannot
       print its findings is worse than no break-test. `document.fonts.ready` is
       what the Nunito assertion below actually needed from networkidle anyway. */
    await page.goto(base + route, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
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
  await page.goto(base + '/waitlist', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
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
