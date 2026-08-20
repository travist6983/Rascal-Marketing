/**
 * The posting queue — read, write, and where it lives.
 *
 * A module rather than part of `scripts/social-queue.mjs`, because all three
 * scripts touch the queue and importing a CLI runs its main body.
 *
 * `social/queue.json` is the schedule *and* the record of what has already
 * posted. `social/queue/*.jpg` are the card images. **Both are committed** —
 * Instagram fetches an image by public URL rather than accepting an upload, so
 * the file has to be reachable on the internet before the post can be created.
 * JPEG rather than PNG because the publishing API accepts no other format.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const QUEUE_FILE = join(root, 'social', 'queue.json');
export const QUEUE_DIR = join(root, 'social', 'queue');

/** One array under one key, so the file can grow other keys without a migration. */
export function readQueue() {
  if (!existsSync(QUEUE_FILE)) return { posts: [] };
  const parsed = JSON.parse(readFileSync(QUEUE_FILE, 'utf8'));
  if (!Array.isArray(parsed.posts)) throw new Error(`${QUEUE_FILE} has no "posts" array`);
  return parsed;
}

/**
 * Written back sorted by schedule, so the file reads as a calendar and a diff
 * shows what actually changed rather than a reordering.
 */
export function writeQueue(queue) {
  queue.posts.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  writeFileSync(QUEUE_FILE, `${JSON.stringify(queue, null, 2)}\n`);
}

/**
 * Every post that is due and not yet published, earliest first.
 *
 * All of them rather than only the first, because the poster steps over an
 * entry it cannot publish. A queue that is always drained oldest-first turns
 * one uncaptioned post at the head into a feed that never moves again, and
 * returning the whole list is what lets the caller skip past it.
 */
export function dueNow(queue, now = new Date()) {
  return queue.posts.filter((post) => !post.postedAt && new Date(post.scheduledFor) <= now);
}
