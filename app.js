/* ==========================================================================
   RASCAL landing page — behaviour

   A direct port of the `Component extends DCLogic` class in
   "RASCAL Landing.dc.html". Same prompt library, same transform maths, same
   easings and thresholds; React state and the x-dc template bindings are
   replaced with keyed DOM updates.
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
const SPRING = 'cubic-bezier(0.34, 1.4, 0.64, 1)';

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

const deck = {
  cursor: 0,
  exiting: null,
  exitDir: 1,
  dragX: 0,
  dragging: false,
  firstDeal: true
};

const slots = new Map(); // key -> { wrap, article, badge, day, text }
let exitTimer = null;
let dragStartX = 0;

function buildCard(key) {
  const wrap = document.createElement('div');
  wrap.className = 'deck__slot';

  const article = document.createElement('article');
  article.className = 'pcard';

  const head = document.createElement('div');
  head.className = 'pcard__head';
  const badge = document.createElement('span');
  badge.className = 'pcard__badge';
  const day = document.createElement('span');
  day.className = 'pcard__day';
  head.append(badge, day);

  const text = document.createElement('p');
  text.className = 'pcard__text';

  article.append(head, text);
  wrap.append(article);

  const rec = { wrap, article, badge, day, text };
  slots.set(key, rec);
  deckEl.append(wrap);
  return rec;
}

function renderDeck() {
  const start = deck.exiting !== null ? deck.cursor - 1 : deck.cursor;
  const live = new Set();

  for (let p = start; p < deck.cursor + depth; p++) {
    const slot = p - deck.cursor;
    const d = LIB[((p % LIB.length) + LIB.length) % LIB.length];
    const k = KIND[d.kind];
    live.add(p);

    let rec = slots.get(p);
    const isNew = !rec;
    if (isNew) {
      rec = buildCard(p);
      rec.badge.textContent = d.kind;
      rec.badge.style.background = k.bg;
      rec.badge.style.color = k.ink;
      const verb = document.createElement('span');
      verb.textContent = d.verb;
      verb.style.color = k.ink;
      rec.text.replaceChildren(
        document.createTextNode(d.pre),
        verb,
        document.createTextNode(d.post)
      );

      const delay = (deck.firstDeal ? Math.max(0, depth - 1 - slot) * 80 : 0) + 'ms';
      rec.wrap.style.animationDelay = delay;
      rec.wrap.classList.add('deck__slot--dealing');
    }

    let tf, op, trans;
    if (slot < 0) {
      tf = `translate(${deck.exitDir * 560}px, 46px) rotate(${deck.exitDir * 14}deg)`;
      op = 0;
      trans = 'transform 440ms cubic-bezier(0.32, 0.72, 0.3, 1), opacity 400ms ease';
    } else if (slot === 0) {
      tf = `translate(${deck.dragX}px, 0) rotate(${(deck.dragX / 30).toFixed(2)}deg)`;
      op = 1;
      trans = deck.dragging ? 'none' : `transform 400ms ${SPRING}`;
    } else {
      tf = `translateY(${slot * 16}px) scale(${(1 - slot * 0.035).toFixed(3)}) rotate(${FAN[slot]}deg)`;
      op = slot >= 3 ? 0.55 : 1;
      trans = `transform 420ms ${SPRING}, opacity 300ms ease`;
    }

    rec.wrap.style.zIndex = String(40 - Math.max(0, slot));
    rec.article.style.transform = tf;
    rec.article.style.opacity = String(op);
    rec.article.style.transition = trans;
    rec.article.style.cursor =
      slot === 0 ? (deck.dragging ? 'grabbing' : 'grab') : 'default';
    rec.article.setAttribute('aria-hidden', slot === 0 ? 'false' : 'true');
    rec.day.textContent = slot === 0 ? 'Today' : '';
  }

  for (const [key, rec] of slots) {
    if (!live.has(key)) {
      rec.wrap.remove();
      slots.delete(key);
    }
  }
}

function advance(dir) {
  if (deck.exiting !== null) return;
  deck.exiting = deck.cursor;
  deck.exitDir = dir;
  deck.cursor += 1;
  deck.dragX = 0;
  deck.dragging = false;
  renderDeck();

  clearTimeout(exitTimer);
  exitTimer = setTimeout(() => {
    deck.exiting = null;
    renderDeck();
  }, 460);
}

function onPointerMove(e) {
  if (!deck.dragging) return;
  deck.dragX = e.clientX - dragStartX;
  renderDeck();
}

function onPointerUp() {
  removeEventListener('pointermove', onPointerMove);
  removeEventListener('pointerup', onPointerUp);
  const dx = deck.dragX;
  if (Math.abs(dx) > 90) {
    advance(dx < 0 ? -1 : 1);
  } else {
    deck.dragging = false;
    deck.dragX = 0;
    renderDeck();
  }
}

deckEl.addEventListener('pointerdown', (e) => {
  if (!PROPS.dragToDeal) return;
  const top = e.target.closest('.pcard');
  if (!top || top.getAttribute('aria-hidden') !== 'false') return;
  dragStartX = e.clientX;
  deck.dragging = true;
  addEventListener('pointermove', onPointerMove);
  addEventListener('pointerup', onPointerUp);
  renderDeck();
});

document.getElementById('dealAnother').addEventListener('click', () => advance(1));

renderDeck();
setTimeout(() => { deck.firstDeal = false; }, 900);

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
   Scroll — section reveals and timeline progress
   -------------------------------------------------------------------------- */
const shapesEl = document.getElementById('shapes');
const whyEl = document.getElementById('why');
const emailEl = document.getElementById('email');
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
