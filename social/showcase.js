/**
 * The Instagram set: 10 feed posts and 5 reels, built from the app captures in
 * assets/.
 *
 * This is copy, not design — `video/src/Post.tsx` and `video/src/Showcase.tsx`
 * decide how it looks, `scripts/social-showcase.mjs` renders it. Same split as
 * social/prompts.js and social/card.css.
 *
 * ── Two rules the copy here follows ─────────────────────────────────────────
 *
 * 1. **They/them, always.** The archive in the screenshots is written he/him
 *    (see assets/README.md), and the copy laid over it must not repeat that —
 *    the landing page took a position and a feed is not the place to contradict
 *    it. Where a screenshot's own visible text says "he", that is flagged on the
 *    entry as `pronouns: 'he/him'` so it can be found and re-captured later.
 *
 * 2. **It reports, it never congratulates.** Same brief as the caption writer in
 *    scripts/social-caption.mjs: a friend who noticed, not an app that tracked.
 *    Short sentences, concrete nouns, no emoji, no exclamation marks, and never
 *    a promise that this makes anybody a better parent.
 *
 * Screens are named as they sit in assets/screens, without the extension. Only
 * captures that are safe to publish are used here — nothing with an email
 * address, a real account name, or a development-only affordance in frame.
 */

/** 1080 × 1350. The device bleeds off the bottom edge, so top-anchored screens work best. */
export const POSTS = [
  {
    id: 'daily',
    screen: 'today-two-missions',
    kicker: 'The daily',
    headline: 'One question a day about your kid.',
    body: 'It waits on the home screen instead of in an inbox you already have four hundred things in.',
    tint: 'terracotta',
    pronouns: 'he/him'
  },
  {
    id: 'words',
    screen: 'entry-written-note',
    kicker: 'What they say',
    headline: 'Hangaburger.',
    body: 'The words they get wrong are the first thing to go. Write them down while they are still wrong.',
    tint: 'peri',
    pronouns: 'he/him'
  },
  {
    id: 'sealed',
    screen: 'entry-sealed-locked',
    kicker: 'Letters',
    headline: 'Sealed until 18.',
    body: 'Write it tonight. They open it in fourteen years. Nothing in between.',
    tint: 'terracotta'
  },
  {
    id: 'letter',
    screen: 'entry-sealed-open',
    kicker: 'Letters',
    headline: 'The things you would never say out loud.',
    body: 'Kept exactly as you wrote them, until they are old enough to read them.',
    tint: 'terracotta'
  },
  {
    id: 'voice',
    screen: 'entry-voice',
    kicker: 'Their voice',
    headline: 'You will forget what they sounded like.',
    body: 'Record it and it transcribes itself. Findable years later by a word you half remember.',
    tint: 'peri'
  },
  {
    id: 'age',
    screen: 'timeline-all',
    kicker: 'The archive',
    headline: 'Every answer keeps their age on it.',
    body: 'Four years, one month. You will want to read it by how old they were, not by the year.',
    tint: 'peri',
    pronouns: 'he/him'
  },
  {
    id: 'moments',
    screen: 'moments-on-this-day',
    kicker: 'On this day',
    headline: 'A year ago today, they said this.',
    body: 'The archive gives things back. That is the part nobody mentions about writing it down.',
    tint: 'terracotta',
    pronouns: 'he/him'
  },
  {
    id: 'pronouns',
    screen: 'onboarding-pronouns',
    kicker: 'Setup',
    headline: 'He, she, or they.',
    body: 'Every question is written for your kid, in the words you already use for them.',
    tint: 'peri'
  },
  {
    id: 'quiet',
    screen: 'onboarding-notifications',
    kicker: 'No streaks',
    headline: 'One note a day. Never more than one.',
    body: 'No streak to keep, no badge to clear, nothing to catch up on. Off whenever you want.',
    tint: 'terracotta'
  },
  {
    id: 'age-stamp',
    screen: 'onboarding-birthdate',
    kicker: 'Setup',
    headline: 'One date, and every entry knows how old they were.',
    body: 'Set it once. It stamps an exact age on everything you write, forever.',
    tint: 'peri'
  }
];

/**
 * 1080 × 1920. Scenes play in order and dip through the paper between each —
 * see video/src/Showcase.tsx for why the fade does not cross-dissolve.
 *
 * Scene kinds:
 *   card    a line on bare paper, no device
 *   screen  a caption over a screenshot in the phone frame
 *   clip    the same, with a recording playing instead of a still
 */
export const REELS = [
  {
    id: 'daily',
    tint: 'terracotta',
    pronouns: 'he/him',
    scenes: [
      { kind: 'card', text: 'One question a day about your kid.', seconds: 2.6 },
      { kind: 'screen', screen: 'today-two-missions', caption: 'It arrives in the morning.', seconds: 3.4 },
      { kind: 'screen', screen: 'entry-question-answered', caption: 'Answering takes a sentence.', seconds: 3.4 },
      { kind: 'card', text: 'The part you would have forgotten by Friday.', seconds: 2.8 }
    ]
  },
  {
    id: 'sealed',
    tint: 'terracotta',
    scenes: [
      { kind: 'card', text: 'Some things should not be said yet.', seconds: 2.6 },
      { kind: 'screen', screen: 'entry-sealed-locked', caption: 'Write it now. Seal it.', seconds: 3.4 },
      { kind: 'screen', screen: 'entry-sealed-open', caption: 'They read it at eighteen.', seconds: 3.6 },
      { kind: 'card', text: 'Fourteen years is a long time to keep a letter safe.', seconds: 3 }
    ]
  },
  {
    id: 'voice',
    tint: 'peri',
    pronouns: 'he/him',
    scenes: [
      { kind: 'card', text: 'You will forget what they sounded like.', seconds: 2.8 },
      { kind: 'screen', screen: 'entry-voice', caption: 'Record it. It writes itself down.', seconds: 3.4 },
      { kind: 'screen', screen: 'timeline-filter-voice', caption: 'Every recording, kept and searchable.', seconds: 3.2 },
      { kind: 'card', text: 'Their voice, at four years and one month.', seconds: 2.8 }
    ]
  },
  {
    id: 'archive',
    tint: 'peri',
    pronouns: 'he/him',
    scenes: [
      { kind: 'card', text: 'Four years, one month.', seconds: 2.4 },
      { kind: 'screen', screen: 'timeline-all', caption: 'Every entry stamped with their exact age.', seconds: 3.4 },
      { kind: 'screen', screen: 'moments-on-this-day', caption: 'And handed back a year later.', seconds: 3.4 },
      { kind: 'card', text: 'An archive, not a feed.', seconds: 2.6 }
    ]
  },
  {
    id: 'tour',
    tint: 'terracotta',
    pronouns: 'he/him',
    scenes: [
      { kind: 'card', text: 'This is the whole app.', seconds: 2.4 },
      { kind: 'clip', clip: 'tour-tabs', caption: 'Today, the timeline, and what happened a year ago.', seconds: 9.6 },
      { kind: 'card', text: 'Nothing to keep up with.', seconds: 2.6 }
    ]
  }
];
