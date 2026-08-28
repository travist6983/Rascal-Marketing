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
 *   6. Emits canonicals, absolute OG URLs, an Organization url, sitemap.xml and
 *      the Pages CNAME ONLY if ORIGIN is set. A canonical pointing at a domain
 *      you don't own is worse than none.
 */
import { readFile, writeFile, mkdir, readdir, copyFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname, sep } from 'node:path';
import { htmlToMarkdown } from './markdown.mjs';

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
 * Resolves to a fixed point, not in one pass: a token's value can itself contain
 * a token. SUPPORT_EMAIL is "hello@{{DOMAIN}}", and one pass expanded that to a
 * literal `mailto:hello@{{DOMAIN}}` — on five pages, four Markdown twins,
 * llms-full.txt and site.js. It was invisible for exactly as long as DOMAIN's own
 * value was the string "{{DOMAIN}}", and would have gone public the hour a real
 * domain replaced it — which was getvellumapp.com on Aug 18 2026, and is
 * pocketchronicle.app since the Aug 27 2026 rename. The bug was fixed before
 * either of them landed, so neither shipped it; the second domain move is the
 * first one to have run through this expander with the guard already in place.
 *
 * A self-referencing value is still safe, which is what the single pass was
 * protecting against: replacing "{{DOMAIN}}" with "{{DOMAIN}}" changes nothing,
 * so the no-change test ends the loop on the first pass instead of spinning. The
 * pass cap only catches a real cycle between two tokens, and throws rather than
 * shipping a half-expanded string.
 */
function fill(text, extra = {}) {
  const table = { ...tokens, ...extra };
  const once = (s) =>
    s.replace(/\{\{([A-Z0-9_]+)\}\}/g, (whole, key) =>
      Object.prototype.hasOwnProperty.call(table, key) ? table[key] : whole
    );
  let out = text;
  for (let pass = 0; pass < 6; pass++) {
    const next = once(out);
    if (next === out) return out;
    out = next;
  }
  throw new Error('{{TOKEN}} expansion never settled — a token cycle in site.config.json');
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

/* Every indexable page also ships as Markdown (route + ".md") with an
   /llms.txt index — the emerging convention for making a site legible to
   LLMs and their crawlers without scraping the HTML. */
const mdPath = (route) => (route === '/' ? '/index.md' : route + '.md');
const mdPages = [];

for (const file of pages) {
  const raw = await readFile(file, 'utf8');
  const { meta, body: rawBody } = frontMatter(raw);
  const { route, out, inSitemap } = routeFor(file);

  if (!meta.title || !meta.description) {
    throw new Error(`${route}: front-matter needs both a title and a description`);
  }

  const expanded = await expandIncludes(rawBody);
  const { head: pageHead, body } = hoistHead(expanded);

  /* noindex: true in front-matter — /thanks is a post-signup page, not a result. */
  const noindex = meta.noindex === 'true';
  const robots = noindex ? '<meta name="robots" content="noindex">\n' : '';

  /* seo-plan.md: canonicals are self-referencing, and OG images must be absolute
     to survive being pasted into a parenting group. Both need an origin, so both
     waited for one rather than shipping a guess.

     The canonical waits on one more thing: the page being indexable. A noindex
     page with a self-canonical asks a crawler to keep the URL and to drop it in
     the same breath, and the three noindex pages here (404, thanks, unsubscribed)
     want only the robots tag. The absolute OG URLs still go on all of them —
     /thanks does get pasted into a group chat, it just isn't a search result. */
  const origin = (config.ORIGIN || '').replace(/\/$/, '');
  const pageUrl = origin + (route === '/' ? '/' : route);
  const ogImage = meta.og || '/assets/og/default.png';
  const canonical = !origin ? '' :
    (noindex ? '' : `<link rel="canonical" href="${esc(pageUrl)}">\n`) +
    `<meta property="og:url" content="${esc(pageUrl)}">\n` +
    `<meta property="og:image" content="${esc(origin + ogImage)}">\n` +
    `<meta name="twitter:image" content="${esc(origin + ogImage)}">\n`;

  const hasMd = !noindex;
  if (hasMd) mdPages.push({ route, title: fill(meta.title), description: fill(meta.description), body });

  const depth = out.split('/').length - 1;
  const html = fill(layout, {
    PAGE_TITLE: esc(fill(meta.title)),
    PAGE_DESC: esc(fill(meta.description)),
    PAGE_CLASS: meta.class || '',
    PAGE_ROUTE: route,
    HEAD_CANONICAL: robots + canonical +
      (hasMd ? `<link rel="alternate" type="text/markdown" href="${mdPath(route)}" title="Markdown version of this page">\n` : ''),
    /* seo-plan.md wants Organization sitewide, and an Organization with no url is
       an entity a crawler cannot tie to anything. The domain is what supplies it,
       so this stays gated on ORIGIN exactly like the canonicals above. */
    JSONLD_URL: origin ? `"url": ${JSON.stringify(origin)},\n      ` : '',
    /* sameAs is a machine-readable claim that a profile IS this product, which is a
       stronger thing to say than a footer link a reader can shrug at. So it is built
       from the SOCIAL_* keys rather than written into the markup: a platform with no
       key emits nothing, and the JSON stays valid either way. Adding a second real
       account is one key in site.config.json and no edit here.

       Empty until Aug 27 2026 for a reason worth keeping: an Instagram account existed
       from Aug 20 2026 but its handle was recorded nowhere in this repository, and a
       guessed sameAs is a crawler-legible lie. The Pocket Chronicle rename supplied the
       handle, so the list is no longer empty — and it points at the NEW account, never
       at the frozen @getvellum.app. */
    JSONLD_SAMEAS: (() => {
      const profiles = Object.keys(config)
        .filter((k) => k.startsWith('SOCIAL_') && typeof config[k] === 'string')
        .sort()
        .map((k) => fill(String(config[k])))
        .filter(Boolean);
      return profiles.length
        ? `"sameAs": ${JSON.stringify(profiles)},\n      `
        : '';
    })(),
    HEAD_EXTRA: fill(pageHead),
    BODY: body
  });

  /* One call, not two. The body used to be spliced in as a raw {{BODY}} and then
     filled by a second pass, which is why a token inside a token never resolved
     in page copy. fill() settles now, so layout, hoisted head and body all come
     out of the same expansion. */
  const dest = join(dist, out);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, html);

  const title = fill(meta.title);
  if (seenTitles.has(title)) {
    console.warn(`  ! duplicate title: ${route} and ${seenTitles.get(title)}`);
  }
  seenTitles.set(title, route);

  built.push({ route, out, title, description: fill(meta.description), inSitemap: inSitemap && !noindex, depth });
}

/* ------------------------------------------------- markdown twins + llms.txt */

{
  const routesWithMd = new Set(mdPages.map((p) => p.route));
  /* Markdown pages link to Markdown pages, so a text-only crawler never has
     to leave text. Anchors survive the rewrite. */
  const mapHref = (href) => {
    if (!href.startsWith('/')) return href;
    const [path, hash] = href.split('#');
    const clean = path.replace(/\/$/, '') || '/';
    return routesWithMd.has(clean) ? mdPath(clean) + (hash ? '#' + hash : '') : href;
  };

  for (const p of mdPages) {
    p.md =
      `---\ntitle: ${fill(p.title)}\ndescription: ${fill(p.description)}\nurl: ${p.route}\n---\n\n` +
      htmlToMarkdown(fill(p.body), { mapHref });
    const dest = join(dist, mdPath(p.route).slice(1));
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, p.md);
  }

  /* llms.txt — H1, one-line summary, then grouped links to the .md twins.
     The order is editorial: the pages a reader (of any species) should hit
     first come first. Unlisted new routes append under their group or Pages. */
  const GROUPS = [
    ['Product', ['/', '/how-it-works', '/prompts', '/pricing', '/promise', '/faq', '/waitlist']],
    ['Comparisons', ['/compare/tinybeans', '/compare/qeepsake', '/compare/camera-roll']],
    ['Blog', ['/blog', '/blog/the-photo-survives', '/blog/what-to-write-in-a-keepsake-book',
      '/blog/streaks-are-a-bad-idea', '/blog/record-your-kids-voice', '/blog/an-archive-they-can-inherit']],
    ['Small print', ['/privacy', '/terms']]
  ];
  const listed = new Set(GROUPS.flatMap(([, rs]) => rs));
  const leftovers = mdPages.filter((p) => !listed.has(p.route)).map((p) => p.route);
  if (leftovers.length) GROUPS.splice(1, 0, ['Pages', leftovers]);

  const LABELS = {
    '/': 'Home', '/how-it-works': 'How it works', '/prompts': 'The prompt library',
    '/pricing': 'Pricing', '/promise': 'The promise', '/faq': 'FAQ',
    '/waitlist': 'Get tomorrow’s prompt',
    '/compare/tinybeans': '{{PRODUCT}} vs Tinybeans', '/compare/qeepsake': '{{PRODUCT}} vs Qeepsake',
    '/compare/camera-roll': 'Why not just use your camera roll?',
    '/blog': 'Blog', '/privacy': 'Privacy', '/terms': 'Terms'
  };
  const byRoute = new Map(mdPages.map((p) => [p.route, p]));
  const section = ([name, routes]) => {
    const lines = routes.filter((r) => byRoute.has(r)).map((r) => {
      const p = byRoute.get(r);
      const label = LABELS[r] || p.title.split(' | ')[0];
      return `- [${label}](${mdPath(r)}): ${p.description}`;
    });
    return lines.length ? `## ${name}\n\n${lines.join('\n')}` : '';
  };

  const llms = fill(
    `# {{PRODUCT}}\n\n` +
    `> A private, prompted archive of your kid's childhood — every moment saved with the question that caused it.\n\n` +
    `{{PRODUCT}} asks parents a question about their kid every day — free, forever — and adds a ` +
    `daily mission with membership. It files every answer with the prompt that caused it and ` +
    `builds a searchable archive a kid can inherit. No streaks, no ads, on iPhone. Every page ` +
    `below is available as Markdown; the whole site's text is in ` +
    `[llms-full.txt](/llms-full.txt).\n\n` +
    GROUPS.map(section).filter(Boolean).join('\n\n') + '\n'
  );
  await writeFile(join(dist, 'llms.txt'), llms);

  await writeFile(
    join(dist, 'llms-full.txt'),
    mdPages.map((p) => p.md).join('\n\n---\n\n')
  );
  console.log(`markdown: ${mdPages.length} pages → *.md, llms.txt, llms-full.txt`);
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

/* GitHub Pages takes the custom domain from a CNAME file in the published
   artifact. Deriving it from ORIGIN rather than committing a literal keeps the
   domain a one-line config edit — and makes the worst failure unreachable: a
   deploy without this file falls back to the project URL (/<repo-name>/), where
   every root-absolute link on the site 404s. */
if (origin) await writeFile(join(dist, 'CNAME'), new URL(origin).host + '\n');

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
  console.log('\n  ORIGIN is empty in site.config.json — no canonicals, no sitemap.xml, no CNAME.');
  console.log('  Set it to the real https origin and all three appear on the next build.');
}
