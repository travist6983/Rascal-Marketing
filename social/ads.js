/**
 * The paid-ad set — copy only.
 *
 * This is copy, not design: social/ad.css decides how it looks, social/ad.mjs
 * decides where each element goes, scripts/ad-images.mjs renders it. Same split
 * as social/prompts.js and social/showcase.js.
 *
 * ── Rules this file follows ─────────────────────────────────────────────────
 *
 * 1. **It never implies the reader is failing.** docs/site-content.md is binding
 *    here: no regret framing, no "before they grow up", no urgency, no scarcity.
 *    A comparison ad compares capability, never diligence — the camera roll is
 *    not a failure, it is just a camera roll.
 * 2. **They/them for the child.** The captures were taken from an archive
 *    written he/him (assets/README.md), and copy laid over them must not repeat
 *    it. Where a capture's own visible text says "him", the ad carries
 *    `pronouns: 'he/him'` so it can be found and re-shot later.
 * 3. **No social proof.** There are no users yet. No counts, no stars, no
 *    quotes — inventing one on a trust-first product is unrecoverable.
 * 4. **The CTA is honest about what exists on the day it runs.** Both strings
 *    live in `CTAS` below and the renderer picks one, because a creative is
 *    booked before a store listing is live and the copy cannot be re-approved on
 *    the morning it goes up. Nothing here says "iPhone app soon" or "free by
 *    email" any more: this set is for after the app ships, and a launched
 *    product describing itself as forthcoming is the one claim an ad cannot
 *    walk back.
 * 5. **No red, and ✓ only ever affirms.** An absent thing is an em dash in grey.
 *
 * `accent` must be an exact substring of `headline` — social/ad.mjs throws if it
 * is not, because a near miss would otherwise ship as an ad with no accent and
 * no complaint.
 */

/**
 * The button, in the two states the product has.
 *
 * `waitlist` is CTA in site.config.json verbatim — the string the site's own
 * button carries, and the only honest one while there is no App Store listing
 * to send anybody to. That was true for one reason when this was written (the
 * name Dogear was occupied by a cluster of book-tracking apps, per that file's
 * note) and is true for another now: the product was renamed to Pocket
 * Chronicle on Aug 27 2026 and has never been listed under it. `launch` is the one
 * these creatives run with once the app is up, which is what they were drawn
 * for. Choose with `npm run ads -- --cta launch`; ask for both and you get both
 * sets, which is the only way to compare them at the size they will be seen.
 *
 * An ad may still carry its own `cta` and win. None does, and one probably
 * should not: four creatives in one campaign that ask for four different things
 * are four campaigns.
 */
export const CTAS = {
  waitlist: 'Get tomorrow’s prompt',
  launch: 'Download on the App Store'
};

/**
 * The line under the button, on every creative.
 *
 * /pricing's H1 verbatim (docs/site-content.md §Pricing), which is deliberate:
 * it is the one promise the site leads with, it is true on the day the app
 * ships and on every day after, and it says the free thing is a tier rather
 * than a trial without using the word "free" as bait. It replaces "Free by
 * email · iPhone app soon", which described a product that had not shipped.
 *
 * An ad may override it, and `reassurance: ''` removes it — the empty string is
 * not nullish, so it survives the fallback and renders nothing.
 */
export const REASSURANCE = 'The daily question is always free';

export const ADS = [
  {
    id: 'daily-question',
    template: 'feature',
    kicker: 'The daily question',
    headline: 'One question a day about your kid.',
    accent: 'about your kid',
    subhead:
      '{{PRODUCT}} asks something you would never think to write down, and keeps the answer with the question that caused it.',
    features: [
      {
        icon: 'question',
        label: 'The daily question',
        body: 'Free forever, whether you pay or not. Answer it in a sentence, or skip it.'
      },
      {
        icon: 'voice',
        label: 'Their voice, searchable',
        body: 'Record ten seconds. It transcribes itself and stays findable years later.'
      },
      {
        icon: 'seal',
        label: 'Sealed until eighteen',
        body: 'Write it tonight. They open it on the day you chose, and not before.'
      }
    ],
    script: 'One question. Tonight.',
    screen: 'today-two-missions',
    tint: 'terracotta',
    pronouns: 'he/him'
  },

  {
    id: 'sealed',
    template: 'notify',
    kicker: 'Letters',
    headline: 'Write it tonight. They read it in fourteen years.',
    accent: 'in fourteen years',
    subhead:
      'A sealed letter opens on a date you set and not a day sooner. Nothing in between, from anyone.',
    features: [],
    notification: {
      title: 'Today’s question',
      body: 'What do they call you? Write down every version.'
    },
    script: '',
    screen: 'entry-sealed-locked',
    tint: 'terracotta'
  },

  {
    id: 'camera-roll',
    template: 'compare',
    kicker: '',
    headline: 'The photo survives. The reason doesn’t.',
    accent: 'The reason doesn’t.',
    subhead:
      'Four thousand photos and no idea why you took them. {{PRODUCT}} keeps the question that caused the moment, filed with the moment.',
    features: [],
    columns: ['Camera roll', '{{PRODUCT}}'],
    roll: { date: 'Tuesday', note: 'A shoe. A puddle. A drawing.', tiles: 12 },
    beforeTicks: [{ none: 'The date, and nothing else' }, { none: 'No idea why you took it' }],
    afterTicks: ['The question that caused it', 'Their exact age that day'],
    script: 'Keep the reason.',
    screen: 'entry-question-answered',
    secondScreen: '',
    tint: 'terracotta',
    pronouns: 'he/him'
  },

  /* ── The kind series ──────────────────────────────────────────────────────
     One skeleton, four capture verbs. What changes between them is only the
     evidence — the thing the archive actually ends up holding — so the four
     read as one campaign and can be booked as a sequence.

     No tier claims anywhere in this series. Every tick is a capability claim,
     which is the difference between a sentence that stays true when the tiers
     move and one that has to be re-approved when they do. */

  {
    id: 'voice',
    template: 'capture',
    kicker: 'Their voice',
    headline: 'In 2041 you can still hear them say it.',
    accent: 'hear them say it.',
    subhead:
      'Ten seconds of them talking, transcribed on the way in — so an archive you can read is also one you can search by what they actually said.',
    evidence: {
      kind: 'voice',
      quote: '“It’s not a [lellow] digger, it’s a [lellow] [exclavator].”',
      stamp: '0:11 · 4y 1m'
    },
    ticks: [
      'Transcribed on the way in, not on request',
      'Findable in 2041 by the words they got wrong',
      'Filed with the prompt that asked for it'
    ],
    script: '',
    tint: 'peri'
  },

  {
    id: 'photo',
    template: 'capture',
    kicker: 'Photo',
    headline: 'A photograph of their hands, and why you took it.',
    accent: 'and why you took it.',
    subhead:
      'The camera roll keeps the date. This keeps the instruction that sent you looking, and how old they were the day you followed it.',
    evidence: {
      kind: 'plate',
      plate: 'wash',
      badge: 'Photo',
      prompt: { pre: '', verb: 'Photograph', post: ' their hands. Just their hands.' },
      note: 'Today’s mission · captured',
      stamp: '16 August 2026 · 4y 1m'
    },
    ticks: [
      'Filed with the prompt that caused it',
      'Their exact age, to the month, on every frame',
      'Findable years later by what it was about'
    ],
    script: '',
    tint: 'terracotta'
  },

  {
    id: 'video',
    template: 'capture',
    kicker: 'Video',
    headline: 'Ask them ten questions. Keep the answers.',
    accent: 'Keep the answers.',
    subhead:
      'Thirty seconds of them explaining something, filed under the question you asked and the age they were when they answered it.',
    evidence: {
      kind: 'plate',
      plate: 'still',
      badge: 'Video',
      duration: '0:34',
      prompt: { pre: '', verb: 'Ask', post: ' them ten questions about their mom and film the answers.' },
      note: 'Don’t correct anything',
      stamp: '20 August 2026 · 4y 1m'
    },
    ticks: [
      'The answers, not just the face',
      'Filed under the question you actually asked',
      'Their exact age on the day you filmed it'
    ],
    script: '',
    tint: 'terracotta'
  },

  {
    id: 'activity',
    template: 'capture',
    kicker: 'Activity',
    headline: 'Some days the prompt is not to write anything.',
    accent: 'not to write anything.',
    subhead:
      'Some days the prompt asks for nothing but your attention for ten minutes. You mark it done, and that is the entry.',
    evidence: {
      kind: 'did',
      badge: 'Activity',
      prompt: { pre: 'Never ', verb: 'let go', post: ' of the hug first today. Let them be the one to pull away.' },
      done: 'Did it',
      note: 'No photo. No writing. Nothing to catch up on.',
      stamp: '21 August 2026 · 4y 1m'
    },
    ticks: [
      'The prompt is the whole instruction',
      'One tap when it’s done — nothing to write',
      'Skip it and nothing happens. No streak to lose'
    ],
    script: '',
    tint: 'terracotta'
  },

  /* ── The four that are their own shape ───────────────────────────────────── */

  /* The only creative with no phone on it. The product is the archive, so this
     one shows four years of one question rather than an interface. The entries
     are written, not captured: there is no screenshot of a 2029 archive to take
     and inventing one as a fake screen would be a different kind of claim. */
  {
    id: 'ledger',
    template: 'ledger',
    kicker: 'The archive',
    headline: 'One question. Four years of answers.',
    accent: 'Four years of answers.',
    subhead:
      'Every answer stays filed with the question that caused it, so the archive can be read down a column instead of scrolled.',
    questionLabel: 'The question',
    question: 'What are they obsessed with right now?',
    entries: [
      {
        date: 'August 2026',
        age: '4y 1m',
        answer: 'Diggers. Specifically the yellow one at the end of the street. They wait for it.'
      },
      {
        date: 'August 2027',
        age: '5y 1m',
        answer: 'Sharks. They can name nine of them and will, unprompted, at dinner.'
      },
      {
        date: 'August 2028',
        age: '6y 1m',
        answer: 'The word “actually”. Everything is actually something else now.'
      },
      {
        date: 'August 2029',
        age: '7y 1m',
        answer: 'Going faster down the hill than I like. I say nothing. They know.'
      }
    ],
    script: 'Read it down a column.',
    tint: 'terracotta'
  },

  /* The ad that does not look like an ad: social/card.css's own vocabulary at
     ad size. It buys the highest scroll-stop in the set and the lowest click
     intent, and it is the one creative whose attribution will be muddy, because
     it is nearly the organic post. That is the trade, made on purpose. */
  {
    id: 'native-card',
    template: 'card',
    badge: 'Question',
    stamp: 'Today',
    headline: 'What word do they mispronounce that you don’t want to correct?',
    accent: '',
    prompt: {
      pre: 'What word do they ',
      verb: 'mispronounce',
      post: ' that you don’t want to correct?'
    },
    reassurance: '',
    script: '',
    tint: 'peri'
  },

  {
    id: 'free-tier',
    template: 'pricing',
    headline: 'The daily question is always free.',
    accent: 'always free.',
    subhead:
      'Every day, forever, with no card and no end date. Membership is what fills in the rest of the day.',
    columns: ['Free', 'Membership'],
    /* Rows with a real free entry sit above the rows without one, as /pricing
       orders them: a table whose free column opens with a run of dashes reads as
       a punishment list. `null` is an absent thing and draws an em dash. */
    rows: [
      ['The daily question', 'Every day, forever', 'Every day, forever'],
      ['Written entries and did it', 'Unlimited', 'Unlimited'],
      ['Photos', '{{FREE_PHOTOS}}, lifetime', 'No limit'],
      ['Search and full export', 'Always', 'Always'],
      ['Ads', 'None', 'None'],
      ['Daily missions', null, 'Weekdays, two at the weekend'],
      ['Sealed letters and video', null, 'Included'],
      ['The second parent', null, 'Included']
    ],
    price: {
      label: 'Price',
      free: '$0',
      paid: '{{PRICE_YEAR}}/yr',
      note: 'or {{PRICE_MONTH}}/mo'
    },
    promise: 'Nothing you write or capture is ever locked behind payment.',
    script: '',
    tint: 'terracotta'
  },

  {
    id: 'library',
    template: 'library',
    kicker: 'The library',
    headline: '{{PROMPT_COUNT}} questions you would never think to ask.',
    accent: 'never think to ask.',
    /* Real prompts, in the library's own words. Kind carries colour exactly as
       it does on a prompt card: question and voice are periwinkle, everything
       else terracotta. */
    wall: [
      { kind: 'q', text: 'Describe their laugh.' },
      { kind: 'p', text: 'Photograph their hands. Just their hands.' },
      { kind: 'q', text: 'What food are they refusing this week?' },
      { kind: 'v', text: 'Record them counting as high as they can go.' },
      { kind: 'q', text: 'What do they smell like right now?' },
      { kind: 'p', text: 'Photograph their shoes by the door.' },
      { kind: 'q', text: 'Who do they look like today?' },
      { kind: 'v', text: 'Record them saying their own full name.' },
      { kind: 'q', text: 'What did they cry about today?' },
      { kind: 'p', text: 'Get down to their eye level and take the photo.' },
      { kind: 'q', text: 'How do they say goodbye?' },
      { kind: 'v', text: 'Record two minutes of dinner. Just the room.' },
      { kind: 'q', text: 'What are they afraid of right now?' },
      { kind: 'q', text: 'What did you get wrong as a parent this week?' },
      { kind: 'p', text: 'Photograph the mess they made. Don’t clean it up first.' },
      { kind: 'q', text: 'What song is stuck in the house right now?' },
      { kind: 'p', text: 'Film them explaining how something works.' },
      { kind: 'p', text: 'Let them win, and don’t tell them you did.' }
    ],
    featured: {
      label: 'Tonight',
      prompt: {
        pre: 'What phrase have they ',
        verb: 'picked up',
        post: ' from you that you wish they hadn’t?'
      }
    },
    note: 'One arrives a day. You answer it in a sentence, or you skip it and nothing happens.',
    script: 'One a day. That’s it.',
    tint: 'terracotta'
  },

  {
    id: 'no-streaks',
    template: 'quiet',
    kicker: 'No streaks',
    headline: 'Miss a day and nothing happens.',
    accent: 'nothing happens',
    subhead:
      'No streak to keep, no badge to clear, nothing to catch up on. The archive does not keep score of you.',
    features: [],
    promises: ['No streaks', 'No badges', 'No red'],
    script: '',
    screen: 'onboarding-notifications',
    tint: 'peri'
  }
];
