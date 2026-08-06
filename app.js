/* ==========================================================================
   RASCAL landing page — behaviour

   A direct port of the `Component extends DCLogic` class in
   "RASCAL Landing.dc.html". Same prompt library, same copy, same visual
   design; React state and the x-dc template bindings are replaced with
   plain DOM updates.

   The card deck's motion follows the apple-design skill in
   .claude/skills/apple-design: springs rather than fixed-duration curves,
   1:1 tracking with pointer capture, release velocity handed into the
   animation, momentum projection deciding the landing, and every card
   grabbable mid-flight.
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
  SOURCE: 'rascal-landing'
};

/* Design props, from the .dc.html `data-props` block. */
const PROPS = {
  stackDepth: 4,      // 2–4
  dragToDeal: true,
  submitDelayMs: 800  // only used as the minimum spinner time
};

const reduced =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Motion primitives

   Apple parameterises springs as damping ratio + response rather than
   mass/stiffness/damping, so that is what this takes. Response is not a
   duration — the settle time emerges from the parameters.
   -------------------------------------------------------------------------- */
const SPRING = {
  settle:   { damping: 1.0, response: 0.40 },  // reposition — critically damped
  momentum: { damping: 0.8, response: 0.35 },  // after a flick — a little overshoot
  fade:     { damping: 1.0, response: 0.28 }
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

  jump(value) {
    this.value = this.target = value;
    this.velocity = 0;
    return this;
  }

  step(dt) {
    // Fixed substeps keep the integration stable when a frame runs long.
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

/**
 * Where a flick comes to rest. This is Apple's exponential-decay projection
 * from the Designing Fluid Interfaces sample code — not the textbook
 * v² / 2a — so a throw lands where the gesture was actually heading.
 */
function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/* --------------------------------------------------------------------------
   Data — carried over verbatim from the design.
   -------------------------------------------------------------------------- */
const LIB = [
  { kind: 'QUESTION', pre: 'What did he ', verb: 'say', post: ' this week that you want to remember exactly?' },
  { kind: 'PHOTO', pre: '', verb: 'Photograph', post: ' his hands. Just his hands.' },
  { kind: 'ACTIVITY', pre: 'Never ', verb: 'let go', post: ' of the hug first today. Let him be the one to pull away.' },
  { kind: 'VOICE', pre: '', verb: 'Record', post: ' him telling you a story. Any story. Don’t correct the words he says wrong.' },
  { kind: 'QUESTION', pre: 'What word does he ', verb: 'mispronounce', post: ' that you don’t want to correct?' },
  { kind: 'PHOTO', pre: '', verb: 'Photograph', post: ' the mess he made. Don’t clean it up first.' },
  { kind: 'QUESTION', pre: 'What did he ', verb: 'do', post: ' today that annoyed you and will be funny in ten years?' },
  { kind: 'WEEKLY', pre: '', verb: 'Go', post: ' somewhere neither of you has been before.' },
  { kind: 'VOICE', pre: '', verb: 'Record', post: ' him counting as high as he can go.' },
  { kind: 'PHOTO', pre: '', verb: 'Take', post: ' a photo of the two of you. You’re in almost none of them.' },
  { kind: 'QUESTION', pre: 'What did you get ', verb: 'wrong', post: ' as a parent this week?' },
  { kind: 'ACTIVITY', pre: '', verb: 'Say yes', post: ' to the next thing you’d normally say no to.' },
  { kind: 'VOICE', pre: '', verb: 'Record', post: ' two minutes of dinner. Don’t announce it. Just the room.' },
  { kind: 'QUESTION', pre: 'What is he ', verb: 'afraid', post: ' of right now?' },
  { kind: 'PHOTO', pre: 'Get down to his eye level and ', verb: 'take', post: ' the photo from there.' },
  { kind: 'ACTIVITY', pre: '', verb: 'Put', post: ' your phone in another room for the whole evening.' }
];

const TERRA = '#C05A2B';
const PERI = '#5566D6';
const KIND = {
  QUESTION: { bg: '#E9EBFB', ink: PERI },
  VOICE: { bg: '#E9EBFB', ink: PERI },
  PHOTO: { bg: '#FBEDE2', ink: TERRA },
  ACTIVITY: { bg: '#FBEDE2', ink: TERRA },
  WEEKLY: { bg: '#FBEDE2', ink: TERRA }
};
const FAN = [0, 1.8, -2.2, 2.6];

const ENTRIES = [
  { date: 'MAR 2025', age: '4y 2m', text: 'The word he wouldn’t stop saying, spelled the way he said it.' },
  { date: 'JUN 2025', age: '4y 5m', text: 'His hands, on the kitchen floor, mid-argument with a banana.' },
  { date: 'SEP 2025', age: '4y 8m', text: 'Two minutes of dinner. Nobody announced it.' },
  { date: 'JAN 2026', age: '5y 0m', text: 'What I got wrong that week, written down anyway.' },
  { date: 'APR 2026', age: '5y 3m', text: 'The story he invented about where the moon sleeps.' },
  { date: 'AUG 2026', age: '5y 7m', text: 'Ten minutes on the floor. No photo of it, and that’s fine.' }
];

/* --------------------------------------------------------------------------
   Card deck
   -------------------------------------------------------------------------- */
const deckEl = document.getElementById('deck');
const depth = Math.max(2, Math.min(4, PROPS.stackDepth));

const FLING_X = 620;    // px a discarded card travels
const COMMIT_PX = 140;  // projected distance that counts as thrown away
const HYSTERESIS = 8;   // px of movement before a press becomes a drag

const cards = new Map(); // key -> record
let cursor = 0;
let firstDeal = true;
let raf = null;
let lastFrame = 0;
let drag = null;

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

  // Deal in from below the stack, unless motion is reduced.
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
  for (let k = cursor; k < cursor + depth; k++) {
    if (!cards.has(k)) buildCard(k);
  }
  // A card grabbed back out of its exit shifts the cursor down; drop anything
  // that was dealt in behind it and is now past the bottom of the stack.
  for (const [key, rec] of cards) {
    if (!rec.flying && key >= cursor + depth) {
      rec.wrap.remove();
      cards.delete(key);
    }
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
  rec.article.style.cursor = isTop
    ? (drag && drag.key === rec.key ? 'grabbing' : 'grab')
    : 'default';
  rec.day.textContent = isTop ? 'Today' : '';

  if (rec.flying) rec.article.dataset.flying = 'true';
  else delete rec.article.dataset.flying;
}

function frame(now) {
  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.064) : 1 / 60;
  lastFrame = now;
  let busy = false;

  for (const rec of [...cards.values()]) {
    const slot = rec.key - cursor;
    const held = drag !== null && drag.key === rec.key;

    if (rec.delay > 0) {
      rec.delay -= dt;
      busy = true;
      paint(rec);
      continue;
    }

    if (!rec.flying) {
      rec.y.to(slot * 16);
      rec.scale.to((1 - slot * 0.035) * (held ? 1.02 : 1));
      rec.op.to(slot >= 3 ? 0.55 : 1);
      if (slot !== 0) rec.rot.to(FAN[slot] ?? 0);
      if (!held) rec.x.to(0);
    }

    // The held card's X is the pointer's, 1:1 — nothing else may drive it.
    if (!held) rec.x.step(dt);
    rec.y.step(dt);
    rec.scale.step(dt);
    rec.op.step(dt);

    if (!rec.flying && slot === 0) {
      // Rotation is glued to displacement so the card banks with the throw.
      rec.rot.jump(rec.x.value / 30);
    } else {
      rec.rot.step(dt);
    }

    paint(rec);

    if (rec.flying && rec.op.value < 0.02) {
      rec.wrap.remove();
      cards.delete(rec.key);
      continue;
    }

    if (held) busy = true;
    else if (!(rec.x.settled && rec.y.settled && rec.scale.settled &&
               rec.op.settled && (slot === 0 || rec.rot.settled))) {
      busy = true;
    }
  }

  if (busy || drag) {
    raf = requestAnimationFrame(frame);
  } else {
    raf = null;
    lastFrame = 0;
  }
}

function kick() {
  if (raf === null) {
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }
}

function launch(rec, dir, velocity) {
  rec.flying = true;
  rec.dir = dir;

  if (reduced) {
    // Non-vestibular equivalent: it leaves by fading, not by flying.
    rec.op.to(0, { params: { damping: 1, response: 0.18 } });
    return;
  }

  rec.x.to(dir * FLING_X, { velocity, params: SPRING.momentum });
  rec.y.to(60, { params: SPRING.momentum });
  rec.rot.to(dir * 16, { params: SPRING.momentum });
  rec.scale.to(0.98, { params: SPRING.momentum });
  rec.op.to(0, { params: SPRING.fade });
}

function advance(dir, velocity = 0) {
  const rec = cards.get(cursor);
  if (!rec) return;
  cursor += 1;
  launch(rec, dir, velocity);
  ensureStack();
  kick();
}

/* --- gesture ------------------------------------------------------------ */

function pushSample(d, x) {
  d.history.push({ x, t: performance.now() });
  if (d.history.length > 8) d.history.shift();
}

/** Velocity in px/s, measured over the last ~80ms of pointer travel. */
function releaseVelocity(d) {
  const h = d.history;
  if (h.length < 2) return 0;
  const last = h[h.length - 1];
  let ref = h[0];
  for (let i = h.length - 1; i >= 0; i--) {
    if (last.t - h[i].t > 80) break;
    ref = h[i];
  }
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
    // Interruptibility: a card on its way out can be caught and brought back,
    // starting from wherever it currently is on screen.
    if (rec.op.value < 0.15) return;
    rec.flying = false;
    cursor = rec.key;
    ensureStack();
  } else if (rec.key !== cursor) {
    return;
  }

  article.setPointerCapture(e.pointerId);
  drag = {
    key: rec.key,
    pointerId: e.pointerId,
    startX: e.clientX,
    baseX: rec.x.value,   // respect where they grabbed it, not its centre
    moved: false,
    history: []
  };
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
  if (!moved) { kick(); return; }   // a press, not a throw

  // Land where the gesture was going, not where the finger happened to stop.
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

document.getElementById('dealAnother').addEventListener('click', () => {
  advance(1, reduced ? 0 : 900);   // a synthetic flick, so the button feels physical
});

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
    '<div class="entry__meta"><span class="entry__date"></span><span class="entry__age"></span></div>' +
    '<p class="entry__text"></p>';
  row.querySelector('.entry__date').textContent = e.date;
  row.querySelector('.entry__age').textContent = e.age;
  row.querySelector('.entry__text').textContent = e.text;
  entriesEl.append(row);
  return row;
});

/* --------------------------------------------------------------------------
   Scroll — section reveals, timeline progress, and the header's edge effect
   -------------------------------------------------------------------------- */
const shapesEl = document.getElementById('shapes');
const whyEl = document.getElementById('why');
const emailEl = document.getElementById('email');
const mastheadEl = document.querySelector('.masthead');
let tprog = reduced ? 1 : 0;

function paintTimeline() {
  fillEl.style.height = Math.round(tprog * 100) + '%';
  entryEls.forEach((el, i) => {
    el.classList.toggle('is-on', tprog >= (i + 0.55) / ENTRIES.length);
  });
}

function onScroll() {
  const vh = innerHeight;

  if (!shapesEl.classList.contains('is-in') &&
      shapesEl.getBoundingClientRect().top < vh * 0.82) {
    shapesEl.classList.add('is-in');
  }
  if (!emailEl.classList.contains('is-in') &&
      emailEl.getBoundingClientRect().top < vh * 0.82) {
    emailEl.classList.add('is-in');
  }

  // The header only earns its edge treatment once content is under it.
  mastheadEl.classList.toggle('is-floating', scrollY > 8);

  const r = whyEl.getBoundingClientRect();
  const p = (vh * 0.85 - r.top) / Math.max(1, r.height * 0.78);
  const c = Math.max(0, Math.min(1, p));
  if (Math.abs(c - tprog) > 0.004) {
    tprog = c;
    paintTimeline();
  }
}

if (reduced) {
  shapesEl.classList.add('is-in');
  emailEl.classList.add('is-in');
}
paintTimeline();
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

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
    if (err) {
      showError(err);
      input.focus();
      return;
    }
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
