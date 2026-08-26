#!/usr/bin/env node
/**
 * Renders the paid-ad creatives — one PNG per ad per canvas.
 *
 *   npm run ads                          every ad, Instagram portrait
 *   npm run ads -- --size square,story   the other two canvases as well
 *   npm run ads -- --id daily-question   one ad
 *   npm run ads -- --cta launch          the App Store button, not the waitlist
 *   npm run ads -- --sheet               and a contact sheet of the set
 *   npm run ads -- --queue --id ledger   put one in the Instagram queue
 *
 * Where the renderers fit: `npm run social` is the 133-prompt card library,
 * `npm run social:showcase` is the organic Instagram set, and this is the
 * bought placement — the one with a button on it. Copy is social/ads.js,
 * design is social/ad.css, layout is social/ad.mjs.
 *
 * Uses the system Chrome through Playwright, exactly as the cards do: no second
 * browser download, and the same renderer the type was tuned against.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { ADS, CTAS, REASSURANCE } from '../social/ads.js';
import { QUEUE_DIR, readQueue, writeQueue } from '../social/queue.mjs';
import {
  SIZES,
  adHtml,
  describe,
  escapeHtml,
  fill,
  findChrome,
  loadAdAssets,
  pool,
  root,
  shoot,
  shootAd
} from '../social/ad.mjs';

const HELP = `
Vellum ad creatives

  npm run ads -- [options]

  --size portrait,square,story   canvases to render          (portrait)
  --id ID,ID                     only these ads              (all)
  --cta waitlist,launch          which button to set         (waitlist)
  --out DIR                      where the PNGs land         (social/out/ads)
  --sheet                        also write a contact sheet
  --keep-html                    leave the intermediate HTML beside the PNGs
  --concurrency N                parallel Chrome processes   (4)

  Instagram queue:
  --queue                        render into social/queue/ as JPEG and add
                                 entries to social/queue.json
  --start YYYY-MM-DD             first post date, UTC   (day after the queue ends)
  --at HH:MM[,HH:MM…]            time(s) of day, UTC                    (15:00)
  --every N                      days between posting days                   (1)
  --dry-run                      say what would be queued, write nothing
  --force                        re-queue an ad that is already in the queue

  Ids come from social/ads.js, and so do both CTA strings. Ask for both and
  you get both sets side by side, which is the only way to judge them.

  --queue writes the same creative the other flags render, as the JPEG the
  publishing API insists on, into the directory that is committed — then
  \`npm run social:captions\` writes the words and a person reads them before
  anything posts. Portrait only: a story is 9:16 and Instagram's feed stops at
  4:5.
`;

/* --------------------------------------------------------------------------
   Contact sheet
   -------------------------------------------------------------------------- */

const SHEET_PAD = 32;
const SHEET_GAP = 24;
const SHEET_HEAD = 118;
const SHEET_COLS = 4;
const SHEET_SCALE = 0.3;
/* Each tile is a picture and a caption, and only the picture has a number the
   grid can read off the job. Height computed without this clipped the bottom
   row's captions — invisible while the set happened to leave an empty last row,
   and the first thing that goes wrong the moment it fills. 8px margin plus one
   12px line at 1.3, rounded up. */
const SHEET_CAP = 24;

function sheetSize(jobs) {
  const cards = jobs.map((job) => ({
    w: Math.round(job.size.w * SHEET_SCALE),
    h: Math.round(job.size.h * SHEET_SCALE)
  }));
  const colW = Math.max(...cards.map((c) => c.w));
  const rows = Math.ceil(jobs.length / SHEET_COLS);
  const rowH = Math.max(...cards.map((c) => c.h));
  return {
    name: 'sheet',
    colW,
    w: SHEET_PAD * 2 + SHEET_COLS * colW + (SHEET_COLS - 1) * SHEET_GAP,
    h: SHEET_HEAD + SHEET_PAD + rows * (rowH + SHEET_CAP) + (rows - 1) * SHEET_GAP
  };
}

function sheetHtml(jobs, { fonts, title }) {
  const sheet = sheetSize(jobs);
  const tiles = jobs
    .map((job) => {
      const w = Math.round(job.size.w * SHEET_SCALE);
      const h = Math.round(job.size.h * SHEET_SCALE);
      return (
        `<figure><img src="${escapeHtml(basename(job.png))}" width="${w}" height="${h}" alt="">` +
        `<figcaption>${escapeHtml(`${job.ad.id} · ${job.size.name} · ${job.cta}`)}</figcaption></figure>`
      );
    })
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
.grid { display:grid; grid-template-columns:repeat(${SHEET_COLS}, ${sheet.colW}px); gap:${SHEET_GAP}px;
        align-items:end; }
figure { margin:0; }
img { display:block; }
figcaption { margin-top:8px; font:400 12px/1.3 ui-monospace,Menlo,monospace; color:#6E6A63; }
</style>
</head>
<body>
<div class="sheet">
  <h1>${escapeHtml(title)}</h1>
  <p>${jobs.length} creatives, at ${Math.round(SHEET_SCALE * 100)}%</p>
  <div class="grid">${tiles}</div>
</div>
</body>
</html>
`;
}

/* --------------------------------------------------------------------------
   The Instagram queue
   -------------------------------------------------------------------------- */

/**
 * Times of day a post can land, as HH:MM in UTC.
 *
 * A near-copy of `slots()` in scripts/social-queue.mjs rather than an import of
 * it: that file is a CLI, and importing it runs its main body and queues a
 * fortnight of prompt cards as a side effect of asking it to parse a string.
 * The vocabulary is deliberately identical — the two queue commands should take
 * the same flags and mean the same things by them.
 */
function slots(at) {
  const times = at.split(',').map((t) => t.trim()).filter(Boolean);
  if (times.length === 0) throw new Error('--at needs at least one HH:MM');
  for (const time of times) {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new Error(`--at must be HH:MM, comma-separated for several a day — got "${time}"`);
    }
  }
  if (new Set(times).size !== times.length) throw new Error(`--at repeats a time: "${at}"`);
  return [...times].sort();
}

/**
 * Where the queue currently ends, plus a day.
 *
 * The default start, because the alternative — tomorrow — drops an ad on top of
 * a prompt card that was already scheduled months ago. Extending the queue is
 * almost always what someone means, and a collision is silent: two entries can
 * hold the same minute and the poster will publish both.
 */
function dayAfterQueue(queue) {
  const last = queue.posts.reduce(
    (latest, post) => (post.scheduledFor > latest ? post.scheduledFor : latest),
    ''
  );
  const from = last ? new Date(last) : new Date();
  from.setUTCDate(from.getUTCDate() + 1);
  return from.toISOString().slice(0, 10);
}

function scheduleAt(start, times, every, index) {
  const date = new Date(`${start}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`--start must be YYYY-MM-DD — got "${start}"`);
  date.setUTCDate(date.getUTCDate() + Math.floor(index / times.length) * every);
  return `${date.toISOString().slice(0, 10)}T${times[index % times.length]}:00.000Z`;
}

/**
 * One queue entry for one creative.
 *
 * `kind: 'AD'` and a `prompt` carrying the headline are what let every tool
 * already pointed at this file keep working — the poster reads `image`,
 * `caption` and `scheduledFor` and does not care what made them, and the
 * caption writer reads `kind` and `prompt`. `ad` is the extra: it carries what
 * is actually ON the creative, which is what the caption writer needs to
 * describe an ad rather than a prompt card.
 *
 * Caption, alt text and hashtags are left null on purpose. The poster refuses
 * an entry without them, which is the gate that keeps anything reaching the
 * feed that a person has not read.
 */
function queueEntry(ad, size, cta, when) {
  const id = `${when.slice(0, 10)}-${ad.id}`;
  /* Filled, not raw. The library creative's headline is "{{PROMPT_COUNT}}
     questions you would never think to ask" — the render resolves it, and an
     entry that stores the raw string hands the caption writer a token it will
     copy straight into the alt text, where it posts as literal braces. */
  const headline = fill(ad.headline);
  return {
    id,
    slug: ad.id,
    kind: 'AD',
    prompt: headline,
    ad: {
      template: ad.template,
      headline,
      subhead: fill(ad.subhead ?? ''),
      cta: fill(ad.cta),
      /* What is actually on the image. The caption writer never sees the
         render, and without this it describes a layout it has only been told
         the name of. */
      shows: fill(describe(ad)),
      size: size.name,
      variant: cta
    },
    image: `social/queue/${id}.jpg`,
    scheduledFor: when,
    caption: null,
    altText: null,
    hashtags: [],
    postedAt: null,
    mediaId: null
  };
}

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const opts = {
    sizes: ['portrait'],
    ctas: ['waitlist'],
    ids: null,
    out: join(root, 'social', 'out', 'ads'),
    sheet: false,
    keepHtml: false,
    concurrency: 4,
    queue: false,
    start: null,
    at: '15:00',
    every: 1,
    dryRun: false,
    force: false,
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
      case '--size': opts.sizes = list(); break;
      case '--cta': opts.ctas = list(); break;
      case '--id': opts.ids = list(); break;
      case '--out': opts.out = resolve(value()); break;
      case '--concurrency': opts.concurrency = Number(value()); break;
      case '--sheet': opts.sheet = true; break;
      case '--keep-html': opts.keepHtml = true; break;
      case '--queue': opts.queue = true; break;
      case '--start': opts.start = value(); break;
      case '--at': opts.at = value(); break;
      case '--every': opts.every = Number(value()); break;
      case '--dry-run': opts.dryRun = true; break;
      case '--force': opts.force = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  for (const size of opts.sizes) {
    if (!(size in SIZES)) {
      throw new Error(`--size must be one of ${Object.keys(SIZES).join(', ')} — got "${size}"`);
    }
  }
  for (const cta of opts.ctas) {
    if (!(cta in CTAS)) {
      throw new Error(`--cta must be one of ${Object.keys(CTAS).join(', ')} — got "${cta}"`);
    }
  }
  if (!Number.isFinite(opts.concurrency) || opts.concurrency < 1) {
    throw new Error('--concurrency must be a positive number');
  }
  if (opts.queue) {
    /* Instagram's feed accepts 4:5 at the tallest. A story is 9:16 and comes
       back cropped or refused, and the refusal does not say which of the two
       it did. */
    if (opts.sizes.length !== 1 || opts.sizes[0] !== 'portrait') {
      throw new Error('--queue posts to the feed, which is portrait only — drop --size');
    }
    if (opts.ctas.length !== 1) {
      throw new Error('--queue takes one --cta: a post is one image, not a comparison');
    }
    if (!Number.isFinite(opts.every) || opts.every < 1) {
      throw new Error('--every must be a positive number of days');
    }
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

  let selected = ADS;
  if (opts.ids) {
    selected = ADS.filter((ad) => opts.ids.includes(ad.id));
    const missing = opts.ids.filter((id) => !ADS.some((ad) => ad.id === id));
    if (missing.length > 0) {
      throw new Error(
        `no ad called ${missing.join(', ')}. Ids are ${ADS.map((a) => a.id).join(', ')}.`
      );
    }
  }
  if (selected.length === 0) throw new Error('nothing to render');

  const { css, fonts } = loadAdAssets();
  const chrome = findChrome();

  /* ── the Instagram queue ────────────────────────────────────────────────
     A different job from rendering a set to look at, and it exits rather than
     falling through: this path writes into a committed directory, so nothing
     below it — least of all the rmSync — may run. */
  if (opts.queue) {
    const queue = readQueue();
    const times = slots(opts.at);
    const start = opts.start ?? dayAfterQueue(queue);
    const size = { name: 'portrait', ...SIZES.portrait };
    const variant = opts.ctas[0];

    const queued = new Set(queue.posts.map((post) => post.slug));
    const wanted = selected.filter((ad) => {
      if (queued.has(ad.id) && !opts.force) {
        process.stderr.write(`  already in the queue, skipping: ${ad.id}\n`);
        return false;
      }
      return true;
    });
    if (wanted.length === 0) {
      throw new Error('every one of those is already queued — pass --force to add another');
    }

    const jobs = wanted.map((ad, i) => {
      /* Resolved BEFORE the entry is built, not after: queueEntry records the
         button's words for the caption writer to quote, and an unresolved ad
         carries no `cta` at all — the field would drop silently out of the JSON
         and the caption would be written about a button nobody named. */
      const resolved = {
        ...ad,
        cta: ad.cta ?? CTAS[variant],
        reassurance: ad.reassurance ?? REASSURANCE
      };
      return {
        ad: resolved,
        entry: queueEntry(resolved, size, variant, scheduleAt(start, times, opts.every, i))
      };
    });

    if (opts.dryRun) {
      process.stdout.write(`\n${jobs.length} would be queued, ${variant} button:\n`);
      for (const { entry } of jobs) {
        process.stdout.write(`  ${entry.scheduledFor}  ${entry.slug}\n`);
      }
      process.stdout.write('\nNothing was written.\n');
      process.exit(0);
    }

    mkdirSync(QUEUE_DIR, { recursive: true });

    let queuedDone = 0;
    const bad = [];
    await pool(jobs, opts.concurrency, async ({ ad, entry }) => {
      const html = join(QUEUE_DIR, `${entry.id}.html`);
      const jpg = join(root, entry.image);
      writeFileSync(html, adHtml(ad, { css, fonts, size }));
      try {
        const problems = await shootAd(chrome, html, jpg, size);
        for (const problem of problems) bad.push(`${entry.slug}: ${problem}`);
      } finally {
        rmSync(html, { force: true });
      }
      process.stderr.write(`\r  ${++queuedDone}/${jobs.length} rendered`);
    });
    process.stderr.write('\n');

    /* All or nothing. Everywhere else an overset creative is still written so
       you can look at what went wrong; here the next thing that touches the
       file is a poster running unattended on a schedule, and a sentence
       running under the band would go out looking deliberate. */
    if (bad.length > 0) {
      for (const { entry } of jobs) rmSync(join(root, entry.image), { force: true });
      process.stderr.write(`\n  copy does not fit — nothing was queued:\n    ${bad.join('\n    ')}\n\n`);
      process.exit(1);
    }

    queue.posts.push(...jobs.map((job) => job.entry));
    writeQueue(queue);

    process.stdout.write(`\n${jobs.length} queued → social/queue.json\n`);
    for (const { entry } of jobs) {
      process.stdout.write(`  ${entry.scheduledFor}  ${entry.slug}\n`);
    }
    process.stdout.write(
      '\nNext: `npm run social:captions` writes the words, and nothing posts until\n' +
      'a person has read them. The JPEGs and social/queue.json both have to be\n' +
      'committed and pushed — Instagram fetches the image by public URL.\n'
    );
    process.exit(0);
  }

  rmSync(opts.out, { recursive: true, force: true });
  mkdirSync(opts.out, { recursive: true });

  /* The two strings every creative shares are resolved here rather than repeated
     four times in the copy file. An ad that carries its own wins; `reassurance:
     ''` is a deliberate blank and survives, because an empty string is not
     nullish. */
  const jobs = [];
  for (const name of opts.sizes) {
    const size = { name, ...SIZES[name] };
    for (const cta of opts.ctas) {
      for (const ad of selected) {
        const stem = `${ad.id}-${name}-${cta}`;
        jobs.push({
          ad: { ...ad, cta: ad.cta ?? CTAS[cta], reassurance: ad.reassurance ?? REASSURANCE },
          cta,
          size,
          html: join(opts.out, `${stem}.html`),
          png: join(opts.out, `${stem}.png`)
        });
      }
    }
  }

  /* Built before any browser starts, so a bad accent or a missing capture is a
     one-line error rather than a half-rendered directory. */
  for (const job of jobs) writeFileSync(job.html, adHtml(job.ad, { css, fonts, size: job.size }));

  let done = 0;
  const overset = [];
  await pool(jobs, opts.concurrency, async (job) => {
    const problems = await shootAd(chrome, job.html, job.png, job.size);
    for (const problem of problems) {
      overset.push(`${job.ad.id} ${job.size.name} ${job.cta}: ${problem}`);
    }
    process.stderr.write(`\r  ${++done}/${jobs.length} rendered`);
  });
  process.stderr.write('\n');

  if (opts.sheet) {
    const html = join(opts.out, '_contact-sheet.html');
    const png = join(opts.out, '_contact-sheet.png');
    writeFileSync(html, sheetHtml(jobs, { fonts, title: 'Vellum — ad creatives' }));
    /* The sheet is a wall of finished PNGs — no copy to fit, so it takes the
       card renderer's plain shot rather than the ad one that waits for a fit
       flag no sheet ever sets. */
    await shoot(chrome, html, png, sheetSize(jobs));
    if (!opts.keepHtml) rmSync(html);
    process.stderr.write(`  contact sheet: ${png}\n`);
  }

  if (!opts.keepHtml) for (const job of jobs) rmSync(job.html);

  /* The PNGs are written either way — you want to look at what went wrong — but
     an overset ad is a failed render, not a warning, and exiting non-zero is
     what keeps it from being mistaken for a finished one. */
  if (overset.length > 0) {
    process.stderr.write(`\n  copy does not fit:\n    ${overset.join('\n    ')}\n`);
    process.stderr.write(`\n${jobs.length} creatives → ${opts.out}\n\n`);
    process.exit(1);
  }

  process.stdout.write(`\n${jobs.length} creatives → ${opts.out}\n`);
} catch (error) {
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
}
