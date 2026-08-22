#!/usr/bin/env node
/**
 * Writes captions for queued posts that don't have one yet.
 *
 *   npm run social:captions                 every post missing a caption
 *   npm run social:captions -- --limit 3
 *   npm run social:captions -- --id 2026-08-15-photograph-their-hands --force
 *   npm run social:captions -- --dry-run    print the prompt, call nothing
 *
 * Captions are generated as a **separate step from posting, on purpose.** The
 * poster refuses to publish an entry with no caption, so nothing reaches the
 * feed that a person hasn't read. Generate, open social/queue.json, edit
 * anything that isn't right, commit — then it can post.
 *
 * ── FILL IN ──────────────────────────────────────────────────────────────────
 * VOICE below is the brand brief. It is the one part of this file worth
 * rewriting: it decides how every caption sounds. Everything else is plumbing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readQueue, writeQueue } from '../social/queue.mjs';

/* The SDK is imported where it is used, not at the top, so `--dry-run` and
   `--help` work in a checkout where `npm install` has never been run. */

/* Claude Opus 5 — see https://platform.claude.com/docs/en/about-claude/models/overview */
const MODEL = 'claude-opus-5';
const EFFORT = 'medium';

/* Instagram's own limits. Exceeding either is a rejected post, not a warning. */
const MAX_CAPTION = 2200;
const MAX_HASHTAGS = 30;

/* ── FILL IN: the brand brief ───────────────────────────────────────────────
   Drawn from the landing page and docs/design-system.md in the app repo. Edit
   freely — this is the whole personality of the account. */
const VOICE = `
You write Instagram captions for Vellum, an app that sends a parent one prompt a
day about their kid and keeps the answers as a private archive.

The voice, in the words the product already uses:
- A friend who noticed, not an app that tracked.
- Warm, direct, unsentimental. Never precious about childhood, never saccharine.
- It reports; it never congratulates. No confetti, no streaks, no "you've got this!"
- Short sentences. Concrete nouns. The specific detail beats the general feeling.
- Talks to one tired parent, not to an audience.

Hard rules:
- Never use "he" or "she" for the child. They/them, or second person ("your kid").
- No emoji. No exclamation marks. No rhetorical questions stacked for effect.
- Never promise the app will make anyone a better parent, and never imply the
  reader is failing or running out of time. No guilt, no urgency, no FOMO.
- Don't describe the card image or say "this prompt" — the image is right there.
- Don't say "Vellum" more than once, and only if it earns the space.
- Never say what is free. The free tier is the daily question only; the missions
  are part of membership, and most cards in this queue are missions. A caption
  that says "free" about the card it sits under will usually be wrong, and it is
  wrong in public and permanently.
`.trim();

const TASK = `
The image is a plain cream card with the prompt on it, so the caption's job is
to sit underneath and add something the card doesn't already say: why this
prompt is worth doing, or what it tends to turn up.

Write:
- caption: 1–3 short sentences, under 300 characters. No hashtags in this field.
- alt_text: a literal description of the card for a screen reader — the kind
  badge, the prompt text as written, the cream card. Under 200 characters.
- hashtags: 3 to 6, lowercase, no punctuation beyond the words themselves.
  Relevant to parenting and memory-keeping. No banned or spammy tags, and
  nothing that reads as engagement bait.
`.trim();

const SCHEMA = {
  type: 'object',
  properties: {
    caption: { type: 'string', description: 'The caption body. No hashtags.' },
    alt_text: { type: 'string', description: 'Literal description of the card image.' },
    hashtags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Hashtags without the leading # character.'
    }
  },
  required: ['caption', 'alt_text', 'hashtags'],
  additionalProperties: false
};

const HELP = `
Vellum social captions

  npm run social:captions -- [options]

  --limit N     caption at most N posts       (all that need one)
  --id ID       caption one specific entry
  --force       rewrite captions that already exist
  --dry-run     print the prompt that would be sent, call nothing
  --model ID    override the model            (${MODEL})

  Needs ANTHROPIC_API_KEY in the environment, or an \`ant auth login\` profile.
`;

function userPrompt(post) {
  return `${TASK}\n\nThe prompt on the card (kind: ${post.kind}):\n\n"${post.prompt}"`;
}

/** Reads the one text block a structured-output response returns. */
function parseOutput(response) {
  /* A refusal is a successful HTTP 200 with an empty or partial content array —
     reading content[0] without this check throws on the happy-path shape. */
  if (response.stop_reason === 'refusal') {
    throw new Error(
      `the model declined this request (${response.stop_details?.category ?? 'no category given'}). ` +
        'Nothing was written.'
    );
  }
  const text = response.content.find((block) => block.type === 'text');
  if (!text) throw new Error(`no text block in the response (stop_reason: ${response.stop_reason})`);
  return JSON.parse(text.text);
}

function validate(result, post) {
  const problems = [];
  if (!result.caption?.trim()) problems.push('caption is empty');
  if (result.caption && result.caption.length > MAX_CAPTION) {
    problems.push(`caption is ${result.caption.length} characters, over Instagram's ${MAX_CAPTION}`);
  }
  if (!result.alt_text?.trim()) problems.push('alt_text is empty');
  if (result.hashtags.length > MAX_HASHTAGS) {
    problems.push(`${result.hashtags.length} hashtags, over Instagram's ${MAX_HASHTAGS}`);
  }
  /* The one rule worth enforcing in code rather than trusting to the prompt:
     gendered copy about the child is the whole reason social/prompts.js exists. */
  if (/\b(he|she|his|her|hers|him|himself|herself)\b/i.test(result.caption)) {
    problems.push('caption uses a gendered pronoun for the child — rewrite it in they/them');
  }
  if (problems.length > 0) {
    throw new Error(`caption for ${post.id} failed checks:\n  - ${problems.join('\n  - ')}`);
  }
}

function parseArgs(argv) {
  const opts = { limit: null, id: null, force: false, dryRun: false, model: MODEL, help: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined) throw new Error(`${flag} needs a value`);
      return next;
    };
    switch (flag) {
      case '--limit': opts.limit = Number(value()); break;
      case '--id': opts.id = value(); break;
      case '--model': opts.model = value(); break;
      case '--force': opts.force = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`unknown option ${flag}`);
    }
  }
  if (opts.limit !== null && (!Number.isInteger(opts.limit) || opts.limit < 1)) {
    throw new Error('--limit must be a positive integer');
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
  let targets = queue.posts.filter((post) => !post.postedAt);
  if (opts.id) {
    targets = targets.filter((post) => post.id === opts.id);
    if (targets.length === 0) throw new Error(`no unposted entry with id "${opts.id}"`);
  }
  if (!opts.force) targets = targets.filter((post) => !post.caption);
  if (opts.limit !== null) targets = targets.slice(0, opts.limit);

  if (targets.length === 0) {
    process.stdout.write('every queued post already has a caption. Use --force to rewrite one.\n');
    process.exit(0);
  }

  if (opts.dryRun) {
    process.stdout.write(`--- system ---\n${VOICE}\n\n--- user (${targets[0].id}) ---\n`);
    process.stdout.write(`${userPrompt(targets[0])}\n\n`);
    process.stdout.write(`${targets.length} posts would be captioned with ${opts.model}. Nothing was sent.\n`);
    process.exit(0);
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk').catch(() => {
    throw new Error("@anthropic-ai/sdk is not installed — run `npm install` first.");
  });

  /* Zero-arg constructor: picks up ANTHROPIC_API_KEY, or an `ant auth login`
     profile, without this script needing to know which. */
  const client = new Anthropic();

  let spentIn = 0;
  let spentOut = 0;

  for (const post of targets) {
    process.stderr.write(`  ${post.id} … `);
    const response = await client.beta.messages.create({
      model: opts.model,
      max_tokens: 16000,
      /* Opt into the recommended fallback: if a safety classifier ever declines
         a request, it is re-served by another model inside the same call rather
         than coming back as a dead entry. */
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: VOICE,
      output_config: { effort: EFFORT, format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: userPrompt(post) }]
    });

    const result = parseOutput(response);
    validate(result, post);

    post.caption = result.caption.trim();
    post.altText = result.alt_text.trim();
    post.hashtags = result.hashtags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean);

    spentIn += response.usage.input_tokens;
    spentOut += response.usage.output_tokens;
    process.stderr.write('done\n');
    process.stdout.write(`\n${post.caption}\n#${post.hashtags.join(' #')}\n`);
  }

  writeQueue(queue);

  /* Claude Opus 5 list pricing, so the number below is an estimate you can sanity-check
     against the Console rather than a bill. */
  const estimate = (spentIn / 1e6) * 5 + (spentOut / 1e6) * 25;
  process.stdout.write(
    `\n${targets.length} captioned → social/queue.json\n` +
      `${spentIn} in / ${spentOut} out tokens · roughly $${estimate.toFixed(3)}\n` +
      'Read them before you commit. The poster will publish exactly what is in that file.\n'
  );
} catch (error) {
  process.stderr.write(`\n${error.message}\n`);
  if (/api[_ ]key|authentication|credential/i.test(error.message)) {
    process.stderr.write('Set ANTHROPIC_API_KEY, or run `ant auth login`.\n');
  }
  process.exit(1);
}
