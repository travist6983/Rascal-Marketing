#!/usr/bin/env node
/**
 * Publishes the next due post to Instagram.
 *
 *   npm run social:post                 dry run — says what it would post
 *   npm run social:post -- --live       actually publishes
 *   npm run social:post -- --id ID --live
 *
 * **Dry run is the default and --live is required.** Posting is public and
 * cannot be undone from here, so the flag is the confirmation step. Without
 * credentials it refuses to pretend: it prints the exact request it would have
 * sent and says plainly that nothing was published — the same stance
 * `app.js` takes about the email signup.
 *
 * How Instagram publishing works, and why the queue looks the way it does:
 * the API does not accept an image upload. You give it a **public HTTPS URL**,
 * it fetches the image itself, and you then publish the container it made. That
 * is the whole reason the card PNGs are committed to this repo instead of
 * living in the gitignored render directory.
 *
 * ── FILL IN ──────────────────────────────────────────────────────────────────
 * Everything you need to supply is in CONFIG below and comes from the
 * environment. docs/social-posting.md walks through where each value comes
 * from. Nothing here has a secret baked into it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { nextDue, readQueue, root, writeQueue } from '../social/queue.mjs';

const CONFIG = {
  /* From the Meta app — see docs/social-posting.md. */
  igUserId: process.env.IG_USER_ID ?? null,
  accessToken: process.env.IG_ACCESS_TOKEN ?? null,

  /* Where the committed card PNGs are publicly readable. Default is raw
     githubusercontent, which serves this public repo's files the moment a
     commit lands — no Pages deploy in the path. See docs/social-posting.md
     for the GitHub Pages alternative and why this is the default. */
  imageBase:
    process.env.SOCIAL_IMAGE_BASE ??
    'https://raw.githubusercontent.com/travist6983/Rascal-Marketing/main',

  /* graph.instagram.com is the Instagram-Login flow; graph.facebook.com is the
     Facebook-Login flow. The version string moves — check it against Meta's
     current docs before the first live run. */
  apiHost: process.env.IG_API_HOST ?? 'https://graph.instagram.com',
  apiVersion: process.env.IG_API_VERSION ?? 'v23.0'
};

/* Meta's documented ceiling is 25 API-published posts per rolling 24 hours.
   One a day sits nowhere near it; this is here so nobody is surprised by a
   catch-up run that tries to drain a backlog. */
const DAILY_LIMIT = 25;

const HELP = `
Dogear social post

  npm run social:post -- [options]

  --live        actually publish (without this, it is a dry run)
  --id ID       post a specific queue entry instead of the next due one
  --force       post even if the scheduled time has not arrived yet

  Environment:
    IG_USER_ID          Instagram professional account id
    IG_ACCESS_TOKEN     long-lived access token
    SOCIAL_IMAGE_BASE   public base URL for social/queue/*.png   (optional)
    IG_API_HOST         graph host                               (optional)
    IG_API_VERSION      graph API version                        (optional)

  See docs/social-posting.md for where each of those comes from.
`;

/* --------------------------------------------------------------------------
   Instagram
   -------------------------------------------------------------------------- */

/**
 * One Graph API call. Meta returns errors as HTTP 400 with a JSON body that is
 * far more useful than the status code, so the body is what gets raised.
 */
async function graph(path, params) {
  const url = `${CONFIG.apiHost}/${CONFIG.apiVersion}/${path}`;
  const body = new URLSearchParams({ ...params, access_token: CONFIG.accessToken });
  const response = await fetch(url, { method: 'POST', body });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = json?.error
      ? `${json.error.type ?? 'error'} ${json.error.code ?? ''}: ${json.error.message}`
      : `HTTP ${response.status}`;
    throw new Error(`${path} failed — ${detail}`);
  }
  return json;
}

/** Reads a container's processing state. Images are usually FINISHED at once. */
async function containerStatus(creationId) {
  const url =
    `${CONFIG.apiHost}/${CONFIG.apiVersion}/${creationId}` +
    `?fields=status_code,status&access_token=${encodeURIComponent(CONFIG.accessToken)}`;
  const response = await fetch(url);
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`status check failed — ${json?.error?.message ?? response.status}`);
  return json;
}

/**
 * Waits for the container Meta built from the image URL.
 *
 * An image container is normally ready immediately, but publishing an
 * IN_PROGRESS container is an error, and ERROR carries the reason the fetch
 * failed — almost always an image URL that isn't publicly reachable, which is
 * the single most likely thing to go wrong on a first run.
 */
async function waitForContainer(creationId, { attempts = 10, delayMs = 3000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const { status_code: code, status } = await containerStatus(creationId);
    if (code === 'FINISHED') return;
    if (code === 'ERROR' || code === 'EXPIRED') {
      throw new Error(`container ${creationId} came back ${code}: ${status ?? 'no detail given'}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`container ${creationId} was still not FINISHED after ${attempts} checks`);
}

/* --------------------------------------------------------------------------
   Post assembly
   -------------------------------------------------------------------------- */

/** Caption plus hashtags — one blank line between them, the way a feed reads. */
function fullCaption(post) {
  const tags = post.hashtags?.length ? `\n\n${post.hashtags.map((t) => `#${t}`).join(' ')}` : '';
  return `${post.caption}${tags}`;
}

function imageUrl(post) {
  return `${CONFIG.imageBase.replace(/\/$/, '')}/${post.image}`;
}

/** Everything that must be true before a post is allowed to go out. */
function preflight(post, { live, force }) {
  const problems = [];
  if (!post.caption) problems.push('no caption — run `npm run social:captions`');
  if (!post.altText) problems.push('no alt text — run `npm run social:captions`');
  if (!existsSync(join(root, post.image))) problems.push(`image missing at ${post.image}`);
  if (!force && new Date(post.scheduledFor) > new Date()) {
    problems.push(`not due until ${post.scheduledFor} (use --force to post anyway)`);
  }
  if (live && !CONFIG.igUserId) problems.push('IG_USER_ID is not set');
  if (live && !CONFIG.accessToken) problems.push('IG_ACCESS_TOKEN is not set');
  return problems;
}

function parseArgs(argv) {
  const opts = { live: false, id: null, force: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    switch (flag) {
      case '--live': opts.live = true; break;
      case '--force': opts.force = true; break;
      case '--id': {
        const next = argv[++i];
        if (next === undefined) throw new Error('--id needs a value');
        opts.id = next;
        break;
      }
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  return opts;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const queue = readQueue();

  const postedToday = queue.posts.filter(
    (p) => p.postedAt && Date.now() - new Date(p.postedAt).getTime() < 24 * 60 * 60 * 1000
  ).length;
  if (postedToday >= DAILY_LIMIT) {
    throw new Error(`${postedToday} posts already published in the last 24h — at Instagram's limit of ${DAILY_LIMIT}`);
  }

  const post = opts.id
    ? queue.posts.find((p) => p.id === opts.id)
    : nextDue(queue, opts.force ? new Date(8.64e15) : new Date());

  if (!post) {
    process.stdout.write('nothing due. Queue is empty, or the next post is scheduled for later.\n');
    process.exit(0);
  }
  if (post.postedAt) throw new Error(`${post.id} already went out at ${post.postedAt}`);

  const problems = preflight(post, opts);
  const caption = post.caption ? fullCaption(post) : '(none)';
  const image = imageUrl(post);

  process.stdout.write(
    `${post.id}\n` +
      `  scheduled  ${post.scheduledFor}\n` +
      `  image      ${image}\n` +
      `  alt        ${post.altText ?? '(none)'}\n` +
      `  caption    ${caption.replace(/\n/g, '\n             ')}\n\n`
  );

  if (problems.length > 0) {
    process.stderr.write(`not posting:\n  - ${problems.join('\n  - ')}\n`);
    process.exit(1);
  }

  if (!opts.live) {
    process.stdout.write(
      'Dry run — nothing was published. Everything above checks out; add --live to post it.\n'
    );
    process.exit(0);
  }

  /* Two steps, both required: build a container from the public image URL, then
     publish that container. */
  process.stderr.write('  creating container … ');
  const container = await graph(`${CONFIG.igUserId}/media`, {
    image_url: image,
    caption,
    alt_text: post.altText
  });
  process.stderr.write(`${container.id}\n  waiting for Instagram to fetch the image … `);

  await waitForContainer(container.id);
  process.stderr.write('ready\n  publishing … ');

  const published = await graph(`${CONFIG.igUserId}/media_publish`, { creation_id: container.id });
  process.stderr.write(`${published.id}\n`);

  post.postedAt = new Date().toISOString();
  post.mediaId = published.id;
  writeQueue(queue);

  process.stdout.write(`\nPublished. media id ${published.id}, recorded in social/queue.json\n`);
} catch (error) {
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
}
