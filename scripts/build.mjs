#!/usr/bin/env node
/**
 * Renders src/ into dist/ as plain static HTML. Zero dependencies.
 *
 *   npm run build
 *
 * There is no framework here and there is not going to be one. seo-plan.md puts
 * "server-rendered / static HTML, no client-side-only content" at the top of the
 * technical checklist, and the cheapest way to keep that promise is to ship files
 * a webserver can hand over without running anything.
 *
 * What this does, in order:
 *
 *   1. Reads site.config.json. Every {{TOKEN}} in src/ resolves from there, which
 *      is what makes a rename or a price change one edit instead of twenty.
 *   2. Parses a page's front-matter block for its title, description and route.
 *   3. Expands <!--#include partials/x.html --> so the nav exists once, not 20 times.
 *   4. Hoists any <template data-head> into <head>, which is how JSON-LD and
 *      per-page preloads get out of the body without a templating language.
 *   5. Writes dist/<route>/index.html so URLs are clean with no server rules.
 *   6. Emits canonicals, absolute OG URLs and sitemap.xml ONLY if ORIGIN is set.
 *      A canonical pointing at a domain you don't own is worse than none.
 */
import { readFile, writeFile, mkdir, readdir, copyFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

const config = JSON.parse(await readFile(join(root, 'site.config.json'), 'utf8'));

/* Keys starting with _ are notes to a human reading the config, not tokens. */
const tokens = Object.fromEntries(
  Object.entries(config).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string')
);

/* ------------------------------------------------------------------ helpers */

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/* Text assets go through the same token table as the markup. site.js needs
   SUPPORT_EMAIL for its failure string and site.css names the product in a
   comment; neither should be the one place a rename forgets to reach. */
const FILLABLE = new Set(['.css', '.js', '.svg', '.txt', '.webmanifest']);

async function copyTree(from, to) {
  try {
    await stat(from);
  } catch {
    return 0;
  }
  let n = 0;
  for (const file of await walk(from)) {
    const dest = join(to, relative(from, file));
    await mkdir(dirname(dest), { recursive: true });
    if (FILLABLE.has(extname(file))) {
      await writeFile(dest, fill(await readFile(file, 'utf8')));
    } else {
      await copyFile(file, dest);
    }
    n++;
  }
  return n;
}

/**
 * Single pass, deliberately. PRODUCT's default value is the literal string
 * "{{PRODUCT}}" while the name is unresolved, and a recursive replace would
 * either loop forever on that or quietly eat it.
 */
function fill(text, extra = {}) {
  const table = { ...tokens, ...extra };
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(table, key) ? table[key] : whole
  );
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Front-matter: single-line key: value pairs in a leading HTML comment.
   Anything that needs to be multi-line (JSON-LD) belongs in <template data-head>. */
function frontMatter(text) {
  const m = text.match(/^<!--page\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error('page is missing its <!--page ... --> block');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*([a-z_]+)\s*:\s*(.*?)\s*$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: text.slice(m[0].length) };
}

async function expandIncludes(text, depth = 0) {
  if (depth > 8) throw new Error('include nesting too deep — probably a cycle');
  const re = /<!--#include\s+([^\s]+)\s*-->/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    out += text.slice(last, m.index);
    out += await expandIncludes(await readFile(join(src, m[1]), 'utf8'), depth + 1);
    last = m.index + m[0].length;
  }
  return out + text.slice(last);
}

/* <template data-head> is how a page gets JSON-LD or a preload into <head>
   without inventing a template language to hold a multi-line value. */
function hoistHead(body) {
  let head = '';
  const stripped = body.replace(/<template data-head>([\s\S]*?)<\/template>\s*/g, (_, inner) => {
    head += inner.trim() + '\n';
    return '';
  });
  return { head, body: stripped };
}

/* ------------------------------------------------------------------- routes */

function routeFor(file) {
  const rel = relative(join(src, 'pages'), file).split(sep).join('/');
  if (rel === '404.html') return { route: '/404', out: '404.html', inSitemap: false };
  const slug = rel.replace(/\.html$/, '').replace(/\/index$/, '');
  if (slug === 'index') return { route: '/', out: 'index.html', inSitemap: true };
  return { route: '/' + slug, out: slug + '/index.html', inSitemap: true };
}

/* --------------------------------------------------------------------- main */

/* The layout carries includes too — the header and footer live there. Expand
   them here, not just in page bodies, or every page ships with no nav and no
   footer and the only symptom is an HTML comment that renders as nothing. */
const layout = await expandIncludes(await readFile(join(src, 'layout.html'), 'utf8'));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const pages = (await walk(join(src, 'pages'))).filter((f) => extname(f) === '.html').sort();
const built = [];
const seenTitles = new Map();

for (const file of pages) {
  const raw = await readFile(file, 'utf8');
  const { meta, body: rawBody } = frontMatter(raw);
  const { route, out, inSitemap } = routeFor(file);

  if (!meta.title || !meta.description) {
    throw new Error(`${route}: front-matter needs both a title and a description`);
  }

  const expanded = await expandIncludes(rawBody);
  const { head: pageHead, body } = hoistHead(expanded);

  /* seo-plan.md: canonicals are self-referencing, and OG images must be absolute
     to survive being pasted into a parenting group. Both need an origin, so both
     wait for one rather than shipping a guess. */
  const origin = (config.ORIGIN || '').replace(/\/$/, '');
  const ogImage = meta.og || '/assets/og/default.png';
  const canonical = origin
    ? `<link rel="canonical" href="${esc(origin + (route === '/' ? '/' : route))}">\n` +
      `<meta property="og:url" content="${esc(origin + (route === '/' ? '/' : route))}">\n` +
      `<meta property="og:image" content="${esc(origin + ogImage)}">\n` +
      `<meta name="twitter:image" content="${esc(origin + ogImage)}">\n`
    : '';

  /* noindex: true in front-matter — /thanks is a post-signup page, not a result. */
  const noindex = meta.noindex === 'true';
  const robots = noindex ? '<meta name="robots" content="noindex">\n' : '';

  const depth = out.split('/').length - 1;
  const html = fill(layout, {
    PAGE_TITLE: esc(fill(meta.title)),
    PAGE_DESC: esc(fill(meta.description)),
    PAGE_CLASS: meta.class || '',
    PAGE_ROUTE: route,
    HEAD_CANONICAL: robots + canonical,
    HEAD_EXTRA: fill(pageHead),
    BODY: body
  });

  const finished = fill(html);
  const dest = join(dist, out);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, finished);

  const title = fill(meta.title);
  if (seenTitles.has(title)) {
    console.warn(`  ! duplicate title: ${route} and ${seenTitles.get(title)}`);
  }
  seenTitles.set(title, route);

  built.push({ route, out, title, description: fill(meta.description), inSitemap: inSitemap && !noindex, depth });
}

/* Static files. assets/ is shared with the Remotion project through staticFile(),
   so src/media holds the web derivatives and the originals are never copied. */
const copied =
  (await copyTree(join(src, 'assets'), join(dist, 'assets'))) +
  (await copyTree(join(src, 'media'), join(dist, 'media'))) +
  (await copyTree(join(root, 'fonts'), join(dist, 'fonts')));

/* robots.txt always. Sitemap only once there is an origin to put in it. */
const origin = (config.ORIGIN || '').replace(/\/$/, '');
await writeFile(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n` + (origin ? `\nSitemap: ${origin}/sitemap.xml\n` : '')
);

if (origin) {
  const urls = built
    .filter((p) => p.inSitemap)
    .map((p) => `  <url><loc>${esc(origin + (p.route === '/' ? '/' : p.route))}</loc></url>`)
    .join('\n');
  await writeFile(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
}

console.log(`built ${built.length} routes, ${copied} static files → dist/`);
for (const p of built) {
  const over = p.title.length > 60 ? `  ← title ${p.title.length} chars, cap is 60` : '';
  console.log(`  ${p.route.padEnd(28)} ${String(p.title.length).padStart(3)}${over}`);
}
if (!origin) {
  console.log('\n  ORIGIN is empty in site.config.json — no canonicals, no sitemap.xml.');
  console.log('  Set it to the real https origin and both appear on the next build.');
}
