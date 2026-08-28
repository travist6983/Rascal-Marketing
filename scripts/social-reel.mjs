#!/usr/bin/env node
/**
 * Renders a run of prompts as one vertical video — each card holds, fades out,
 * and the next fades in on the same paper. Copy and kinds come from
 * social/prompts.js, the design and the timing from video/src/PromptReel.tsx,
 * the rendering from Remotion.
 *
 *   npm run social:reel                          the next 6 unposted cards
 *   npm run social:reel -- --count 10
 *   npm run social:reel -- --from library --kind PHOTO,VIDEO
 *   npm run social:reel -- --seconds 5 --fade 0.5
 *   npm run social:reel -- --dry-run             print the running order only
 *
 * `npm run social` is the library as PNGs; this is the library as a Reel. The
 * queue is the default source so the video shows what is actually going out, in
 * the order it is going out — the same cards the poster will publish one a day,
 * gathered into one thing you can put in a feed today.
 *
 * Unlike the PNGs this output is **not** committed. A Reel is uploaded from disk
 * rather than fetched by URL, so there is no reason to carry the binary in git;
 * social/out/ is ignored.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { PROMPTS, KIND } from '../social/prompts.js';
import { plain, slugify } from '../social/card.mjs';
import { readQueue, root } from '../social/queue.mjs';

/**
 * Must match `fps` on the PromptReel composition. The props are in frames
 * because calculateMetadata is handed props but not the frame rate, so seconds
 * have to become frames on this side of the boundary.
 */
const FPS = 30;
const COMPOSITION = 'PromptReel';
const VIDEO_DIR = join(root, 'video');

const HELP = `
Pocket Chronicle prompt reel

  npm run social:reel -- [options]

  --from queue|library   where the prompts come from            (queue)
  --count N              how many cards                         (6)
  --kind K,K             only these kinds            (library source only)
  --cadence C,C          daily,weekly,monthly        (library source only)
  --seconds N            how long each card holds              (4)
  --fade N               seconds of fade between cards         (0.4)
  --out PATH             where the video lands   (social/out/reel.mp4)
  --dry-run              print the running order, render nothing

  "queue" takes the next unposted entries from social/queue.json in schedule
  order. "library" draws straight from social/prompts.js, rotating kinds so the
  colour alternates.
`;

/* --------------------------------------------------------------------------
   Selection
   -------------------------------------------------------------------------- */

/**
 * Round-robin across kinds, in library order within each kind — the same
 * rotation social-queue.mjs uses, and for the same reason: prompts.js is
 * grouped by kind, so drawing off the top gives six QUESTION cards in a row.
 */
function mixed(prompts) {
  const byKind = new Map();
  for (const prompt of prompts) {
    if (!byKind.has(prompt.kind)) byKind.set(prompt.kind, []);
    byKind.get(prompt.kind).push(prompt);
  }
  const lanes = [...byKind.values()];
  const out = [];
  for (let i = 0; out.length < prompts.length; i++) {
    for (const lane of lanes) if (i < lane.length) out.push(lane[i]);
  }
  return out;
}

/**
 * The queue stores each prompt as one flat sentence, but a card needs the verb
 * split out to mark it. The slug is the join: social-queue.mjs derives it with
 * the same slugify(plain(prompt)), so the library can be indexed by it.
 */
function fromQueue(count) {
  const library = new Map(PROMPTS.map((prompt) => [slugify(plain(prompt)), prompt]));
  const due = readQueue()
    .posts.filter((post) => !post.postedAt)
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

  const picked = [];
  const orphans = [];
  for (const post of due) {
    if (picked.length >= count) break;
    const prompt = library.get(post.slug);
    if (prompt) picked.push(prompt);
    else orphans.push(post.slug);
  }

  if (orphans.length > 0) {
    process.stderr.write(
      `  skipped ${orphans.length} queued post(s) with no prompt in the library:\n` +
        orphans.map((slug) => `    ${slug}\n`).join('')
    );
  }
  if (picked.length === 0) {
    throw new Error(
      'nothing unposted in social/queue.json to make a reel from. ' +
        'Run `npm run social:queue` first, or use --from library.'
    );
  }
  return picked;
}

function fromLibrary(count, kinds, cadences) {
  let selected = PROMPTS;
  if (kinds) selected = selected.filter((p) => kinds.includes(p.kind));
  if (cadences) selected = selected.filter((p) => cadences.includes(p.cadence));
  if (selected.length === 0) {
    throw new Error(
      `nothing to render after filtering. Kinds are ${Object.keys(KIND).join(', ')}; ` +
        'cadences are daily, weekly, monthly.'
    );
  }
  return mixed(selected).slice(0, count);
}

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const opts = {
    from: 'queue',
    count: 6,
    kinds: null,
    cadence: null,
    seconds: 4,
    fade: 0.4,
    out: join(root, 'social', 'out', 'reel.mp4'),
    dryRun: false,
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
      case '--from': opts.from = value(); break;
      case '--count': opts.count = Number(value()); break;
      case '--kind': opts.kinds = list().map((s) => s.toUpperCase()); break;
      case '--cadence': opts.cadence = list().map((s) => s.toLowerCase()); break;
      case '--seconds': opts.seconds = Number(value()); break;
      case '--fade': opts.fade = Number(value()); break;
      case '--out': opts.out = resolve(value()); break;
      case '--dry-run': opts.dryRun = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  if (opts.from !== 'queue' && opts.from !== 'library') {
    throw new Error('--from must be queue or library');
  }
  if (!Number.isFinite(opts.count) || opts.count < 1) throw new Error('--count must be a positive number');
  if (!Number.isFinite(opts.seconds) || opts.seconds <= 0) throw new Error('--seconds must be a positive number');
  if (!Number.isFinite(opts.fade) || opts.fade < 0) throw new Error('--fade must be zero or more');
  if (opts.fade * 2 >= opts.seconds) {
    throw new Error(`--fade ${opts.fade} does not fit twice in --seconds ${opts.seconds}`);
  }
  if ((opts.kinds || opts.cadence) && opts.from === 'queue') {
    throw new Error('--kind and --cadence only apply to --from library; the queue is already chosen');
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

  const prompts =
    opts.from === 'queue'
      ? fromQueue(opts.count)
      : fromLibrary(opts.count, opts.kinds, opts.cadence);

  const framesPerCard = Math.round(opts.seconds * FPS);
  const fadeFrames = Math.max(2, Math.round(opts.fade * FPS));
  const seconds = ((prompts.length * framesPerCard) / FPS).toFixed(1);

  process.stderr.write(`  ${prompts.length} cards, ${seconds}s, from ${opts.from}\n`);
  prompts.forEach((prompt, index) => {
    process.stderr.write(`    ${String(index + 1).padStart(2)}. ${prompt.kind.padEnd(9)} ${plain(prompt)}\n`);
  });

  if (opts.dryRun) process.exit(0);

  /* Remotion reads props from a file rather than argv — the prompts carry curly
     quotes and em dashes, and a shell is the wrong place to be careful. */
  mkdirSync(dirname(opts.out), { recursive: true });
  const propsFile = join(VIDEO_DIR, '.reel-props.json');
  writeFileSync(propsFile, JSON.stringify({ prompts, framesPerCard, fadeFrames }, null, 2));

  const render = spawnSync(
    'npx',
    ['remotion', 'render', COMPOSITION, opts.out, `--props=${propsFile}`],
    { cwd: VIDEO_DIR, stdio: 'inherit' }
  );
  if (render.status !== 0) {
    /* Left on disk on purpose — a failed render is easier to reproduce with
       `npx remotion studio --props=.reel-props.json` than from this message. */
    throw new Error(`remotion render exited with ${render.status ?? render.signal}`);
  }
  rmSync(propsFile);

  process.stderr.write(`  ${relative(root, opts.out)}\n`);
} catch (error) {
  process.stderr.write(`\n  ${error.message}\n\n`);
  process.exit(1);
}
