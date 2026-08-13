#!/usr/bin/env node
/**
 * Builds dist/artifact.html — a single self-contained fragment for publishing
 * as a Claude Artifact. The published page supplies its own <!doctype>, <html>,
 * <head> and <body>, so this strips ours and inlines everything a strict CSP
 * would block: the stylesheet, the script, and the two webfonts.
 *
 *   npm run build:artifact
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(join(root, p), 'utf8');

const [html, css, js] = await Promise.all([
  read('index.html'),
  read('styles.css'),
  read('app.js')
]);

// Fonts → data URIs. The artifact CSP blocks every external host.
const fontRefs = [...css.matchAll(/url\('(fonts\/[^']+\.woff2)'\)/g)];
let inlinedCss = css;
for (const [match, path] of fontRefs) {
  const b64 = (await readFile(join(root, path))).toString('base64');
  inlinedCss = inlinedCss.replace(match, `url(data:font/woff2;base64,${b64})`);
}

const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, 'Dogear'])[1];
const body = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'))
  .replace('<script src="app.js"></script>', '')
  .trim();

const out = [
  `<title>${title}</title>`,
  `<style>\n${inlinedCss}\n</style>`,
  body,
  `<script>\n${js}\n</script>`
].join('\n\n');

await mkdir(join(root, 'dist'), { recursive: true });
await writeFile(join(root, 'dist/artifact.html'), out + '\n');

console.log(
  `dist/artifact.html — ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB ` +
  `(${fontRefs.length} fonts inlined)`
);
