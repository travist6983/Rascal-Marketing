/**
 * The prompt library, in marketing voice.
 *
 * Seeded from `api/seeds/prompts.yaml` in the Project-Dogear repo — all 113 of them,
 * same order, same kinds. Two things are deliberately different here:
 *
 * 1. **They/them.** 99 of the seeded prompts are written he/him, which is a decision
 *    the product has parked (`docs/decisions.md`, open item 10) and not one that
 *    should reach a public feed. These are hand-rewritten, not machine-conjugated:
 *    "does he mispronounce" is "do they mispronounce", and no conjugator gets that
 *    right every time. The sixteen already in `app.js`'s deck are reproduced verbatim.
 *
 * 2. **The verb is split out.** `pre` + `verb` + `post` is the same shape the deck
 *    uses, and it is what lets a card mark one word. The verb is the instruction —
 *    the word that would survive if the rest of the sentence were cut.
 *
 * Kinds carry colour: QUESTION and VOICE are periwinkle, everything else terracotta,
 * matching `AssignmentPresentation.swift` in the app. The library's three
 * `measurement` prompts are PHOTO here — each one ends in "photograph it", and
 * MEASUREMENT is not a word the app puts on a badge.
 */

export const PROMPTS = [
  /* --- Questions — periwinkle ------------------------------------------- */
  { kind: 'QUESTION', cadence: 'daily', pre: 'What did they ', verb: 'say', post: ' this week that you want to remember exactly?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What are they ', verb: 'obsessed', post: ' with right now?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What do they ', verb: 'call', post: ' you? Write down every version.' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s the ', verb: 'bedtime routine', post: ' right now, step by step?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What food are they ', verb: 'refusing', post: ' this week?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What did they ', verb: 'do', post: ' today that annoyed you and will be funny in ten years?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'Who is their ', verb: 'best friend', post: ' right now, and what do they do together?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What word do they ', verb: 'mispronounce', post: ' that you don’t want to correct?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What are they ', verb: 'afraid', post: ' of right now?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What did they ', verb: 'teach', post: ' themself this month?' },
  { kind: 'QUESTION', cadence: 'daily', pre: '', verb: 'Describe', post: ' their laugh.' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What do they want to be when they ', verb: 'grow up', post: ' — this week’s version?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What song is ', verb: 'stuck', post: ' in the house right now?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s the last thing they ', verb: 'asked', post: ' that you couldn’t answer?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s the first thing they do when they ', verb: 'wake up', post: '?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What are you ', verb: 'worried', post: ' about with them right now?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What did you get ', verb: 'wrong', post: ' as a parent this week?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What does their ', verb: 'room', post: ' look like right now? Describe the mess.' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s their favorite thing to do with their ', verb: 'mom', post: '?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s a rule in your house they’d be ', verb: 'surprised', post: ' to learn isn’t universal?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What did they ', verb: 'cry', post: ' about today?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s the last thing they were ', verb: 'proud', post: ' of themself for?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What toy have they not ', verb: 'put down', post: ' this month?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What do they ', verb: 'smell', post: ' like right now?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'Who do they ', verb: 'look like', post: ' today?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What phrase have they ', verb: 'picked up', post: ' from you that you wish they hadn’t?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s the thing they do that ', verb: 'nobody else', post: ' would notice?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What did the two of you ', verb: 'argue', post: ' about?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'How do they say ', verb: 'goodbye', post: '?' },
  { kind: 'QUESTION', cadence: 'daily', pre: 'What’s ', verb: 'changed', post: ' about them in the last three months?' },

  /* --- Photo — terracotta ------------------------------------------------ */
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' their hands. Just their hands.' },
  { kind: 'PHOTO', cadence: 'daily', pre: 'Get down to their eye level and ', verb: 'take', post: ' the photo from there.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' their shoes by the door.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a picture of what they built today, however unimpressive.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' the mess they made. Don’t clean it up first.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a photo of them sleeping.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' their drawing or their handwriting, exactly as it is.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a picture of them with whoever they’re most attached to right now.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' their lunch, arranged the way they arranged it.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a photo of them doing the thing they do every single day.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' their face mid-laugh. Burst mode. Take twenty, keep one.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a picture of them in the same spot you photographed them a year ago.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' what they’re wearing today, head to toe. In ten years this is a costume.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a photo of the two of you. You’re in almost none of them.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' their favorite toy alone, like a portrait.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a picture of them outside doing nothing in particular.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a photo of them with their grandparents.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' them next to something for scale — a doorway, the dog, your hand.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' them in the first snow.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a photo of them on the first day of school.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Photograph', post: ' whatever they made out of leaves, pumpkins, or mud this month.' },
  { kind: 'PHOTO', cadence: 'daily', pre: '', verb: 'Take', post: ' a photo of what summer looks like for them this year.' },
  { kind: 'PHOTO', cadence: 'monthly', pre: '', verb: 'Go back', post: ' through your camera roll to this month last year and log three photos you never wrote down.' },
  { kind: 'PHOTO', cadence: 'monthly', pre: '', verb: 'Measure', post: ' their height and weight. Photograph them against the same wall, same spot as last time.' },
  { kind: 'PHOTO', cadence: 'monthly', pre: '', verb: 'Take', post: ' the same photo you took last month — same chair, same angle.' },
  { kind: 'PHOTO', cadence: 'monthly', pre: '', verb: 'Trace', post: ' their hand on paper and photograph it.' },

  /* --- Video — terracotta ------------------------------------------------ */
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Film', post: ' them telling you about their day. Don’t prompt them.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Ask', post: ' them ten questions about their mom and film the answers. Don’t correct anything.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Film', post: ' them doing the thing they’re currently best at.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Record', post: ' thirty seconds of them just playing. No talking to the camera.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Film', post: ' them explaining how something works.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Record', post: ' them running toward you.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Film', post: ' the bedtime routine start to finish, one take.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Ask', post: ' them what they’d say to themself at eighteen. Film it.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Film', post: ' them eating something for the first time.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Record', post: ' them dancing to whatever’s playing.' },
  { kind: 'VIDEO', cadence: 'daily', pre: '', verb: 'Film', post: ' them on the last day of the school year.' },
  { kind: 'VIDEO', cadence: 'weekly', pre: '', verb: 'Interview', post: ' them with ten questions about their mom and film the whole thing.' },

  /* --- Voice — periwinkle ------------------------------------------------ */
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them telling you a story. Any story. Don’t correct the words they say wrong.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them singing. Whatever they’re singing.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them counting as high as they can go.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them saying the alphabet.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them saying their own full name.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them describing you.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' two minutes of dinner. Don’t announce it. Just the room.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them reading a page out loud.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them telling a joke.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them talking about their best friend.' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them answering “what’s the best thing that happened today?”' },
  { kind: 'VOICE', cadence: 'daily', pre: '', verb: 'Record', post: ' them making up a song about nothing.' },

  /* --- Activity — terracotta --------------------------------------------- */
  { kind: 'ACTIVITY', cadence: 'daily', pre: 'Never ', verb: 'let go', post: ' of the hug first today. Let them be the one to pull away.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Get', post: ' on the floor for ten minutes. That’s the whole mission.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Carry', post: ' them when they ask, even though they can walk fine.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Use', post: ' their baby nickname out loud today, while they still answer to it.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Let', post: ' them help with something, even though it triples the time.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: 'Don’t ', verb: 'rush', post: ' lights-out tonight. Stay an extra ten minutes.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Say yes', post: ' to the next thing you’d normally say no to.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Let', post: ' them choose dinner. Entirely.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Ask', post: ' them a question and let the silence sit until they answer it.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Go', post: ' outside with them with no plan and no phone.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Apologize', post: ' to them for something. Out loud.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Let', post: ' them win, and don’t tell them you did.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Tell', post: ' them one specific thing you admire about them. Not “good job.”' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Do nothing', post: ' next to them for fifteen minutes.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Ask', post: ' them to teach you something.' },
  { kind: 'ACTIVITY', cadence: 'daily', pre: '', verb: 'Put', post: ' your phone in another room for the whole evening.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Take', post: ' them on a solo date and let them pick everything — where you go, what you eat, what you do.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Make', post: ' cookies together this week. Photograph the mess, not the cookies.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Build', post: ' something with them that takes more than one sitting.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Go', post: ' somewhere neither of you has been before.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Spend', post: ' an afternoon doing only what they suggest.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Cook', post: ' something from your own childhood and tell them where it came from.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Show', post: ' them where you grew up — go there, or go through the photos.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Ask', post: ' them to pick three songs and play them loud in the kitchen.' },
  { kind: 'ACTIVITY', cadence: 'weekly', pre: '', verb: 'Let', post: ' them plan and “cook” one meal, whatever that means at their age.' },

  /* --- Letter — terracotta ----------------------------------------------- */
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write', post: ' them something about money that you wish someone had told you at nineteen.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write', post: ' them a letter about exactly who they are right now. They won’t be this person next year.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write down', post: ' what you were afraid of before they were born, and what actually happened.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write', post: ' them about a mistake you made that they’ll probably make too.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write down', post: ' the story of the day they were born, in as much detail as you can still remember.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write', post: ' them something about their mother they’d never think to ask about.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write down', post: ' what you hope they keep from being four years old.' },
  { kind: 'LETTER', cadence: 'monthly', pre: '', verb: 'Write', post: ' them what you’d want them to know if you weren’t around to say it.' }
];

/**
 * Badge fill and ink per kind, resolved from `styles.css` rather than repeated as hex
 * here — the same trick `app.js` uses for the deck, and the reason a palette change on
 * the landing page reaches the cards without anyone remembering to update them.
 */
export const KIND = {
  QUESTION: { bg: 'var(--lav)', ink: 'var(--peri)' },
  VOICE: { bg: 'var(--lav)', ink: 'var(--peri)' },
  PHOTO: { bg: 'var(--peach)', ink: 'var(--terracotta)' },
  VIDEO: { bg: 'var(--peach)', ink: 'var(--terracotta)' },
  ACTIVITY: { bg: 'var(--peach)', ink: 'var(--terracotta)' },
  LETTER: { bg: 'var(--peach)', ink: 'var(--terracotta)' }
};
