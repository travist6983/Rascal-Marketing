/* ============================================================================
   {{PRODUCT}} — marketing site behaviour
   ----------------------------------------------------------------------------
   One file, no dependencies, no analytics, no third-party requests. Everything
   here is an enhancement over markup that is already complete and already
   readable: turn this file off and every page still says everything it says.

   Two rules it never breaks.

   REDUCED MOTION. `reduced` is read once and every animated path checks it.
   The app's design system requires it and a marketing site that ignores the
   setting while selling a calm product is arguing with itself.

   NO SCROLL HANDLERS DOING LAYOUT. Everything positional is an
   IntersectionObserver. A scroll listener reading geometry every frame is the
   single easiest way to tank INP on a mid-range Android, and this page is for
   parents on phones.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Tell CSS that script is alive, so [data-reveal] can start hidden without
     stranding the content of the page if this file fails to load. */
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------- 1 · reveals */
  (function reveals() {
    /* Collected separately, wired separately: a page with rules but no
       reveals (every blog post, /promise) must still get its rules wired. */
    var els = $$('[data-reveal]');
    var rules = $$('[data-rule-grow]');
    if (!els.length && !rules.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      els.concat(rules).forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (els.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px' });
      els.forEach(function (el) { io.observe(el); });
    }
    if (rules.length) {
      /* threshold must be 0: the rule starts at scaleX(0), so its bounding
         rect has zero area and never reaches a higher intersection ratio. */
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          rio.unobserve(e.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -20px' });
      rules.forEach(function (el) { rio.observe(el); });
    }
  })();

  /* ------------------------------------------------------ 2 · count-up */
  /* The number is already in the HTML. This only animates toward the value it
     already has, so a reader with script off still sees the real count. */
  (function counters() {
    var els = $$('[data-count-to]');
    if (!els.length || reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var target = parseInt(e.target.getAttribute('data-count-to'), 10);
        if (!target) return;
        var t0 = performance.now();
        var step = function (now) {
          var k = Math.min(1, (now - t0) / 900);
          e.target.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* --------------------------------------------------------- 3 · mosaic */
  /* Four thousand photos fill in, then all but one fades. The one that stays is
     the one that kept its question. */
  (function mosaic() {
    var grid = $('#mosaic');
    if (!grid) return;
    var note = $('#mosaic-note');
    var settle = function () {
      grid.classList.add('is-in', 'is-dim');
      if (note) note.classList.add('is-in');
    };
    if (reduced || !('IntersectionObserver' in window)) { settle(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        grid.classList.add('is-in');
        setTimeout(function () {
          grid.classList.add('is-dim');
          if (note) note.classList.add('is-in');
        }, 900);
      });
    }, { threshold: 0.3 });
    io.observe(grid);
  })();

  /* ----------------------------------------------------------- 4 · deck */
  /* The spring, the projection, the fling and commit thresholds and the fan are
     the shipped iOS deck's own values, so a card thrown on the web behaves like
     a card thrown in the app. */
  (function deck() {
    var host = $('#deck');
    if (!host || !window.DECK || !window.DECK.length) return;

    var SPRING = {
      settle:   { damping: 1.0, response: 0.40 },
      momentum: { damping: 0.8, response: 0.35 },
      fade:     { damping: 1.0, response: 0.28 }
    };
    function Spring(value, params) {
      this.value = value || 0; this.target = this.value; this.velocity = 0;
      this.use(params || SPRING.settle);
    }
    Spring.prototype.use = function (p) { this.zeta = p.damping; this.omega = (2 * Math.PI) / p.response; return this; };
    Spring.prototype.to = function (target, opts) {
      opts = opts || {};
      if (opts.params) this.use(opts.params);
      this.target = target;
      if (typeof opts.velocity === 'number') this.velocity = opts.velocity;
      return this;
    };
    Spring.prototype.jump = function (v) { this.value = this.target = v; this.velocity = 0; return this; };
    Spring.prototype.step = function (dt) {
      var remaining = Math.min(dt, 0.064), h = 1 / 240;
      while (remaining > 0) {
        var s = Math.min(h, remaining);
        var accel = -this.omega * this.omega * (this.value - this.target) - 2 * this.zeta * this.omega * this.velocity;
        this.velocity += accel * s; this.value += this.velocity * s; remaining -= s;
      }
    };
    Object.defineProperty(Spring.prototype, 'settled', {
      get: function () { return Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.05; }
    });
    var project = function (v, rate) { rate = rate || 0.998; return ((v / 1000) * rate) / (1 - rate); };

    var DEPTH = 4, FAN = [0, 1.8, -2.2, 2.6], FLING_X = 620, COMMIT_PX = 140, HYSTERESIS = 8;
    var TONE = {
      peri:  { chip: 'chip--peri', ink: 'var(--periwinkle-deep)', glow: 'var(--periwinkle-soft)' },
      terra: { chip: 'chip--terra', ink: 'var(--terracotta-deep)', glow: 'var(--terracotta-soft)' },
      sage:  { chip: 'chip--sage', ink: 'var(--sage-ink)', glow: 'var(--sage)' }
    };

    var filter = '', cursor = 0, flying = null, drag = null, raf = null, lastFrame = 0, paused = false;
    var live = $('#deck-live');
    var glow = $('#engine-glow');
    var springs = [];
    var els = [];

    var lib = function () {
      return filter ? window.DECK.filter(function (r) { return r[0] === filter; }) : window.DECK;
    };
    var slotOf = function (i) { return (i - (cursor % DEPTH) + DEPTH) % DEPTH; };

    /* Build the four physical cards once. Their contents are rewritten as the
       cursor moves; the elements themselves never churn. */
    for (var i = 0; i < DEPTH; i++) {
      var el = document.createElement('div');
      el.className = 'deck__card';
      el.innerHTML =
        '<article>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">' +
            '<span class="chip" data-chip></span>' +
            '<span class="t-label" data-day></span>' +
          '</div>' +
          '<p class="deck__body"><span data-verb></span><span data-rest></span></p>' +
        '</article>';
      host.appendChild(el);
      els.push(el);
      springs.push({
        x: new Spring(0), y: new Spring(i * 16), scale: new Spring(1 - i * 0.035),
        rot: new Spring(FAN[i]), op: new Spring(0),
        delay: reduced ? 0 : (DEPTH - 1 - i) * 0.08
      });
    }
    if (!reduced) {
      springs.forEach(function (r, e) { r.y.jump(e * 16 + 96); r.scale.jump((1 - e * 0.035) * 0.945); });
    }

    function retarget(e, slot) {
      var r = springs[e];
      r.y.to(slot * 16); r.scale.to(1 - slot * 0.035);
      r.rot.to(FAN[slot] || 0); r.op.to(slot >= 3 ? 0.55 : 1);
    }
    springs.forEach(function (_, e) { retarget(e, e); });

    function content() {
      var rows = lib(), len = rows.length;
      if (!len) return;
      for (var e = 0; e < DEPTH; e++) {
        var slot = slotOf(e);
        var row = rows[(cursor + slot) % len];
        var tone = TONE[row[1]] || TONE.terra;
        var art = els[e].firstElementChild;
        var chip = $('[data-chip]', art);
        chip.className = 'chip ' + tone.chip;
        chip.textContent = row[0].charAt(0) + row[0].slice(1).toLowerCase();
        $('[data-day]', art).textContent = slot === 0 ? 'Today' : '';
        var verb = $('[data-verb]', art);
        verb.textContent = row[2];
        verb.style.color = tone.ink;
        $('[data-rest]', art).textContent = row[3];
        art.style.borderColor = row[1] === 'peri' ? 'var(--periwinkle-border)' : 'var(--border)';
      }
      if (glow) glow.style.background = (TONE[rows[cursor % len][1]] || TONE.terra).glow;
    }

    function paint() {
      els.forEach(function (el, e) {
        var r = springs[e];
        var slot = slotOf(e);
        var isTop = flying !== e && slot === 0;
        el.style.zIndex = String(flying === e ? 50 : 40 - slot);
        el.style.transform =
          'translate3d(' + r.x.value.toFixed(2) + 'px,' + r.y.value.toFixed(2) + 'px,0) ' +
          'scale(' + r.scale.value.toFixed(4) + ') rotate(' + r.rot.value.toFixed(2) + 'deg)';
        el.style.opacity = r.op.value.toFixed(3);
        el.style.pointerEvents = isTop ? 'auto' : 'none';
        el.setAttribute('aria-hidden', isTop ? 'false' : 'true');
        el.firstElementChild.style.cursor = isTop ? (drag ? 'grabbing' : 'grab') : 'default';
      });
    }

    function frame(now) {
      var dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.064) : 1 / 60;
      lastFrame = now;
      var busy = false;
      springs.forEach(function (r, e) {
        var slot = slotOf(e);
        var held = drag && drag.e === e;
        if (r.delay > 0) { r.delay -= dt; busy = true; return; }
        if (!held) r.x.step(dt);
        r.y.step(dt); r.scale.step(dt); r.op.step(dt);
        if (flying !== e && slot === 0) r.rot.jump(r.x.value / 30); else r.rot.step(dt);
        if (held) busy = true;
        else if (!(r.x.settled && r.y.settled && r.scale.settled && r.op.settled)) busy = true;
      });
      paint();
      if (busy || drag) raf = requestAnimationFrame(frame);
      else { raf = null; lastFrame = 0; }
    }
    function kick() { if (raf === null) { lastFrame = 0; raf = requestAnimationFrame(frame); } }

    function announce() {
      if (!live) return;
      var rows = lib();
      if (!rows.length) return;
      var row = rows[cursor % rows.length];
      live.textContent = (row[2] + row[3]).trim();
    }

    function commit(flown) {
      flying = null;
      cursor += 1;
      content();
      for (var e = 0; e < DEPTH; e++) {
        var slot = slotOf(e), r = springs[e];
        r.x.jump(0);
        if (e === flown) {
          r.rot.jump(FAN[slot] || 0); r.op.jump(0);
          if (!reduced) { r.y.jump(slot * 16 + 96); r.scale.jump((1 - slot * 0.035) * 0.945); }
        }
        retarget(e, slot);
      }
      announce(); kick();
    }

    function deal(dir, velocity) {
      if (flying !== null) return;
      var e = cursor % DEPTH, r = springs[e];
      flying = e;
      if (reduced) {
        r.op.to(0, { params: { damping: 1, response: 0.18 } });
      } else {
        r.x.to((dir || 1) * FLING_X, { velocity: velocity || 0, params: SPRING.momentum });
        r.y.to(60, { params: SPRING.momentum });
        r.rot.to((dir || 1) * 16, { params: SPRING.momentum });
        r.scale.to(0.98, { params: SPRING.momentum });
        r.op.to(0, { params: SPRING.fade });
      }
      for (var i = 0; i < DEPTH; i++) if (i !== e) retarget(i, Math.max(0, slotOf(i) - 1));
      kick();
      setTimeout(function () { commit(e); }, reduced ? 160 : 380);
    }

    function reset(next) {
      filter = next; cursor = 0;
      content();
      for (var e = 0; e < DEPTH; e++) {
        var r = springs[e];
        r.x.jump(0); r.rot.jump(FAN[e]); r.op.jump(0);
        if (!reduced) { r.y.jump(e * 16 + 96); r.scale.jump((1 - e * 0.035) * 0.945); }
        r.delay = reduced ? 0 : (DEPTH - 1 - e) * 0.06;
        retarget(e, e);
      }
      announce(); kick();
    }

    /* Drag. Pointer events only — one code path for mouse, touch and pen. */
    var sample = function (d, x) {
      d.history.push({ x: x, t: performance.now() });
      if (d.history.length > 8) d.history.shift();
    };
    var releaseVelocity = function (d) {
      var h = d.history;
      if (h.length < 2) return 0;
      var last = h[h.length - 1], ref = h[0];
      for (var i = h.length - 1; i >= 0; i--) { if (last.t - h[i].t > 80) break; ref = h[i]; }
      var dt = (last.t - ref.t) / 1000;
      return dt > 0 ? (last.x - ref.x) / dt : 0;
    };
    host.addEventListener('pointerdown', function (ev) {
      if (drag || flying !== null) return;
      var el = ev.target.closest('.deck__card');
      if (!el) return;
      var e = els.indexOf(el);
      if (e < 0 || slotOf(e) !== 0) return;
      paused = true;
      el.setPointerCapture(ev.pointerId);
      drag = { e: e, pointerId: ev.pointerId, startX: ev.clientX, baseX: springs[e].x.value, moved: false, history: [] };
      sample(drag, ev.clientX);
      springs[e].x.velocity = 0;
      springs[e].scale.to(1.02);
      kick();
    });
    host.addEventListener('pointermove', function (ev) {
      if (!drag || ev.pointerId !== drag.pointerId) return;
      var dx = ev.clientX - drag.startX;
      sample(drag, ev.clientX);
      if (!drag.moved && Math.abs(dx) < HYSTERESIS) return;
      drag.moved = true;
      var r = springs[drag.e];
      r.x.value = drag.baseX + dx; r.x.velocity = 0;
    });
    var end = function (ev) {
      if (!drag || ev.pointerId !== drag.pointerId) return;
      var r = springs[drag.e], velocity = releaseVelocity(drag), moved = drag.moved;
      drag = null;
      r.scale.to(1);
      if (!moved) { kick(); return; }
      var projected = r.x.value + project(velocity);
      if (Math.abs(projected) > COMMIT_PX) deal(Math.sign(projected) || 1, velocity);
      else r.x.to(0, { velocity: velocity, params: SPRING.settle });
      kick();
    };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);

    var dealBtn = $('#deal');
    if (dealBtn) dealBtn.addEventListener('click', function () { paused = true; deal(1, reduced ? 0 : 900); });

    $$('[data-deck]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-deck]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        reset(btn.getAttribute('data-deck'));
      });
    });

    /* Auto-deal, paused while the reader is touching or reading it, and off
       entirely under reduced motion — an unbidden loop is exactly the thing
       that setting is asking us not to do. */
    var wrap = $('#deckwrap');
    if (wrap) {
      ['pointerenter', 'focusin'].forEach(function (t) { wrap.addEventListener(t, function () { paused = true; }); });
      ['pointerleave', 'focusout'].forEach(function (t) { wrap.addEventListener(t, function () { paused = false; }); });
    }
    if (!reduced) {
      setInterval(function () {
        if (!paused && !drag && !document.hidden) deal(1, 0);
      }, 9000);
    }

    content(); announce(); kick();
  })();

  /* --------------------------------------------------------- 5 · shapes */
  (function shapes() {
    var btns = $$('[data-shape]');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-shape');
        btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        $$('[data-shape-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-shape-panel') !== want;
        });
      });
    });
  })();

  /* -------------------------------------------------------- 6 · archive */
  /* The phone cross-fades as the copy beside it scrolls. Below 900px the copy
     is stacked and the pairing has no meaning, so the observer does not run.

     The root is squeezed to a band across the middle of the viewport and a step
     owns the phone while that band is inside it. A visible-ratio threshold does
     not survive real viewports: a step taller than the window never reaches
     0.5, two 58vh steps can both clear it at once, and landing mid-archive on a
     reload crosses nothing at all — each of which leaves the wrong screen up.
     Exactly one screen is at opacity 1 at every scroll position. */
  (function archive() {
    var steps = $$('[data-arch]');
    var imgs = $$('[data-arch-img]');
    if (!steps.length || !imgs.length || !('IntersectionObserver' in window)) return;

    var live = [];   /* live[i] — is step i crossing the band right now */
    var shown = null;
    var show = function (want) {
      if (want === null || want === shown) return;
      shown = want;
      imgs.forEach(function (img) {
        img.style.opacity = img.getAttribute('data-arch-img') === want ? '1' : '0';
      });
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { live[steps.indexOf(e.target)] = e.isIntersecting; });
      /* Lowest index wins while two steps overlap the band, so the handover
         happens once instead of flickering back and forth across the seam. */
      for (var i = 0; i < steps.length; i++) {
        if (live[i]) return show(steps[i].getAttribute('data-arch'));
      }
      /* Band is past either end of the copy: hold the last screen. Blanking the
         phone is the one thing this section must never do. */
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    /* Wired to the query, not read once: resizing up out of the stacked layout
       has to start the pairing, and resizing down has to hand the phone back to
       the first screen, which is the only one that layout shows. */
    var mq = window.matchMedia('(min-width: 900px)');
    var watching = false;
    var sync = function () {
      if (mq.matches === watching) return;
      watching = mq.matches;
      if (watching) { steps.forEach(function (s) { io.observe(s); }); return; }
      io.disconnect();
      live = [];
      show('0');
    };
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
  })();

  /* ----------------------------------------------------------- 7 · seal */
  (function seal() {
    var btn = $('#seal');
    if (!btn) return;
    var locked = $('[data-seal="locked"]'), open = $('[data-seal="open"]');
    var isOpen = false;
    btn.addEventListener('click', function () {
      isOpen = !isOpen;
      if (locked) locked.style.opacity = isOpen ? '0' : '1';
      if (open) open.style.opacity = isOpen ? '1' : '0';
      btn.textContent = isOpen ? 'Seal it again' : 'Open it';
      btn.setAttribute('aria-pressed', String(isOpen));
    });
  })();

  /* -------------------------------------------------- 8 · prompt filters */
  /* Every prompt is already in the HTML. This hides and shows what is there —
     it never fetches, and the page ranks with the full library present.

     Three filters, ANDed: kind, age band, and the search field. The field is
     the one control that is not honest without this file — a box that swallows
     what you type would be worse than no box — so CSS keeps it hidden until
     the `js` class is on the document, and only this makes it work. */
  (function promptFilters() {
    var list = $('#prompt-list');
    if (!list) return;
    var cards = $$('.prompt', list);
    var count = $('[data-prompt-count]');
    var empty = $('[data-prompt-empty]');
    var query = $('[data-prompt-query]');
    var state = { kind: '', band: '', q: '' };

    /* Fold once, match many. Apostrophes are dropped on both sides so "whats"
       finds "What's", and the whole card is the haystack — the body, the kind
       and "Opens at 18" — because someone hunting for the letter prompts will
       type "letter" as readily as they will click the pill. */
    var fold = function (s) {
      return s.toLowerCase().replace(/[‘’']/g, '').replace(/\s+/g, ' ').trim();
    };
    var haystack = cards.map(function (card) { return fold(card.textContent); });

    /* role="status" speaks every change it sees, so a count written on each
       keystroke narrates the whole word being typed. Write it once, after. */
    var pending = null;
    function say(shown) {
      if (!count) return;
      var text = (state.kind || state.band || state.q)
        ? shown + (shown === 1 ? ' prompt' : ' prompts')
        : '';
      clearTimeout(pending);
      pending = setTimeout(function () { count.textContent = text; }, 250);
    }

    function apply() {
      var terms = state.q ? fold(state.q).split(' ') : [];
      var shown = 0;
      cards.forEach(function (card, i) {
        var ok =
          (!state.kind || card.getAttribute('data-kind') === state.kind) &&
          (!state.band || card.getAttribute('data-bands').split(' ').indexOf(state.band) !== -1) &&
          terms.every(function (t) { return haystack[i].indexOf(t) !== -1; });
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      say(shown);
    }

    $$('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-filter');
        state[group] = btn.getAttribute('data-value');
        $$('[data-filter="' + group + '"]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply();
      });
    });

    if (query) query.addEventListener('input', function () {
      state.q = query.value;
      apply();
    });

    var reset = $('[data-prompt-reset]');
    if (reset) reset.addEventListener('click', function () {
      state = { kind: '', band: '', q: '' };
      if (query) query.value = '';
      $$('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === ''));
      });
      apply();
      if (query) query.focus();
    });

    /* A deep link into a filtered library must still land on its prompt. */
    if (location.hash && $(location.hash, list)) {
      var target = $(location.hash, list);
      requestAnimationFrame(function () { target.scrollIntoView({ block: 'center' }); });
    }
  })();

  /* --------------------------------------------------------- 9 · signup */
  /* No endpoint is wired. The design prototype waited 800ms and declared
     success without sending anything; this refuses to do that. Every visible
     state below is real, and until ENDPOINT is set the form says plainly that
     nothing was stored — which is the only honest thing a waitlist form with
     nowhere to post can say. */
  var SIGNUP = {
    ENDPOINT: null,      // e.g. 'https://formspree.io/f/xxxxxxxx' or your own /api/subscribe
    SOURCE: 'marketing-site'
  };

  (function signup() {
    var forms = $$('[data-signup]');
    if (!forms.length) return;
    var seen = Object.create(null);

    forms.forEach(function (form) {
      var input = $('input[type=email]', form);
      var btn = $('[data-signup-btn]', form);
      var msg = $('[data-signup-msg]', form);
      var idle = btn ? btn.textContent : '';

      function say(text) {
        if (!msg) return;
        msg.textContent = text;
        msg.hidden = !text;
      }
      function invalid(is) {
        input.setAttribute('aria-invalid', String(is));
      }

      input.addEventListener('input', function () { invalid(false); say(''); });

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var email = input.value.trim();

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          invalid(true);
          say("That doesn't look like an email address.");
          input.focus();
          return;
        }
        if (seen[email]) {
          /* Not an error. Not red. Not an alert. */
          say("You're already on the list — nothing to do.");
          return;
        }

        invalid(false);
        btn.disabled = true;
        btn.textContent = 'Adding you…';
        say('');

        if (!SIGNUP.ENDPOINT) {
          btn.disabled = false;
          btn.textContent = idle;
          say('This form has nowhere to post yet, so nothing was stored — ' +
              'we are not going to pretend otherwise. Set SIGNUP.ENDPOINT in /assets/site.js.');
          return;
        }

        fetch(SIGNUP.ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: email,
            source: SIGNUP.SOURCE,
            /* Two fields, never one flag — decisions.md D3a. */
            marketing_consent: true,
            transactional_consent: true
          })
        }).then(function (res) {
          /* A real endpoint's duplicate signal — HTTP 409, or a JSON body with
             duplicate: true — gets the specified line, not a fake success and
             not the failure string. Still not an error, still not red. */
          if (res.status === 409) {
            seen[email] = true;
            btn.disabled = false;
            btn.textContent = idle;
            say("You're already on the list — nothing to do.");
            return;
          }
          if (!res.ok) throw new Error('HTTP ' + res.status);
          seen[email] = true;
          form.innerHTML =
            '<div class="card card--sage" style="display:flex;gap:12px;align-items:center">' +
              '<span class="tick" aria-hidden="true">✓</span>' +
              '<span class="t-body">You\'re in. First prompt lands tomorrow morning.</span>' +
            '</div>';
        }).catch(function () {
          btn.disabled = false;
          btn.textContent = idle;
          say('That didn’t go through. Try again, or email {{SUPPORT_EMAIL}}.');
        });
      });
    });
  })();

  /* ------------------------------------------------------------ 10 · nav */
  /* The <details> menu closes on outside click and on Escape, which native
     <details> does not do for you. */
  (function nav() {
    var wrap = $('.navwrap');
    if (!wrap) return;
    var wide = window.matchMedia('(min-width: 900px)');
    document.addEventListener('click', function (ev) {
      if (!wide.matches && wrap.open && !wrap.contains(ev.target)) wrap.open = false;
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && wrap.open && !wide.matches) {
        wrap.open = false;
        $('summary', wrap).focus();
      }
    });
    /* A closed <details> hides its content at the UA level — CSS display on
       the inner nav cannot override that in modern Chromium. So above the
       breakpoint the details is held open (the toggle is display:none and the
       drawer styling is scoped to <900px); below it, closed until tapped. */
    var sync = function () { wrap.open = wide.matches; };
    sync();
    wide.addEventListener ? wide.addEventListener('change', sync) : wide.addListener(sync);
  })();
})();
