import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = '/Users/travis/repos/personal/Rascal-Marketing/dist';
const OUT = process.argv[2] || 'before';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.md': 'text/markdown', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let f = path.join(ROOT, p);
  let buf;
  try { buf = await readFile(f); } catch {
    try { buf = await readFile(f + '.html'); f += '.html'; } catch { res.writeHead(404); return res.end('nf'); }
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  res.end(buf);
});
await new Promise(r => srv.listen(4321, r));

const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
await pg.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

// force every lazy image to load
await pg.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
  window.scrollTo(0, document.body.scrollHeight);
});
await pg.waitForTimeout(1500);
await pg.evaluate(() => window.scrollTo(0, 0));
await pg.waitForTimeout(600);

const dir = '/private/tmp/claude-501/-Users-travis-repos-personal-Rascal-Marketing/8f58c1c5-799c-44fd-9fb5-5585da78d719/scratchpad';

for (const id of ['arch-phone', 'sealphone']) {
  const el = await pg.$('#' + id);
  if (!el) { console.log('missing', id); continue; }
  await el.scrollIntoViewIfNeeded();
  await pg.waitForTimeout(700);
  await el.screenshot({ path: `${dir}/${OUT}-${id}.png` });
  const info = await el.evaluate(node => [...node.querySelectorAll('picture')].map((pic, i) => {
    const img = pic.querySelector('img');
    const cs = getComputedStyle(pic);
    return { i, pos: cs.position, bg: cs.backgroundColor, imgOpacity: getComputedStyle(img).opacity, natural: img.naturalWidth };
  }));
  console.log(id, JSON.stringify(info));
}

// sealphone after clicking Open it
await pg.click('#seal');
await pg.waitForTimeout(800);
const seal = await pg.$('#sealphone');
await seal.screenshot({ path: `${dir}/${OUT}-sealphone-opened.png` });

await b.close();
srv.close();
