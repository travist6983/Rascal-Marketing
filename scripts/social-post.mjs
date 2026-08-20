#!/usr/bin/env node
/**
 * Publishes the next due post to Instagram.
 *
 *   npm run social:post                 dry run — says what it would post
 *   npm run social:post -- --live       actually publishes
 *   npm run social:post -- --check      which account do the credentials point at?
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
 * is the whole reason the card images are committed to this repo instead of
 * living in the gitignored render directory. They are JPEG because that is the
 * only format the publishing API accepts — a PNG url comes back as a container
 * in ERROR rather than as a helpful message.
 *
 * ── FILL IN ──────────────────────────────────────────────────────────────────
 * Everything you need to supply is in CONFIG below and comes from the
 * environment. docs/social-posting.md walks through where each value comes
 * from. Nothing here has a secret baked into it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { dueNow, readQueue, root, writeQueue } from '../social/queue.mjs';

/**
 * One environment value, with empty treated as absent.
 *
 * `${{ vars.X }}` in a workflow renders to an **empty string** when X is not
 * set, rather than to nothing at all — so the variable always arrives defined
 * and `??` never reaches its default. That is not a hypothetical: it shipped a
 * container request with `image_url=/social/queue/....jpg`, no origin, and
 * Meta answered `OAuthException 9004: Only photo or video can be accepted as
 * media type` — which names neither the url nor the problem. Locally the same
 * variable is genuinely undefined, so the dry run looked perfect.
 */
const env = (name) => {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? null : value.trim();
};

const CONFIG = {
  /* From the Meta app — see docs/social-posting.md. */
  igUserId: env('IG_USER_ID'),
  accessToken: env('IG_ACCESS_TOKEN'),

  /* Where the committed card JPEGs are publicly readable. Default is raw
     githubusercontent, which serves this public repo's files the moment a
     commit lands — no Pages deploy in the path. See docs/social-posting.md
     for the GitHub Pages alternative and why this is the default. */
  imageBase:
    env('SOCIAL_IMAGE_BASE') ??
    'https://raw.githubusercontent.com/travist6983/Rascal-Marketing/main',

  /* graph.instagram.com is the Instagram-Login flow; graph.facebook.com is the
     Facebook-Login flow. The version string moves — check it against Meta's
     current docs before the first live run.
     verified-on 2026-08-19: content publishing docs are on v25.0 */
  apiHost: env('IG_API_HOST') ?? 'https://graph.instagram.com',
  apiVersion: env('IG_API_VERSION') ?? 'v25.0'
};

/* Meta's documented ceiling is 100 API-published posts per rolling 24 hours.
   One a day sits nowhere near it; this is here so nobody is surprised by a
   catch-up run that tries to drain a backlog.
   verified-on 2026-08-19: "limited to 100 API-published posts within a 24-hour
   moving period" — it was 25 when this was written, so re-check it on drift. */
const DAILY_LIMIT = 100;

const HELP = `
Vellum social post

  npm run social:post -- [options]

  --live        actually publish (without this, it is a dry run)
  --id ID       post a specific queue entry instead of the next due one
  --force       post even if the scheduled time has not arrived yet
  --check       print the account the credentials belong to and its last
                ten posts, and publish nothing. Answers "did it actually
                go out, and to which account?" without guessing.

  Environment:
    IG_USER_ID          Instagram professional account id
    IG_ACCESS_TOKEN     long-lived access token
    SOCIAL_IMAGE_BASE   public base URL for social/queue/*.jpg   (optional)
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
  const response = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(30_000) });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = json?.error
      ? `${json.error.type ?? 'error'} ${json.error.code ?? ''}: ${json.error.message}`
      : `HTTP ${response.status}`;
    throw new Error(`${path} failed — ${detail}`);
  }
  return json;
}

/** The same call as a GET, for the endpoints that only answer to one. */
async function graphGet(path, params = {}) {
  const query = new URLSearchParams({ ...params, access_token: CONFIG.accessToken });
  const response = await fetch(`${CONFIG.apiHost}/${CONFIG.apiVersion}/${path}?${query}`, {
    signal: AbortSignal.timeout(30_000)
  });
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
  return graphGet(creationId, { fields: 'status_code,status' });
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

/**
 * What the credentials actually control, and what is actually on the account.
 *
 * This exists because "the run was green" and "there is a post on Instagram"
 * are different claims, and for a while only the first one was checkable. A
 * publish that returns a media id has succeeded, but it succeeded *somewhere* —
 * and if IG_USER_ID points at an account you are not looking at, everything
 * downstream looks broken while being fine.
 */
async function checkAccount() {
  const me = await graphGet(CONFIG.igUserId, { fields: 'username,media_count' });
  const recent = await graphGet(`${CONFIG.igUserId}/media`, {
    fields: 'id,permalink,timestamp,caption',
    limit: '10'
  });

  const lines = [
    `account    @${me.username}  (id ${CONFIG.igUserId})`,
    `media      ${me.media_count} posts on the account`,
    ''
  ];
  for (const item of recent.data ?? []) {
    const first = (item.caption ?? '').split('\n')[0];
    lines.push(`  ${item.timestamp}  ${item.permalink}`);
    lines.push(`    ${first.slice(0, 76)}${first.length > 76 ? '…' : ''}`);
  }
  if (!recent.data?.length) lines.push('  (no media on the account)');

  process.stdout.write(`${lines.join('\n')}\n`);
  summary(
    `### Instagram account\n\n**@${me.username}** — ${me.media_count} posts.\n\n` +
      ((recent.data ?? []).map((i) => `- [${i.timestamp}](${i.permalink})`).join('\n') ||
        '_No media on the account._')
  );
}

/**
 * Has this card already gone out, whatever social/queue.json believes?
 *
 * `postedAt` is written **after** Instagram has published, and only becomes
 * durable once the workflow's commit reaches main. Publish succeeds, push
 * fails, and the queue still reads pending — so the next hourly run sends the
 * same card again. A duplicate on a public feed is the one failure in this
 * pipeline that strangers see and that nothing here can undo, so the question
 * gets asked of Instagram rather than of the file.
 *
 * Matched on the caption's first line, which is distinctive prose rather than a
 * template, and only when it is long enough to be distinctive at all.
 */
async function findPublished(post) {
  const line = (post.caption ?? '').trim().split('\n')[0].trim();
  if (line.length < 25) return null;
  const recent = await graphGet(`${CONFIG.igUserId}/media`, {
    fields: 'id,caption,timestamp,permalink',
    limit: '25'
  });
  return (
    (recent.data ?? []).find((m) => (m.caption ?? '').trim().startsWith(line)) ?? null
  );
}

/* --------------------------------------------------------------------------
   Saying what happened
   -------------------------------------------------------------------------- */

/**
 * Writes to the Actions run summary, which is the first thing a person sees.
 *
 * Without this, a run that publishes and a run that finds nothing due are both
 * a green tick and an empty page — you have to open the log and read it to tell
 * them apart. That is exactly how a manually-triggered live run got read as
 * "posted successfully" when what it actually said was "nothing due". Outside
 * Actions the variable is unset and this does nothing.
 */
function summary(markdown) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendFileSync(file, `${markdown}\n`);
}

/** A note that belongs in the run's annotations rather than buried in the log. */
function warn(message) {
  process.stderr.write(
    process.env.GITHUB_ACTIONS ? `::warning::${message}\n` : `warning: ${message}\n`
  );
}

/**
 * Records a publish in the queue, and hands the two fields to the workflow.
 *
 * The workflow re-applies them onto whatever main looks like at push time
 * rather than pushing this whole file over the top of it: this copy of
 * queue.json was read before the run started, and a human commit that landed
 * meanwhile must not be clobbered by it.
 */
function recordPublished(queue, post, mediaId) {
  post.postedAt = new Date().toISOString();
  post.mediaId = mediaId;
  writeQueue(queue);
  if (process.env.GITHUB_ENV) {
    appendFileSync(
      process.env.GITHUB_ENV,
      `RECORD_ID=${post.id}\nRECORD_MEDIA_ID=${post.mediaId}\nRECORD_POSTED_AT=${post.postedAt}\n`
    );
  }
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

/**
 * Everything that must be true before a post goes out, split by what a failure
 * means for the rest of the queue.
 *
 * `fatal` is wrong with the setup — no credentials, no image origin. Every
 * entry fails it identically, so there is nothing to step over and the run
 * should stop and say so.
 *
 * `skippable` is wrong with this one entry — nobody wrote its caption, its card
 * never got committed. The run steps over it and tries the next due post,
 * because the alternative is one bad entry wedging the feed permanently: the
 * queue is always drained oldest-first, so an entry that stops the run stops
 * every run after it too, every hour, until a person happens to look.
 */
function preflight(post, { live, force }) {
  const fatal = [];
  const skippable = [];

  if (live && !CONFIG.igUserId) fatal.push('IG_USER_ID is not set');
  if (live && !CONFIG.accessToken) fatal.push('IG_ACCESS_TOKEN is not set');
  /* Meta fetches this url from its own servers, so anything short of an
     absolute https one is unfetchable — and the error it answers with does not
     mention the url at all. Fail here, where the message can. */
  const url = imageUrl(post);
  if (!url.startsWith('https://')) {
    fatal.push(`image url is not absolute https — "${url}". Check SOCIAL_IMAGE_BASE.`);
  }

  if (!post.caption) skippable.push('no caption — run `npm run social:captions`');
  if (!post.altText) skippable.push('no alt text — run `npm run social:captions`');
  if (!existsSync(join(root, post.image))) skippable.push(`image missing at ${post.image}`);
  if (!force && new Date(post.scheduledFor) > new Date()) {
    skippable.push(`not due until ${post.scheduledFor} (use --force to post anyway)`);
  }

  return { fatal, skippable };
}

function parseArgs(argv) {
  const opts = { live: false, id: null, force: false, check: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    switch (flag) {
      case '--live': opts.live = true; break;
      case '--force': opts.force = true; break;
      case '--check': opts.check = true; break;
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

  if (opts.check) {
    const missing = [
      !CONFIG.igUserId && 'IG_USER_ID',
      !CONFIG.accessToken && 'IG_ACCESS_TOKEN'
    ].filter(Boolean);
    if (missing.length) throw new Error(`${missing.join(' and ')} not set — nothing to check against`);
    await checkAccount();
    process.exit(0);
  }

  const queue = readQueue();

  const postedToday = queue.posts.filter(
    (p) => p.postedAt && Date.now() - new Date(p.postedAt).getTime() < 24 * 60 * 60 * 1000
  ).length;
  if (postedToday >= DAILY_LIMIT) {
    throw new Error(`${postedToday} posts already published in the last 24h — at Instagram's limit of ${DAILY_LIMIT}`);
  }

  const pending = queue.posts.filter((p) => !p.postedAt);

  /* Every candidate, oldest first — not just the first one. A single entry that
     cannot go out (nobody captioned it, its card never got committed) used to
     stop the run, and because the queue is always drained oldest-first that
     stop repeated every hour forever. Walking the list means one bad entry
     costs one post, not the whole feed. */
  const candidates = opts.id
    ? queue.posts.filter((p) => p.id === opts.id)
    : opts.force
      ? pending
      : dueNow(queue);

  if (opts.id && candidates.length === 0) throw new Error(`no queue entry with id ${opts.id}`);

  let post = null;
  const skipped = [];
  for (const candidate of candidates) {
    if (candidate.postedAt) {
      skipped.push([candidate, [`already went out at ${candidate.postedAt}`]]);
      continue;
    }
    const { fatal, skippable } = preflight(candidate, opts);
    if (fatal.length > 0) {
      process.stderr.write(`cannot post anything:\n  - ${fatal.join('\n  - ')}\n`);
      summary(`### Cannot post\n\nThis is wrong with the setup, not with one entry:\n\n- ${fatal.join('\n- ')}`);
      process.exit(1);
    }
    if (skippable.length > 0) {
      skipped.push([candidate, skippable]);
      continue;
    }
    post = candidate;
    break;
  }

  for (const [entry, reasons] of skipped) warn(`skipped ${entry.id} — ${reasons.join('; ')}`);

  if (!post) {
    if (skipped.length > 0) {
      /* Every due post is unpublishable. Red, and it stays red every hour until
         a person fixes one of them — which is the correct alarm, because the
         feed has stopped and only a commit can restart it. */
      const detail = skipped.map(([e, r]) => `- \`${e.id}\` — ${r.join('; ')}`).join('\n');
      process.stderr.write(`nothing publishable is due:\n${detail.replace(/^- /gm, '  - ')}\n`);
      summary(`### Nothing publishable is due\n\n${detail}\n\nThe feed is stopped until one of these is fixed and committed.`);
      process.exit(1);
    }

    /* queue.json is written sorted by schedule, so the first unpublished entry
       is the next one. Naming it — and how long the wait is — is the whole
       difference between "this is working" and "this is broken", and both
       states otherwise look like a silent green run. */
    const upcoming = pending[0];
    if (!upcoming) {
      process.stdout.write('Nothing due, and nothing left in the queue — every post has gone out.\n');
      warn('the posting queue is empty — run `npm run social:queue` and `npm run social:captions` to refill it');
      summary('### The queue is empty\n\nEvery post in it has been published, so nothing will go out until it is refilled: `npm run social:queue` then `npm run social:captions`.');
      process.exit(0);
    }
    const waitMs = new Date(upcoming.scheduledFor) - Date.now();
    const wait =
      waitMs < 3600000 ? `${Math.round(waitMs / 60000)} min` : `${(waitMs / 3600000).toFixed(1)} h`;
    process.stdout.write(
      `Nothing due yet — nothing was published.\n` +
        `  next       ${upcoming.id}\n` +
        `  scheduled  ${upcoming.scheduledFor}  (${wait} from now)\n` +
        `  remaining  ${pending.length} unpublished in the queue\n`
    );
    summary(
      `### Nothing due — nothing published\n\n` +
        `Next up is \`${upcoming.id}\` at **${upcoming.scheduledFor}**, ${wait} from now. ` +
        `${pending.length} posts still queued.`
    );
    process.exit(0);
  }

  const caption = fullCaption(post);
  const image = imageUrl(post);

  process.stdout.write(
    `${post.id}\n` +
      `  scheduled  ${post.scheduledFor}\n` +
      `  image      ${image}\n` +
      `  alt        ${post.altText}\n` +
      `  caption    ${caption.replace(/\n/g, '\n             ')}\n\n`
  );

  /* Catching up after missed runs is deliberate — the prompts are evergreen and
     a late one is better than a dropped one — but it is worth saying out loud,
     because it means posts are landing outside the windows the queue was
     written for. One per run keeps the catch-up gentle either way. */
  const lateMs = Date.now() - new Date(post.scheduledFor).getTime();
  if (lateMs > 6 * 3600000) {
    warn(
      `${post.id} is going out ${(lateMs / 3600000).toFixed(1)} h after its slot — ` +
        `the queue is catching up on missed runs, one post an hour`
    );
  }

  /* Two days at four a day. Refilling needs a person to read the captions, so
     the warning has to arrive with time to spare rather than on the day. */
  if (pending.length <= 8) {
    warn(`only ${pending.length} posts left in the queue — top it up with \`npm run social:queue\``);
  }

  if (!opts.live) {
    process.stdout.write(
      'Dry run — nothing was published. Everything above checks out; add --live to post it.\n'
    );
    summary(
      `### Dry run — nothing was published\n\n` +
        `\`${post.id}\` is due and passes every check. Re-run with mode **publish** to post it.`
    );
    process.exit(0);
  }

  /* Ask Instagram before trusting the file. If the last run published this and
     then failed to push the record, queue.json still says pending and this run
     would post it a second time. Finding it already up repairs the record
     instead — the run goes green, and the next one moves on. */
  process.stderr.write('  checking it is not already up … ');
  const existing = await findPublished(post);
  if (existing) {
    process.stderr.write(`found\n`);
    recordPublished(queue, post, existing.id);
    warn(
      `${post.id} was already on the account as ${existing.id} — recording it rather than posting it twice. ` +
        `A previous run published and then failed to save the record.`
    );
    process.stdout.write(`\nAlready published at ${existing.timestamp}. ${existing.permalink}\n`);
    summary(
      `### Already published — recorded, not re-posted\n\n` +
        `\`${post.id}\` was already on the account as media \`${existing.id}\` (${existing.timestamp}).\n\n` +
        `[${existing.permalink}](${existing.permalink})\n\n` +
        `A previous run published it and then failed to write the record back.`
    );
    process.exit(0);
  }
  process.stderr.write('no\n');

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

  recordPublished(queue, post, published.id);

  process.stdout.write(`\nPublished. media id ${published.id}, recorded in social/queue.json\n`);
  summary(
    `### Published \`${post.id}\`\n\n` +
      `Media id \`${published.id}\`. Image \`${image}\`.\n\n> ${caption.replace(/\n/g, '\n> ')}`
  );
} catch (error) {
  /* `fetch` reports every network-layer failure as the two words "fetch
     failed" and puts the actual cause — DNS, TLS, connection refused, timeout —
     on error.cause. Without this line a dead network and a wrong hostname read
     identically. */
  const cause = error.cause ? ` (${[error.cause.code, error.cause.message].filter(Boolean).join(' ')})` : '';
  process.stderr.write(`\n${error.message}${cause}\n`);
  summary(`### Failed\n\n\`\`\`\n${error.message}${cause}\n\`\`\``);
  process.exit(1);
}
