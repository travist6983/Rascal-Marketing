#!/usr/bin/env node
/**
 * Builds the web derivatives of the app screenshots into src/media/.
 *
 *   npm run media
 *
 * assets/screens holds 1206 × 2622 device captures — 1 to 3 MB each — and that
 * directory is also the Remotion project's public dir, read through staticFile().
 * It is not a web asset folder and must not become one, so the originals stay
 * untouched and the site reads only what this script writes.
 *
 * Each entry is emitted at 2× its largest CSS width, as WebP with a PNG
 * fallback, and its real pixel dimensions are written to media.json so every
 * <img> can carry explicit width and height. Missing dimensions is the most
 * common cause of layout shift, and the animated hero is already the riskiest
 * thing on the page for CLS.
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'assets', 'screens');
const to = join(root, 'src', 'media');

/* name → the widest this is ever painted, in CSS px. Doubled for the export. */
const WANTED = {
  'today-two-missions': 330,
  'timeline-all': 300,
  'timeline-search': 300,
  'entry-question-answered': 300,
  'entry-sealed-locked': 280,
  'entry-sealed-open': 280,
  'entry-voice': 300,
  'entry-photo-single': 300,
  'entry-written-note': 300,
  'moments-on-this-day': 300,
  'timeline-filter-voice': 300,
  'composer-empty': 300
};

await mkdir(to, { recursive: true });

async function has(bin) {
  try { await run('which', [bin]); return true; } catch { return false; }
}
if (!(await has('cwebp'))) {
  console.error('cwebp not found. brew install webp, then re-run.');
  process.exit(1);
}

const manifest = {};
for (const [name, cssWidth] of Object.entries(WANTED)) {
  const source = join(from, `${name}.png`);
  try { await stat(source); } catch {
    console.warn(`  ! skipped ${name} — no such capture in assets/screens`);
    continue;
  }

  const width = cssWidth * 2;

  await run('cwebp', ['-q', '82', '-resize', String(width), '0', source, '-o', join(to, `${name}.webp`)]);
  await run('sips', ['--resampleWidth', String(width), source, '--out', join(to, `${name}.png`)]);
  /* sips writes a full-fat PNG; requantising keeps the fallback from being
     four times the size of the thing it is a fallback for. */
  if (await has('pngquant')) {
    await run('pngquant', ['--force', '--skip-if-larger', '--quality', '60-88',
      '--output', join(to, `${name}.png`), join(to, `${name}.png`)]).catch(() => {});
  }

  const info = await run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', join(to, `${name}.png`)]);
  const w = Number(info.stdout.match(/pixelWidth:\s*(\d+)/)[1]);
  const h = Number(info.stdout.match(/pixelHeight:\s*(\d+)/)[1]);
  const webpSize = (await stat(join(to, `${name}.webp`))).size;
  const pngSize = (await stat(join(to, `${name}.png`))).size;

  manifest[name] = { w, h };
  console.log(
    `  ${name.padEnd(26)} ${w}×${h}  webp ${(webpSize / 1024).toFixed(0)}k  png ${(pngSize / 1024).toFixed(0)}k`
  );
}

await writeFile(join(to, 'media.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nmedia: ${Object.keys(manifest).length} screenshots → src/media/`);
