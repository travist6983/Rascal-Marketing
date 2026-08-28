/* ==========================================================================
   Pocket Chronicle landing page — behaviour

   No framework, no build step, no third-party requests. Motion is scroll-driven
   where it can be: sticky pins with scroll progress mapped to transform and
   opacity, never to a property that triggers layout.
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIG

   The design's form was a prototype: it waited 800ms and declared success
   without sending anything. Put your provider's form endpoint in ENDPOINT and
   the form posts { email, source } to it for real. Leave it blank and the form
   says so rather than faking a signup.

   Examples:
     Formspree   https://formspree.io/f/xxxxxxxx
     Buttondown  https://buttondown.email/api/emails/embed-subscribe/your-name
     Your own    /api/subscribe
   -------------------------------------------------------------------------- */
const SIGNUP = {
  ENDPOINT: '',
  /* Left as 'vellum-landing' through the Aug 27 2026 Pocket Chronicle rename,
     and flagged rather than swapped. It is a `source` tag, not display copy: it
     names the surface an address came from, and it is the kind of string that
     is worth more as a stable key than as an accurate one. Nothing has been
     recorded under it — ENDPOINT above is empty and this prototype has never
     posted anywhere, so there is no stored data to keep continuity with; the
     live signup is src/assets/site.js, which sends `source` from the page's own
     data-route and never sees this constant. So renaming it is safe and leaving
     it is safe, which is exactly why it needs a decision from an owner rather
     than a sweep. README.md:37 quotes this line verbatim and must move with it. */
  SOURCE: 'vellum-landing'
};

/* Design props, from the .dc.html `data-props` block. */
const PROPS = {
  stackDepth: 4,      // 2–4
  dragToDeal: true,
  submitDelayMs: 800  // only used as the minimum spinner time
};

/* Launch. TARGET is expected to move — App Store review has its own schedule,
   so treat this date as provisional and edit it whenever it slips. */
const LAUNCH = {
  TARGET: '2026-08-27T16:00:00Z',   // App Store target — pending review
  GRACE_COPY: 'In review with Apple',
  SHIPPED_URL: null                  // set to the App Store link on launch day
};

/* App screenshots. `src: null` renders the designed empty state; setting src
   to a path is the only edit needed. See assets/README.md for dimensions. */
const SHOTS = {
  today:    { src: null, alt: "The Today screen: one question and one mission.",    w: 1290, h: 2796 },
  composer: { src: null, alt: "The composer, mid-capture.",                         w: 1290, h: 2796 },
  timeline: { src: null, alt: "The timeline, date-grouped with a photo thumbnail.", w: 1290, h: 2796 },
  detail:   { src: null, alt: "An entry with their age at the time.",                 w: 1290, h: 2796 }
};

/* Everything that starts hidden is gated on this class, so a script failure
   leaves a complete readable page rather than blank sections. */
document.documentElement.classList.add('js');

const reduced =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */
const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Normalised progress of `v` across [a, b]. */
const between = (v, a, b) => clamp01((v - a) / (b - a));

/** How far the viewport has travelled through a scroll runway, 0 → 1. */
function runwayProgress(el) {
  const r = el.getBoundingClientRect();
  const total = r.height - innerHeight;
  if (total <= 0) return r.top <= 0 ? 1 : 0;
  return clamp01(-r.top / total);
}

/* --------------------------------------------------------------------------
   Motion primitives — Apple's damping-ratio + response spring, used by the deck
   -------------------------------------------------------------------------- */
const SPRING = {
  settle:   { damping: 1.0, response: 0.40 },
  momentum: { damping: 0.8, response: 0.35 },
  fade:     { damping: 1.0, response: 0.28 },
  check:    { damping: 0.7, response: 0.35 }
};

class Spring {
  constructor(value = 0, params = SPRING.settle) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.use(params);
  }
  use({ damping, response }) {
    this.zeta = damping;
    this.omega = (2 * Math.PI) / response;
    return this;
  }
  /** Re-target without discontinuity: position and velocity carry over. */
  to(target, { velocity, params } = {}) {
    if (params) this.use(params);
    this.target = target;
    if (typeof velocity === 'number') this.velocity = velocity;
    return this;
  }
  jump(value) { this.value = this.target = value; this.velocity = 0; return this; }
  step(dt) {
    let remaining = Math.min(dt, 0.064);
    const h = 1 / 240;
    while (remaining > 0) {
      const s = Math.min(h, remaining);
      const accel =
        -this.omega * this.omega * (this.value - this.target) -
        2 * this.zeta * this.omega * this.velocity;
      this.velocity += accel * s;
      this.value += this.velocity * s;
      remaining -= s;
    }
  }
  get settled() {
    return Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.05;
  }
}

/** Where a flick comes to rest — Apple's exponential-decay projection. */
function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/* --------------------------------------------------------------------------
   Per-line headline reveal

   Lines are measured, not guessed: each word is boxed, grouped by its rendered
   top edge, then re-wrapped so the mask is a real line box. Re-measured on
   resize because the line breaks move.
   -------------------------------------------------------------------------- */
function splitLines(el) {
  if (!el.dataset.original) el.dataset.original = el.innerHTML;
  el.innerHTML = el.dataset.original;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = [];
  let n;
  while ((n = walker.nextNode())) texts.push(n);

  texts.forEach((node) => {
    const parts = node.textContent.split(/(\s+)/).filter((s) => s.length);
    const frag = document.createDocumentFragment();
    parts.forEach((p) => {
      if (/^\s+$/.test(p)) { frag.append(document.createTextNode(p)); return; }
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = p;
      frag.append(w);
    });
    node.replaceWith(frag);
  });

  const words = [...el.querySelectorAll('.w')];
  if (!words.length) return;

  const rows = [];
  let currentTop = null;
  words.forEach((w) => {
    const top = Math.round(w.getBoundingClientRect().top);
    if (currentTop === null || Math.abs(top - currentTop) > 4) {
      currentTop = top;
      rows.push([]);
    }
    rows[rows.length - 1].push(w);
  });

  // Rebuild as .ln > .ln__i, preserving each word's own inline markup.
  const out = document.createDocumentFragment();
  rows.forEach((row, i) => {
    const line = document.createElement('span');
    line.className = 'ln';
    const inner = document.createElement('span');
    inner.className = 'ln__i';
    inner.style.setProperty('--ln-delay', i * 60 + 'ms');
    row.forEach((w, j) => {
      // keep any wrapping element (e.g. .accent) around the word
      const holder = w.parentElement !== el ? w.parentElement.cloneNode(false) : null;
      const word = document.createElement('span');
      word.textContent = w.textContent;
      if (holder) { holder.append(word); inner.append(holder); } else inner.append(word);
      if (j < row.length - 1) inner.append(document.createTextNode(' '));
    });
    line.append(inner);
    out.append(line);
  });
  el.replaceChildren(out);
}

function setupLineReveals() {
  const targets = [...document.querySelectorAll('[data-lines]')];
  if (!targets.length) return;

  if (reduced) {
    targets.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const build = () => targets.forEach(splitLines);
  build();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  targets.forEach((el) => io.observe(el));

  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      targets.forEach((el) => {
        const wasRevealed = el.classList.contains('is-revealed');
        splitLines(el);
        if (wasRevealed) el.classList.add('is-revealed');
      });
    }, 200);
  });
}

/* --------------------------------------------------------------------------
   Countdown

   Three states, all rendered. Recomputed from Date.now() on every tick and
   whenever the tab comes back, so a page left open overnight is never stale.
   -------------------------------------------------------------------------- */
const cdEl = document.querySelector('[data-role="countdown"]');
const cdCounting = document.querySelector('[data-role="cdCounting"]');
const cdGrace = document.querySelector('[data-role="cdGrace"]');
const cdShipped = document.querySelector('[data-role="cdShipped"]');
const chipEl = document.querySelector('[data-role="chip"]');
const chipValue = document.querySelector('[data-role="chipValue"]');
const closeCountdown = document.querySelector('[data-role="closeCountdown"]');
const cdEyebrow = document.querySelector('[data-role="cdEyebrow"]');
const mastheadEl = document.querySelector('.masthead');

const TARGET_MS = Date.parse(LAUNCH.TARGET);

function launchState() {
  if (LAUNCH.SHIPPED_URL) return 'shipped';
  return Date.now() >= TARGET_MS ? 'grace' : 'counting';
}

/** Remaining time, never negative. */
function remaining() {
  const ms = Math.max(0, TARGET_MS - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60
  };
}

/** One masked track per digit; the column slides to the current value. */
function renderDigits(host, value, minLen = 2) {
  const str = String(Math.max(0, value)).padStart(minLen, '0');
  if (host.childElementCount !== str.length) {
    host.replaceChildren();
    for (let i = 0; i < str.length; i++) {
      const d = document.createElement('span');
      d.className = 'digit';
      const track = document.createElement('span');
      track.className = 'digit__track';
      for (let v = 0; v <= 9; v++) {
        const s = document.createElement('span');
        s.textContent = String(v);
        track.append(s);
      }
      d.append(track);
      host.append(d);
    }
  }
  [...host.children].forEach((d, i) => {
    const track = d.firstElementChild;
    track.style.transform = `translateY(${-Number(str[i])}em)`;
  });
}

function paintCountdown() {
  const state = launchState();
  cdEl.dataset.state = state;
  cdCounting.hidden = state !== 'counting';
  cdGrace.hidden = state !== 'grace';
  cdShipped.hidden = state !== 'shipped';

  // The eyebrow has to agree with whatever is under it.
  cdEyebrow.hidden = state === 'shipped';
  cdEyebrow.textContent = state === 'grace' ? 'The app is' : 'The app ships in';

  if (state === 'counting') {
    const { days, hours, minutes } = remaining();
    renderDigits(cdEl.querySelector('[data-unit="days"]'), days);
    renderDigits(cdEl.querySelector('[data-unit="hours"]'), hours);
    renderDigits(cdEl.querySelector('[data-unit="minutes"]'), minutes);

    const short = `${days}d ${String(hours).padStart(2, '0')}h`;
    chipValue.textContent = short;
    closeCountdown.textContent =
      `The app ships in ${days} ${days === 1 ? 'day' : 'days'} — pending review`;
  } else if (state === 'grace') {
    document.querySelector('[data-role="graceCopy"]').textContent = LAUNCH.GRACE_COPY;
    chipValue.textContent = LAUNCH.GRACE_COPY;
    closeCountdown.textContent = 'Submitted. Apple reviews on its own schedule.';
  } else {
    const link = document.querySelector('[data-role="storeLink"]');
    link.href = LAUNCH.SHIPPED_URL;
    chipValue.textContent = 'Out now';
    closeCountdown.textContent = 'The app is out. Your answers are already in it.';
  }
}

paintCountdown();
setInterval(paintCountdown, 1000);
addEventListener('visibilitychange', () => { if (!document.hidden) paintCountdown(); });

/** Local-time launch date, for the screenshot placeholders. */
const LAUNCH_LABEL = new Date(TARGET_MS)
  .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  .toUpperCase();

/* --------------------------------------------------------------------------
   "What lands" beats and screenshot slots
   -------------------------------------------------------------------------- */
const BEATS = [
  {
    shot: 'today', tint: 'peach',
    title: 'The prompt arrives on the phone',
    body: 'Same question, same morning. It waits on the home screen instead of ' +
          'in an inbox you already have four hundred things in.'
  },
  {
    shot: 'composer', tint: 'lav',
    title: 'Answering takes under fifteen seconds',
    body: 'Type a line, or hold to record, or shoot the photo. The composer opens ' +
          'straight into whatever the prompt asked for.'
  },
  {
    shot: 'timeline', tint: 'peach',
    title: 'Every answer keeps their age on it',
    body: 'The timeline groups by date and stamps how old they were. You will want ' +
          'to read it by age, not by year.'
  },
  {
    shot: 'detail', tint: 'lav',
    title: 'Nothing is ever deleted',
    body: 'Edits keep the original. Removing an entry hides it rather than ' +
          'destroying it. This is an archive, so it behaves like one.'
  }
];

function shotSlot(key, tint) {
  const cfg = SHOTS[key];
  const fig = document.createElement('figure');
  fig.className = 'beat__shot';

  const device = document.createElement('div');
  device.className = 'device';

  const screen = document.createElement('div');
  screen.className = 'device__screen';
  // Aspect ratio is reserved whether or not an image exists, so a later swap
  // cannot shift the layout.
  screen.style.setProperty('--shot-ar', `${cfg.w} / ${cfg.h}`);
  screen.style.setProperty('--shot-fill', `var(--${tint})`);

  if (cfg.src) {
    const img = document.createElement('img');
    img.src = cfg.src;
    img.alt = cfg.alt;
    img.width = cfg.w;
    img.height = cfg.h;
    if (key === BEATS[0].shot) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
      img.decoding = 'async';
    }
    screen.append(img);
  } else {
    const empty = document.createElement('div');
    empty.className = 'shot-empty';
    const cap = document.createElement('span');
    cap.className = 'shot-empty__caption';
    cap.textContent = `${key} screen · coming ${LAUNCH_LABEL}`.toUpperCase();
    empty.append(cap);
    empty.setAttribute('role', 'img');
    empty.setAttribute('aria-label', `Placeholder. ${cfg.alt}`);
    screen.append(empty);
  }

  device.append(screen);
  fig.append(device);
  return fig;
}

(function renderBeats() {
  const host = document.querySelector('[data-role="beats"]');
  if (!host) return;
  BEATS.forEach((b, i) => {
    const beat = document.createElement('article');
    beat.className = 'beat';

    const copy = document.createElement('div');
    copy.className = 'beat__copy';
    const n = document.createElement('p');
    n.className = 'beat__n';
    n.textContent = String(i + 1).padStart(2, '0');
    const h = document.createElement('h3');
    h.className = 'beat__title';
    h.textContent = b.title;
    const p = document.createElement('p');
    p.className = 'beat__body';
    p.textContent = b.body;
    copy.append(n, h, p);

    beat.append(copy, shotSlot(b.shot, b.tint));
    host.append(beat);
  });

  if (reduced) {
    host.querySelectorAll('.beat').forEach((b) => b.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -14% 0px', threshold: 0.12 });
  host.querySelectorAll('.beat').forEach((b) => io.observe(b));
})();

/* --------------------------------------------------------------------------
   Data — carried over verbatim from the design.
   -------------------------------------------------------------------------- */
const LIB = [
  { kind: 'QUESTION', pre: 'What did they ', verb: 'say', post: ' this week that you want to remember exactly?' },
  { kind: 'PHOTO', pre: '', verb: 'Photograph', post: ' their hands. Just their hands.' },
  { kind: 'ACTIVITY', pre: 'Never ', verb: 'let go', post: ' of the hug first today. Let them be the one to pull away.' },
  { kind: 'VOICE', pre: '', verb: 'Record', post: ' them telling you a story. Any story. Don’t correct the words they say wrong.' },
  { kind: 'QUESTION', pre: 'What word do they ', verb: 'mispronounce', post: ' that you don’t want to correct?' },
  { kind: 'PHOTO', pre: '', verb: 'Photograph', post: ' the mess they made. Don’t clean it up first.' },
  { kind: 'QUESTION', pre: 'What did they ', verb: 'do', post: ' today that annoyed you and will be funny in ten years?' },
  { kind: 'WEEKLY', pre: '', verb: 'Go', post: ' somewhere neither of you has been before.' },
  { kind: 'VOICE', pre: '', verb: 'Record', post: ' them counting as high as they can go.' },
  { kind: 'PHOTO', pre: '', verb: 'Take', post: ' a photo of the two of you. You’re in almost none of them.' },
  { kind: 'QUESTION', pre: 'What did you get ', verb: 'wrong', post: ' as a parent this week?' },
  { kind: 'ACTIVITY', pre: '', verb: 'Say yes', post: ' to the next thing you’d normally say no to.' },
  { kind: 'VOICE', pre: '', verb: 'Record', post: ' two minutes of dinner. Don’t announce it. Just the room.' },
  { kind: 'QUESTION', pre: 'What are they ', verb: 'afraid', post: ' of right now?' },
  { kind: 'PHOTO', pre: 'Get down to their eye level and ', verb: 'take', post: ' the photo from there.' },
  { kind: 'ACTIVITY', pre: '', verb: 'Put', post: ' your phone in another room for the whole evening.' }
];

/* Read the palette from CSS rather than repeating it here. */
const KIND = {
  QUESTION: { bg: 'var(--lav)', ink: 'var(--peri)' },
  VOICE:    { bg: 'var(--lav)', ink: 'var(--peri)' },
  PHOTO:    { bg: 'var(--peach)', ink: 'var(--terracotta)' },
  ACTIVITY: { bg: 'var(--peach)', ink: 'var(--terracotta)' },
  WEEKLY:   { bg: 'var(--peach)', ink: 'var(--terracotta)' }
};
const FAN = [0, 1.8, -2.2, 2.6];

const ENTRIES = [
  { date: 'MAR 2025', months: 50, text: 'The word they wouldn’t stop saying, spelled the way they said it.' },
  { date: 'JUN 2025', months: 53, text: 'Their hands, on the kitchen floor, mid-argument with a banana.' },
  { date: 'SEP 2025', months: 56, text: 'Two minutes of dinner. Nobody announced it.' },
  { date: 'JAN 2026', months: 60, text: 'What I got wrong that week, written down anyway.' },
  { date: 'APR 2026', months: 63, text: 'The story they invented about where the moon sleeps.' },
  { date: 'AUG 2026', months: 67, text: 'Ten minutes on the floor. No photo of it, and that’s fine.' }
];
const ageLabel = (m) => `${Math.floor(m / 12)}y ${m % 12}m`;

/* --------------------------------------------------------------------------
   Card deck
   -------------------------------------------------------------------------- */
const deckEl = document.getElementById('deck');
const depth = Math.max(2, Math.min(4, PROPS.stackDepth));

const FLING_X = 620;
const COMMIT_PX = 140;
const HYSTERESIS = 8;

const cards = new Map();
let cursor = 0;
let firstDeal = true;
let raf = null;
let lastFrame = 0;
let drag = null;
/* Scroll through the hero tightens the fan until the reader takes over. */
let deckScroll = 0;
let manualTakeover = false;

function buildCard(key) {
  const d = LIB[((key % LIB.length) + LIB.length) % LIB.length];
  const k = KIND[d.kind];

  const wrap = document.createElement('div');
  wrap.className = 'deck__slot';

  const article = document.createElement('article');
  article.className = 'pcard';
  article.dataset.key = String(key);

  const head = document.createElement('div');
  head.className = 'pcard__head';
  const badge = document.createElement('span');
  badge.className = 'pcard__badge';
  badge.textContent = d.kind;
  badge.style.background = k.bg;
  badge.style.color = k.ink;
  const day = document.createElement('span');
  day.className = 'pcard__day';
  head.append(badge, day);

  const text = document.createElement('p');
  text.className = 'pcard__text';
  const verb = document.createElement('span');
  verb.textContent = d.verb;
  verb.style.color = k.ink;
  text.append(document.createTextNode(d.pre), verb, document.createTextNode(d.post));

  article.append(head, text);
  wrap.append(article);
  deckEl.append(wrap);

  const slot = key - cursor;
  const rec = {
    key, wrap, article, day,
    x: new Spring(0),
    y: new Spring(slot * 16),
    scale: new Spring(1 - slot * 0.035),
    rot: new Spring(FAN[slot] ?? 0),
    op: new Spring(1),
    flying: false,
    dir: 1,
    delay: 0
  };

  if (!reduced) {
    rec.y.jump(slot * 16 + 96);
    rec.scale.jump((1 - slot * 0.035) * 0.945);
    rec.op.jump(0);
    rec.delay = firstDeal ? Math.max(0, depth - 1 - slot) * 0.08 : 0;
  } else {
    rec.op.jump(0);
  }

  cards.set(key, rec);
  return rec;
}

function ensureStack() {
  for (let k = cursor; k < cursor + depth; k++) if (!cards.has(k)) buildCard(k);
  for (const [key, rec] of cards) {
    if (!rec.flying && key >= cursor + depth) { rec.wrap.remove(); cards.delete(key); }
  }
}

function paint(rec) {
  const slot = rec.key - cursor;
  const isTop = !rec.flying && slot === 0;

  rec.wrap.style.zIndex = String(rec.flying ? 50 : 40 - Math.max(0, slot));
  rec.article.style.transform =
    `translate3d(${rec.x.value.toFixed(2)}px, ${rec.y.value.toFixed(2)}px, 0) ` +
    `scale(${rec.scale.value.toFixed(4)}) rotate(${rec.rot.value.toFixed(2)}deg)`;
  rec.article.style.opacity = rec.op.value.toFixed(3);
  rec.article.setAttribute('aria-hidden', isTop ? 'false' : 'true');
  rec.article.style.cursor = isTop ? (drag && drag.key === rec.key ? 'grabbing' : 'grab') : 'default';
  rec.day.textContent = isTop ? 'Today' : '';

  if (rec.flying) rec.article.dataset.flying = 'true';
  else delete rec.article.dataset.flying;
}

function frame(now) {
  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.064) : 1 / 60;
  lastFrame = now;
  let busy = false;

  // Before the reader touches it, hero scroll compresses the stack.
  const tighten = manualTakeover ? 0 : deckScroll;

  for (const rec of [...cards.values()]) {
    const slot = rec.key - cursor;
    const held = drag !== null && drag.key === rec.key;

    if (rec.delay > 0) { rec.delay -= dt; busy = true; paint(rec); continue; }

    if (!rec.flying) {
      rec.y.to(slot * 16 * (1 - 0.55 * tighten));
      rec.scale.to((1 - slot * 0.035) * (held ? 1.02 : 1));
      rec.op.to(slot >= 3 ? 0.55 : 1);
      if (slot !== 0) rec.rot.to((FAN[slot] ?? 0) * (1 - 0.7 * tighten));
      if (!held) rec.x.to(0);
    }

    if (!held) rec.x.step(dt);
    rec.y.step(dt);
    rec.scale.step(dt);
    rec.op.step(dt);

    if (!rec.flying && slot === 0) rec.rot.jump(rec.x.value / 30);
    else rec.rot.step(dt);

    paint(rec);

    if (rec.flying && rec.op.value < 0.02) { rec.wrap.remove(); cards.delete(rec.key); continue; }

    if (held) busy = true;
    else if (!(rec.x.settled && rec.y.settled && rec.scale.settled &&
               rec.op.settled && (slot === 0 || rec.rot.settled))) busy = true;
  }

  if (busy || drag) raf = requestAnimationFrame(frame);
  else { raf = null; lastFrame = 0; }
}

function kick() {
  if (raf === null) { lastFrame = 0; raf = requestAnimationFrame(frame); }
}

function launch(rec, dir, velocity) {
  rec.flying = true;
  rec.dir = dir;
  if (reduced) { rec.op.to(0, { params: { damping: 1, response: 0.18 } }); return; }
  rec.x.to(dir * FLING_X, { velocity, params: SPRING.momentum });
  rec.y.to(60, { params: SPRING.momentum });
  rec.rot.to(dir * 16, { params: SPRING.momentum });
  rec.scale.to(0.98, { params: SPRING.momentum });
  rec.op.to(0, { params: SPRING.fade });
}

function advance(dir, velocity = 0) {
  const rec = cards.get(cursor);
  if (!rec) return;
  manualTakeover = true;
  cursor += 1;
  launch(rec, dir, velocity);
  ensureStack();
  kick();
}

function pushSample(d, x) {
  d.history.push({ x, t: performance.now() });
  if (d.history.length > 8) d.history.shift();
}

function releaseVelocity(d) {
  const h = d.history;
  if (h.length < 2) return 0;
  const last = h[h.length - 1];
  let ref = h[0];
  for (let i = h.length - 1; i >= 0; i--) { if (last.t - h[i].t > 80) break; ref = h[i]; }
  const dt = (last.t - ref.t) / 1000;
  return dt > 0 ? (last.x - ref.x) / dt : 0;
}

deckEl.addEventListener('pointerdown', (e) => {
  if (!PROPS.dragToDeal || drag) return;
  const article = e.target.closest('.pcard');
  if (!article) return;
  const rec = cards.get(Number(article.dataset.key));
  if (!rec) return;

  if (rec.flying) {
    if (rec.op.value < 0.15) return;
    rec.flying = false;
    cursor = rec.key;
    ensureStack();
  } else if (rec.key !== cursor) return;

  manualTakeover = true;
  article.setPointerCapture(e.pointerId);
  drag = { key: rec.key, pointerId: e.pointerId, startX: e.clientX, baseX: rec.x.value, moved: false, history: [] };
  pushSample(drag, e.clientX);
  rec.x.velocity = 0;
  article.classList.add('pcard--held');
  kick();
});

deckEl.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const rec = cards.get(drag.key);
  if (!rec) return;
  const dx = e.clientX - drag.startX;
  pushSample(drag, e.clientX);
  if (!drag.moved && Math.abs(dx) < HYSTERESIS) return;
  drag.moved = true;
  rec.x.value = drag.baseX + dx;
  rec.x.velocity = 0;
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const rec = cards.get(drag.key);
  const velocity = releaseVelocity(drag);
  const moved = drag.moved;
  rec?.article.classList.remove('pcard--held');
  drag = null;
  if (!rec) { kick(); return; }
  if (!moved) { kick(); return; }

  const projected = rec.x.value + project(velocity);
  if (Math.abs(projected) > COMMIT_PX) {
    const dir = Math.sign(projected) || Math.sign(rec.x.value) || 1;
    if (rec.key === cursor) cursor += 1;
    launch(rec, dir, velocity);
    ensureStack();
  } else {
    rec.x.to(0, { velocity, params: SPRING.settle });
  }
  kick();
}

deckEl.addEventListener('pointerup', endDrag);
deckEl.addEventListener('pointercancel', endDrag);
document.getElementById('dealAnother').addEventListener('click', () => advance(1, reduced ? 0 : 900));

ensureStack();
kick();
setTimeout(() => { firstDeal = false; }, 900);

/* --------------------------------------------------------------------------
   Timeline entries
   -------------------------------------------------------------------------- */
const entriesEl = document.getElementById('entries');
const fillEl = document.getElementById('timelineFill');
const entryEls = ENTRIES.map((e) => {
  const row = document.createElement('div');
  row.className = 'entry';
  row.innerHTML =
    '<span class="entry__dot"></span>' +
    '<div class="entry__body">' +
    '<div class="entry__meta"><span class="entry__date"></span><span class="entry__age"></span></div>' +
    '<p class="entry__text"></p></div>';
  row.querySelector('.entry__date').textContent = e.date;
  row.querySelector('.entry__age').textContent = ageLabel(e.months);
  row.querySelector('.entry__text').textContent = e.text;
  entriesEl.append(row);
  return row;
});

/** Count the age pill up to its value as the entry arrives. */
function runAgeCounter(el, months) {
  if (reduced) { el.textContent = ageLabel(months); return; }
  const start = performance.now();
  const dur = 520;
  const tick = (now) => {
    const p = clamp01((now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = ageLabel(Math.round(months * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* --------------------------------------------------------------------------
   Scroll choreography
   -------------------------------------------------------------------------- */
const shapesWrap = document.getElementById('shapes');
const whyEl = document.getElementById('why');
const heroEl = document.querySelector('.hero');
const shapeEls = [...document.querySelectorAll('.shape')];
const typedEl = document.querySelector('[data-role="typed"]');
const TYPED_TEXT = typedEl ? typedEl.dataset.text : '';

let pinsEnabled = false;
function measurePins() {
  pinsEnabled = !reduced && innerWidth > 900;
  // The runway only exists when the pin does.
  shapesWrap.style.height = pinsEnabled ? '240vh' : '';
}

function paintShapes(p) {
  shapeEls[0]?.classList.toggle('is-in', p > 0.06);
  shapeEls[1]?.classList.toggle('is-in', p > 0.30);
  shapeEls[2]?.classList.toggle('is-in', p > 0.54);

  if (typedEl) {
    const chars = Math.round(between(p, 0.14, 0.40) * TYPED_TEXT.length);
    typedEl.textContent = TYPED_TEXT.slice(0, chars);
    shapeEls[0]?.classList.toggle('is-typing', chars > 0 && chars < TYPED_TEXT.length);
  }
  shapeEls[1]?.classList.toggle('is-settled', p > 0.44);
  shapeEls[2]?.classList.toggle('is-checked', p > 0.68);
}

function paintTimeline(p) {
  fillEl.style.transform = `scaleY(${p.toFixed(3)})`;
  entryEls.forEach((el, i) => {
    const on = p >= (i + 0.4) / ENTRIES.length;
    if (on && !el.classList.contains('is-on')) {
      el.classList.add('is-on');
      runAgeCounter(el.querySelector('.entry__age'), ENTRIES[i].months);
    } else if (!on && el.classList.contains('is-on')) {
      el.classList.remove('is-on');
    }
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;

    // Masthead material + docked chip.
    const heroBottom = heroEl.getBoundingClientRect().bottom;
    mastheadEl.classList.toggle('is-floating', scrollY > 8);
    mastheadEl.classList.toggle('is-docked', heroBottom < 120);
    chipEl.setAttribute('aria-hidden', heroBottom < 120 ? 'false' : 'true');

    // Hero scroll tightens the deck until the reader takes over.
    if (!manualTakeover) {
      const hr = heroEl.getBoundingClientRect();
      const next = clamp01(-hr.top / Math.max(1, hr.height * 0.7));
      if (Math.abs(next - deckScroll) > 0.004) { deckScroll = next; kick(); }
    }

    if (pinsEnabled) paintShapes(runwayProgress(shapesWrap));

    const r = whyEl.getBoundingClientRect();
    paintTimeline(clamp01((innerHeight * 0.85 - r.top) / Math.max(1, r.height * 0.78)));
  });
}

function setupChoreography() {
  measurePins();

  if (reduced || !pinsEnabled) {
    // Stacked reveal instead of a pin: the same end state, arrived at plainly.
    paintShapes(1);
    if (!reduced) {
      shapeEls.forEach((el) => el.classList.remove('is-in'));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
      shapeEls.forEach((el) => io.observe(el));
    }
  }

  if (reduced) {
    paintTimeline(1);
    mastheadEl.classList.add('is-floating');
    return;
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => {
    const was = pinsEnabled;
    measurePins();
    if (was !== pinsEnabled) setupChoreography();
    onScroll();
  });
  onScroll();
}

setupLineReveals();
setupChoreography();

/* --------------------------------------------------------------------------
   Signup forms
   -------------------------------------------------------------------------- */
function validate(v) {
  if (!v) return 'Add an email address and I’ll start tomorrow.';
  if (v.indexOf('@') === -1) return 'That address is missing an @.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return 'That address isn’t complete — check what comes after the @.';
  }
  return '';
}

document.querySelectorAll('[data-signup]').forEach((root) => {
  const form = root.querySelector('.signup__form');
  const input = root.querySelector('[data-role="input"]');
  const button = root.querySelector('[data-role="submit"]');
  const errorEl = root.querySelector('[data-role="error"]');
  const doneEl = root.querySelector('[data-role="done"]');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  input.addEventListener('input', () => showError(''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();

    const err = validate(email);
    if (err) { showError(err); input.focus(); return; }
    showError('');

    if (!SIGNUP.ENDPOINT) {
      showError(
        'This is a preview — the signup isn’t connected to anything yet, so ' +
        'that address wasn’t stored. Set ENDPOINT in app.js to switch it on.'
      );
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';

    const settle = new Promise((r) => setTimeout(r, PROPS.submitDelayMs));
    try {
      const res = await fetch(SIGNUP.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, source: SIGNUP.SOURCE })
      });
      if (!res.ok) throw new Error(String(res.status));
      await settle;
      form.hidden = true;
      doneEl.hidden = false;
    } catch {
      await settle;
      button.disabled = false;
      button.textContent = 'Send me the prompts';
      showError('That didn’t send. Try again in a moment.');
    }
  });
});
