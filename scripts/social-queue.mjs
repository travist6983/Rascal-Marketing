#!/usr/bin/env node
/**
 * Builds the posting queue: picks prompts, renders their cards into
 * `social/queue/`, and appends dated entries to `social/queue.json`.
 *
 *   npm run social:queue -- --count 7
 *   npm run social:queue -- --count 14 --start 2026-09-01 --at 15:00
 *   npm run social:queue -- --slug photograph-the-mess-they-made-don-t-clean
 *
 * Both the PNGs and queue.json are **committed** — the PNGs because Instagram
 * fetches images by public URL rather than accepting an upload, queue.json
 * because it is the schedule and the record of what has already gone out.
 *
 * Times are **UTC**. Converting a local time with a DST-aware library is a
 * dependency this repo doesn't have, and a poster that fires an hour early
 * twice a year is worse than one that asks you to do the conversion once.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROMPTS, KIND } from '../social/prompts.js';
import { SIZES, cardHtml, findChrome, loadAssets, plain, shoot, slugify } from '../social/card.mjs';
import { QUEUE_DIR, readQueue, writeQueue } from '../social/queue.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;

const HELP = `
Vellum social queue

  npm run social:queue -- [options]

  --count N        how many posts to add                        (7)
  --start DATE     first post date, YYYY-MM-DD, UTC             (tomorrow)
  --at HH:MM       time of day, UTC                             (15:00)
  --every N        days between posts                           (1)
  --kind K,K       only draw from these kinds
  --slug SLUG      queue one specific prompt (ignores --count)
  --order mix|library                                           (mix)
  --size portrait|square|story                                  (portrait)
  --list           print the queue and exit
  --dry-run        show what would be queued, write nothing

  Order: "mix" rotates through kinds so the feed varies; "library" follows
  social/prompts.js top to bottom, which is grouped by kind.
`;

/* --------------------------------------------------------------------------
   Selection
   -------------------------------------------------------------------------- */

/**
 * Round-robin across kinds, in library order within each kind.
 *
 * `social/prompts.js` is grouped by kind, so drawing straight off the top gives
 * a fortnight of nothing but QUESTION cards. Rotating produces a feed that
 * alternates colour and shape without anyone curating it by hand.
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

/** ISO instant for `date` at `time`, both read as UTC. */
function instant(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`--start must be YYYY-MM-DD, got "${date}"`);
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error(`--at must be HH:MM, got "${time}"`);
  const at = new Date(`${date}T${time}:00.000Z`);
  if (Number.isNaN(at.getTime())) throw new Error(`"${date} ${time}" is not a real date and time`);
  return at;
}

function tomorrowUTC() {
  const now = new Date(Date.now() + DAY_MS);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const opts = {
    count: 7,
    start: null,
    at: '15:00',
    every: 1,
    kinds: null,
    slug: null,
    order: 'mix',
    size: 'portrait',
    list: false,
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
    switch (flag) {
      case '--count': opts.count = Number(value()); break;
      case '--start': opts.start = value(); break;
      case '--at': opts.at = value(); break;
      case '--every': opts.every = Number(value()); break;
      case '--kind': opts.kinds = value().split(',').map((s) => s.trim().toUpperCase()).filter(Boolean); break;
      case '--slug': opts.slug = value(); break;
      case '--order': opts.order = value(); break;
      case '--size': opts.size = value(); break;
      case '--list': opts.list = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  if (!(opts.size in SIZES)) throw new Error(`--size must be one of ${Object.keys(SIZES).join(', ')}`);
  if (!['mix', 'library'].includes(opts.order)) throw new Error('--order must be mix or library');
  if (!Number.isInteger(opts.count) || opts.count < 1) throw new Error('--count must be a positive integer');
  if (!Number.isInteger(opts.every) || opts.every < 1) throw new Error('--every must be a positive integer');
  return opts;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const queue = readQueue();

  if (opts.list) {
    if (queue.posts.length === 0) {
      process.stdout.write('queue is empty — run `npm run social:queue -- --count 7`\n');
      process.exit(0);
    }
    for (const post of queue.posts) {
      const state = post.postedAt ? `posted ${post.postedAt}` : post.caption ? 'ready' : 'NO CAPTION';
      process.stdout.write(`${post.scheduledFor}  ${post.kind.padEnd(8)} ${state.padEnd(28)} ${post.prompt}\n`);
    }
    const pending = queue.posts.filter((p) => !p.postedAt);
    process.stdout.write(
      `\n${queue.posts.length} queued · ${pending.length} pending · ` +
        `${pending.filter((p) => !p.caption).length} still need a caption\n`
    );
    process.exit(0);
  }

  const queued = new Set(queue.posts.map((post) => post.slug));

  let pool_ = PROMPTS;
  if (opts.kinds) pool_ = pool_.filter((p) => opts.kinds.includes(p.kind));
  if (opts.order === 'mix') pool_ = mixed(pool_);

  let chosen;
  if (opts.slug) {
    const match = PROMPTS.find((p) => slugify(plain(p)) === opts.slug);
    if (!match) throw new Error(`no prompt with slug "${opts.slug}" — run --list, or check social/prompts.js`);
    if (queued.has(opts.slug)) throw new Error(`"${opts.slug}" is already in the queue`);
    chosen = [match];
  } else {
    chosen = pool_.filter((p) => !queued.has(slugify(plain(p)))).slice(0, opts.count);
    if (chosen.length === 0) {
      throw new Error(
        'every prompt matching that filter is already queued. Widen --kind, or add prompts to social/prompts.js.'
      );
    }
    if (chosen.length < opts.count) {
      process.stderr.write(`only ${chosen.length} unqueued prompts matched — queueing those.\n`);
    }
  }

  /* Continue from the last scheduled post rather than colliding with it. */
  const last = queue.posts.at(-1);
  const first = opts.start
    ? instant(opts.start, opts.at)
    : last
      ? new Date(new Date(last.scheduledFor).getTime() + opts.every * DAY_MS)
      : instant(tomorrowUTC(), opts.at);

  const size = { name: opts.size, ...SIZES[opts.size] };
  const entries = chosen.map((prompt, index) => {
    const slug = slugify(plain(prompt));
    const when = new Date(first.getTime() + index * opts.every * DAY_MS);
    const day = when.toISOString().slice(0, 10);
    const id = `${day}-${slug}`;
    return {
      prompt,
      entry: {
        id,
        slug,
        kind: prompt.kind,
        prompt: plain(prompt),
        image: `social/queue/${id}.png`,
        scheduledFor: when.toISOString(),
        caption: null,
        altText: null,
        hashtags: [],
        postedAt: null,
        mediaId: null
      }
    };
  });

  if (opts.dryRun) {
    for (const { entry } of entries) {
      process.stdout.write(`${entry.scheduledFor}  ${entry.kind.padEnd(8)} ${entry.prompt}\n`);
    }
    process.stdout.write(`\n${entries.length} would be queued. Nothing was written.\n`);
    process.exit(0);
  }

  mkdirSync(QUEUE_DIR, { recursive: true });
  const { css, fonts } = loadAssets();
  const chrome = findChrome();

  for (const { prompt, entry } of entries) {
    const html = join(QUEUE_DIR, `${entry.id}.html`);
    const png = join(QUEUE_DIR, `${entry.id}.png`);
    writeFileSync(html, cardHtml(prompt, { css, fonts, size }));
    await shoot(chrome, html, png, size);
    rmSync(html);
    queue.posts.push(entry);
    process.stdout.write(`${entry.scheduledFor}  ${entry.kind.padEnd(8)} ${entry.prompt}\n`);
  }

  writeQueue(queue);
  process.stdout.write(
    `\n${entries.length} queued → social/queue.json\n` +
      'Next: `npm run social:captions` to write the copy, then review it before anything posts.\n'
  );
} catch (error) {
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
}
