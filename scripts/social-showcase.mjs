#!/usr/bin/env node
/**
 * Renders the Instagram set — 10 feed posts as PNGs and 5 reels as MP4s, built
 * from the app captures in assets/. Copy comes from social/showcase.js, the
 * design from video/src/Post.tsx and video/src/Showcase.tsx.
 *
 *   npm run social:showcase                  everything
 *   npm run social:showcase -- --only posts
 *   npm run social:showcase -- --id sealed   one post and one reel named sealed
 *   npm run social:showcase -- --dry-run     list what would render
 *
 * Where the other two renderers fit: `npm run social` is the 113-prompt card
 * library, `npm run social:reel` turns queued prompts into a video, and this is
 * the product itself — the app on a phone, with a line of copy over it.
 *
 * The project is bundled **once** up front and every render points at that
 * bundle. Fifteen separate `remotion render` calls would each rebuild the
 * project first, which costs more than all fifteen renders put together.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { POSTS, REELS } from '../social/showcase.js';
import { root } from '../social/queue.mjs';

const VIDEO_DIR = join(root, 'video');

const HELP = `
Pocket Chronicle Instagram set

  npm run social:showcase -- [options]

  --only posts|reels     render just one kind                   (both)
  --id ID,ID             render only these ids
  --out DIR              where they land        (social/out/instagram)
  --dry-run              list what would render, render nothing

  Posts are 1080 x 1350 PNGs, reels are 1080 x 1920 MP4s at 30fps.
  Ids come from social/showcase.js.
`;

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const opts = {
    only: null,
    ids: null,
    out: join(root, 'social', 'out', 'instagram'),
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
      case '--only': opts.only = value(); break;
      case '--id': opts.ids = value().split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--out': opts.out = resolve(value()); break;
      case '--dry-run': opts.dryRun = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  if (opts.only && opts.only !== 'posts' && opts.only !== 'reels') {
    throw new Error('--only must be posts or reels');
  }
  return opts;
}

/** `remotion` writes props from a file — the copy has curly quotes in it. */
function renderOne(bundle, propsDir, job) {
  const propsFile = join(propsDir, `${job.kind}-${job.id}.json`);
  writeFileSync(propsFile, JSON.stringify(job.props));

  const args =
    job.kind === 'post'
      ? ['remotion', 'still', bundle, 'Post', job.out, `--props=${propsFile}`]
      : ['remotion', 'render', bundle, 'Showcase', job.out, `--props=${propsFile}`];

  const run = spawnSync('npx', args, { cwd: VIDEO_DIR, stdio: ['ignore', 'ignore', 'pipe'] });
  if (run.status !== 0) {
    throw new Error(
      `${job.kind} "${job.id}" failed:\n${(run.stderr ?? '').toString().trim()}`
    );
  }
}

/* A mistyped flag is a typo, not a crash: say what was wrong and stop. */
let propsDir = null;
try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const wanted = (id) => !opts.ids || opts.ids.includes(id);
  const jobs = [];

  if (opts.only !== 'reels') {
    for (const post of POSTS.filter((p) => wanted(p.id))) {
      jobs.push({
        kind: 'post',
        id: post.id,
        pronouns: post.pronouns,
        out: join(opts.out, `post-${post.id}.png`),
        props: {
          screen: post.screen,
          kicker: post.kicker,
          headline: post.headline,
          body: post.body,
          tint: post.tint
        }
      });
    }
  }

  if (opts.only !== 'posts') {
    for (const reel of REELS.filter((r) => wanted(r.id))) {
      jobs.push({
        kind: 'reel',
        id: reel.id,
        pronouns: reel.pronouns,
        seconds: reel.scenes.reduce((total, scene) => total + scene.seconds, 0),
        out: join(opts.out, `reel-${reel.id}.mp4`),
        props: { scenes: reel.scenes, tint: reel.tint }
      });
    }
  }

  if (jobs.length === 0) throw new Error('nothing matched. Ids are in social/showcase.js.');

  for (const job of jobs) {
    const length = job.seconds ? ` ${job.seconds.toFixed(1)}s` : '';
    /* The archive in the captures is written he/him — see assets/README.md.
       Anything carrying it says so here rather than only in a doc. */
    const flag = job.pronouns ? `  ← shows ${job.pronouns} in the screenshot` : '';
    process.stderr.write(`  ${job.kind.padEnd(4)} ${job.id.padEnd(11)}${length.padEnd(7)}${flag}\n`);
  }
  if (opts.dryRun) process.exit(0);

  mkdirSync(opts.out, { recursive: true });
  propsDir = mkdtempSync(join(tmpdir(), 'pocket-chronicle-showcase-'));

  process.stderr.write('\n  bundling once…\n');
  const bundleDir = join(propsDir, 'bundle');
  const bundle = spawnSync('npx', ['remotion', 'bundle', `--out-dir=${bundleDir}`], {
    cwd: VIDEO_DIR,
    stdio: ['ignore', 'ignore', 'pipe']
  });
  if (bundle.status !== 0) {
    throw new Error(`bundling failed:\n${(bundle.stderr ?? '').toString().trim()}`);
  }

  let done = 0;
  for (const job of jobs) {
    renderOne(bundleDir, propsDir, job);
    process.stderr.write(`  ${++done}/${jobs.length}  ${relative(root, job.out)}\n`);
  }

  process.stderr.write(`\n  ${jobs.length} files in ${relative(root, opts.out)}\n`);
} catch (error) {
  process.stderr.write(`\n  ${error.message}\n\n`);
  process.exit(1);
} finally {
  if (propsDir) rmSync(propsDir, { recursive: true, force: true });
}
