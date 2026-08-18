#!/usr/bin/env node
/**
 * Renders the prompt library as social cards — one prompt per PNG, sized for a
 * feed. Copy and kinds come from social/prompts.js, the design from
 * social/card.css, the rendering engine from social/card.mjs.
 *
 *   npm run social                    every prompt, Instagram portrait
 *   npm run social -- --sheet         and a contact sheet of the set
 *   npm run social -- --kind PHOTO,QUESTION --size square
 *
 * This is the review surface — it renders everything so you can look at the
 * set. `npm run social:queue` is what puts specific cards in front of the
 * poster. Uses the system Chrome directly: no `npm install`, no browser
 * download. (`npm run check` still drives Playwright, which is a different job.)
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { PROMPTS, KIND } from '../social/prompts.js';
import {
  SIZES,
  cardHtml,
  escapeHtml,
  findChrome,
  loadAssets,
  plain,
  pool,
  root,
  shoot,
  slugify
} from '../social/card.mjs';

const HELP = `
Vellum social cards

  npm run social -- [options]

  --size portrait|square|story                              (portrait)
  --kind  QUESTION,PHOTO,VIDEO,VOICE,ACTIVITY,LETTER
  --cadence daily,weekly,monthly
  --limit N          first N after filtering
  --out DIR          where the PNGs land                    (social/out)
  --sheet            also write a contact sheet of the set
  --keep-html        leave the intermediate HTML beside the PNGs
  --concurrency N    parallel Chrome processes              (5)
`;

/* --------------------------------------------------------------------------
   Contact sheet
   -------------------------------------------------------------------------- */

const SHEET_PAD = 32;
const SHEET_GAP = 22;
const SHEET_HEAD = 118;
const SHEET_COLS = 4;
const SHEET_SCALE = 0.3;

function sheetSize(size, count) {
  const w = Math.round(size.w * SHEET_SCALE);
  const h = Math.round(size.h * SHEET_SCALE);
  const rows = Math.ceil(count / SHEET_COLS);
  return {
    card: { w, h },
    w: SHEET_PAD * 2 + SHEET_COLS * w + (SHEET_COLS - 1) * SHEET_GAP,
    h: SHEET_HEAD + SHEET_PAD + rows * h + (rows - 1) * SHEET_GAP
  };
}

function sheetHtml(jobs, { fonts, size, title }) {
  const sheet = sheetSize(size, jobs.length);
  const tiles = jobs
    .map(
      (job) =>
        `<img src="${escapeHtml(basename(job.png))}" width="${sheet.card.w}" height="${sheet.card.h}" alt="">`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${fonts}
* { box-sizing: border-box; }
body { margin:0; width:${sheet.w}px; background:#EFE9DF; }
.sheet { padding:${SHEET_PAD}px; }
h1 { margin:14px 0 0; font:400 15px/1 ui-monospace,Menlo,monospace; letter-spacing:.14em;
     text-transform:uppercase; color:#6E6A63; }
p  { margin:10px 0 30px; font:400 14px/1 ui-monospace,Menlo,monospace; color:#B4ADA3; }
.grid { display:grid; grid-template-columns:repeat(${SHEET_COLS}, ${sheet.card.w}px); gap:${SHEET_GAP}px; }
img { display:block; }
</style>
</head>
<body>
<div class="sheet">
  <h1>${escapeHtml(title)}</h1>
  <p>${jobs.length} cards, at ${Math.round(SHEET_SCALE * 100)}%</p>
  <div class="grid">${tiles}</div>
</div>
</body>
</html>
`;
}

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const opts = {
    size: 'portrait',
    kinds: null,
    cadence: null,
    limit: null,
    out: join(root, 'social', 'out'),
    sheet: false,
    keepHtml: false,
    concurrency: 5,
    help: false
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined) throw new Error(`${flag} needs a value`);
      return next;
    };
    const list = () => value().split(',').map((s) => s.trim()).filter(Boolean);
    switch (flag) {
      case '--size': opts.size = value(); break;
      case '--kind': opts.kinds = list().map((s) => s.toUpperCase()); break;
      case '--cadence': opts.cadence = list().map((s) => s.toLowerCase()); break;
      case '--limit': opts.limit = Number(value()); break;
      case '--out': opts.out = resolve(value()); break;
      case '--concurrency': opts.concurrency = Number(value()); break;
      case '--sheet': opts.sheet = true; break;
      case '--keep-html': opts.keepHtml = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  if (!(opts.size in SIZES)) throw new Error(`--size must be one of ${Object.keys(SIZES).join(', ')}`);
  if (opts.limit !== null && !Number.isFinite(opts.limit)) throw new Error('--limit must be a number');
  if (!Number.isFinite(opts.concurrency) || opts.concurrency < 1) {
    throw new Error('--concurrency must be a positive number');
  }
  return opts;
}

/* A mistyped flag is a typo, not a crash: say what was wrong and stop. */
try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  let selected = PROMPTS;
  if (opts.kinds) selected = selected.filter((p) => opts.kinds.includes(p.kind));
  if (opts.cadence) selected = selected.filter((p) => opts.cadence.includes(p.cadence));
  if (opts.limit !== null) selected = selected.slice(0, opts.limit);
  if (selected.length === 0) {
    throw new Error(
      `nothing to render after filtering. Kinds are ${Object.keys(KIND).join(', ')}; ` +
        'cadences are daily, weekly, monthly.'
    );
  }

  const size = { name: opts.size, ...SIZES[opts.size] };
  const { css, fonts } = loadAssets();
  const chrome = findChrome();

  const outDir = join(opts.out, opts.size);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const jobs = selected.map((prompt, index) => {
    const stem = `${String(index + 1).padStart(3, '0')}-${prompt.kind.toLowerCase()}-${slugify(plain(prompt))}`;
    return { prompt, html: join(outDir, `${stem}.html`), png: join(outDir, `${stem}.png`) };
  });

  for (const job of jobs) writeFileSync(job.html, cardHtml(job.prompt, { css, fonts, size }));

  let done = 0;
  await pool(jobs, opts.concurrency, async (job) => {
    await shoot(chrome, job.html, job.png, size);
    process.stderr.write(`\r  ${++done}/${jobs.length} rendered`);
  });
  process.stderr.write('\n');

  if (opts.sheet) {
    const html = join(outDir, '_contact-sheet.html');
    const png = join(outDir, '_contact-sheet.png');
    writeFileSync(html, sheetHtml(jobs, { fonts, size, title: `Vellum — ${opts.size} ${size.w} × ${size.h}` }));
    await shoot(chrome, html, png, sheetSize(size, jobs.length));
    if (!opts.keepHtml) rmSync(html);
    process.stderr.write(`  contact sheet: ${png}\n`);
  }

  if (!opts.keepHtml) for (const job of jobs) rmSync(job.html);

  process.stdout.write(`\n${jobs.length} cards → ${outDir}\n`);
} catch (error) {
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
}
