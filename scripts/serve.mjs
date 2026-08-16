#!/usr/bin/env node
/**
 * Zero-dependency static server for the built site: `npm run build && npm run serve`.
 *
 * Serves dist/ the way the production host will: clean URLs resolve to
 * <route>/index.html, and anything unknown gets dist/404.html with a real 404
 * status — so what you preview locally is what ships, including the miss page.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

async function resolve(pathname) {
  let rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const tries = rel.endsWith('/')
    ? [rel + 'index.html']
    : extname(rel)
      ? [rel]
      : [rel + '/index.html', rel + '.html'];
  for (const t of tries) {
    const file = join(root, t);
    if (!file.startsWith(root)) continue;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = await resolve(pathname);

  if (file) {
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
    return;
  }

  try {
    const miss = await readFile(join(root, '404.html'));
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(miss);
  } catch {
    res.writeHead(404, { 'Content-Type': TYPES['.txt'] });
    res.end('not found — run `npm run build` first\n');
  }
}).listen(port, () => {
  console.log(`serving dist/ at http://localhost:${port}`);
});
