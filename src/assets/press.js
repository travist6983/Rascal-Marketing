/* ============================================================================
   {{PRODUCT}} — the press kit's own behaviour (/press only)
   ----------------------------------------------------------------------------
   Three things, each an enhancement over markup that is already complete:

     1. The hero's arc of phones leans toward the pointer and trades places on
        a slow cycle. Without this file it is a still arc.
     2. The demo stage: the recording plays itself once it is on screen, the
        chapter list beside it becomes six buttons that seek, a hairline under
        the current chapter fills as it plays, and the two stills behind the
        recording follow along. Without this file it is a native <video> with
        its own controls and a plain list of timestamps.
     3. A Copy button beside every quote and every description. Made here
        rather than in markup so it only exists where the clipboard does.

   The same two rules as site.js: reduced motion is read once and gates every
   animated path, and nothing reads layout on scroll — visibility is an
   IntersectionObserver, and the pointer lean measures the box once on enter.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ----------------------------------------------------------- the lean */
  /* Shared by the arc and the stage. The box is measured on pointerenter, not
     per move, and the write is coalesced to one per frame. */
  function lean(el, maxX, maxY) {
    if (reduced || !pointerFine) return;
    var rect = null, raf = null, nx = 0, ny = 0;
    var write = function () {
      raf = null;
      el.style.setProperty('--tx', (nx * maxX).toFixed(2) + 'deg');
      el.style.setProperty('--ty', (-ny * maxY).toFixed(2) + 'deg');
    };
    el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', function (ev) {
      if (!rect) rect = el.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, ((ev.clientX - rect.left) / rect.width) * 2 - 1));
      ny = Math.max(-1, Math.min(1, ((ev.clientY - rect.top) / rect.height) * 2 - 1));
      if (raf === null) raf = requestAnimationFrame(write);
    }, { passive: true });
    el.addEventListener('pointerleave', function () {
      rect = null; nx = 0; ny = 0;
      if (raf === null) raf = requestAnimationFrame(write);
    });
  }

  /* ------------------------------------------------------------ the arc */
  (function fan() {
    var el = $('[data-fan]');
    if (!el) return;
    lean(el, 8, 5);
    if (reduced || !('IntersectionObserver' in window)) return;

    var pos = 0, visible = false, held = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0.3 });
    io.observe(el);
    el.addEventListener('pointerenter', function () { held = true; });
    el.addEventListener('pointerleave', function () { held = false; });

    /* Paused while the reader is over it — a phone that slides away from under
       the pointer is the deck's rule too — and off entirely when the tab is. */
    setInterval(function () {
      if (!visible || held || document.hidden) return;
      pos = (pos + 1) % 3;
      el.setAttribute('data-pos', String(pos));
    }, 6500);
  })();

  /* ---------------------------------------------------------- the stage */
  (function stage() {
    var host = $('[data-stage]');
    var video = host && $('video', host);
    var player = host && $('[data-player]', host);
    var big = host && $('[data-big]', host);
    var list = $('[data-beats]');
    if (!host || !video || !player || !list) return;

    var playBtn = $('[data-play]', player);
    var scrub = $('[data-scrub]', player);
    var clock = $('[data-time]', player);
    var stills = {
      l: $$('[data-still="l"]', host),
      r: $$('[data-still="r"]', host)
    };
    var THUMBS = '/assets/press/thumbs/';

    /* Take the controls over. Native controls stay in the markup for the
       no-script page; here the bar below the recording is the player. */
    video.removeAttribute('controls');
    video.muted = true;
    player.hidden = false;
    big.hidden = false;
    host.classList.add('is-wired');

    var dur = parseFloat(scrub.max) || 29.8;
    video.addEventListener('loadedmetadata', function () {
      if (video.duration && isFinite(video.duration)) { dur = video.duration; scrub.max = dur; }
      paint(video.currentTime);
    });

    /* ---- chapters ---- */
    var beats = $$('li', list).map(function (li) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'press-beat__btn';
      while (li.firstChild) btn.appendChild(li.firstChild);
      var bar = document.createElement('i');
      bar.className = 'press-beat__bar';
      bar.setAttribute('aria-hidden', 'true');
      btn.appendChild(bar);
      li.appendChild(btn);
      return {
        li: li, btn: btn, bar: bar,
        at: parseFloat(li.getAttribute('data-seek')) || 0,
        still: li.getAttribute('data-still')
      };
    });
    var n = beats.length;
    var cur = -1;

    /* Each still is two stacked images: the hidden one takes the next file
       and fades up over the one showing, so a chapter change never shows the
       screen behind it while the file arrives. */
    function swap(side, name) {
      var pair = stills[side];
      if (pair.length < 2) return;
      var on = pair[0].classList.contains('is-on') ? pair[0] : pair[1];
      var off = on === pair[0] ? pair[1] : pair[0];
      var src = THUMBS + name + '.jpg';
      if (on.getAttribute('src') === src) return;
      var show = function () { on.classList.remove('is-on'); off.classList.add('is-on'); };
      if (off.getAttribute('src') === src && off.complete) { show(); return; }
      off.addEventListener('load', show, { once: true });
      off.setAttribute('src', src);
    }

    function setChapter(i) {
      if (i === cur) return;
      cur = i;
      beats.forEach(function (b, k) {
        b.li.classList.toggle('is-on', k === i);
        if (k === i) b.btn.setAttribute('aria-current', 'true');
        else b.btn.removeAttribute('aria-current');
        if (k !== i) b.bar.style.setProperty('--p', k < i ? '1' : '0');
      });
      swap('l', beats[(i - 1 + n) % n].still);
      swap('r', beats[(i + 1) % n].still);
    }

    function chapterAt(t) {
      var i = n - 1;
      while (i > 0 && t < beats[i].at) i--;
      var end = i + 1 < n ? beats[i + 1].at : dur;
      var p = (t - beats[i].at) / Math.max(0.1, end - beats[i].at);
      beats[i].bar.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
      setChapter(i);
    }

    /* ---- the bar ---- */
    /* The clock floors the position and rounds the length: 29.8 seconds
       reads 0:30, which is what the copy beside it says. */
    var fmt = function (s, round) {
      s = Math.max(0, round ? Math.round(s) : Math.floor(s));
      return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    };
    var scrubbing = false;
    function paint(t) {
      if (!scrubbing) scrub.value = t;
      scrub.style.setProperty('--fill', ((t / dur) * 100).toFixed(2) + '%');
      clock.textContent = fmt(t) + ' / ' + fmt(dur, true);
      chapterAt(t);
    }

    var raf = null;
    function tick() {
      if (video.paused || video.ended) { raf = null; return; }
      paint(video.currentTime);
      raf = requestAnimationFrame(tick);
    }
    function setPlaying(on) {
      host.classList.toggle('is-playing', on);
      playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
      big.setAttribute('aria-label', on ? 'Pause the demo' : 'Play the demo');
    }
    video.addEventListener('play', function () { setPlaying(true); if (raf === null) raf = requestAnimationFrame(tick); });
    video.addEventListener('pause', function () { setPlaying(false); paint(video.currentTime); });
    video.addEventListener('seeked', function () { paint(video.currentTime); });

    /* play() may be refused — a browser that will not autoplay even muted
       video leaves the big play button showing, which is the right outcome. */
    var attempt = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };

    /* Whether the reader has pressed pause. Scrolling away pauses too, but a
       recording the reader paused must stay paused when they scroll back. */
    var userPaused = false;
    function toggle() {
      if (video.paused) { userPaused = false; attempt(); }
      else { userPaused = true; video.pause(); }
    }
    playBtn.addEventListener('click', toggle);
    big.addEventListener('click', toggle);
    video.addEventListener('click', toggle);

    scrub.addEventListener('input', function () {
      scrubbing = true;
      var t = parseFloat(scrub.value);
      if (video.readyState >= 1) video.currentTime = t;
      scrub.style.setProperty('--fill', ((t / dur) * 100).toFixed(2) + '%');
      clock.textContent = fmt(t) + ' / ' + fmt(dur, true);
      chapterAt(t);
    });
    scrub.addEventListener('change', function () {
      scrubbing = false;
      if (video.readyState < 1) {
        var t = parseFloat(scrub.value);
        video.addEventListener('loadedmetadata', function () { video.currentTime = t; }, { once: true });
        video.load();
      }
    });

    beats.forEach(function (b, i) {
      b.btn.addEventListener('click', function () {
        userPaused = false;
        var go = function () { video.currentTime = b.at; attempt(); };
        if (video.readyState < 1) {
          video.addEventListener('loadedmetadata', go, { once: true });
          video.load();
        } else go();
        setChapter(i);
      });
    });

    /* Plays itself while on screen, and not otherwise. Reduced motion never
       autoplays: the poster, the big play button and the chapters stay, and
       the recording waits to be asked. */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (video.preload === 'none') video.preload = reduced ? 'metadata' : 'auto';
            if (!reduced && !userPaused && video.paused) attempt();
          } else if (!video.paused) {
            video.pause();
          }
        });
      }, { threshold: 0.35 });
      io.observe(host);
    } else if (!reduced) {
      attempt();
    }

    /* Warm the six stills so the first chapter change is a fade, not a fetch. */
    beats.forEach(function (b) { var im = new Image(); im.src = THUMBS + b.still + '.jpg'; });

    paint(0);
  })();

  /* ----------------------------------------------------------- the copy */
  (function copy() {
    var blocks = $$('[data-copy]');
    if (!blocks.length || !navigator.clipboard || !navigator.clipboard.writeText) return;

    blocks.forEach(function (block) {
      var source = $('[data-copy-text]', block) || block;
      var slot = $('[data-copy-slot]', block) || $('.press-quote__foot', block) || block;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'press-copy';
      btn.textContent = 'Copy';
      var timer = null;
      btn.addEventListener('click', function () {
        /* The words, without the quotation marks around a quote — the writer
           is going to put their own on. */
        var text = source.textContent.replace(/\s+/g, ' ').trim().replace(/^[“"]|[”"]$/g, '');
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-done');
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('is-done');
          }, 1800);
        }, function () {
          btn.textContent = 'Select it and copy';
        });
      });
      slot.appendChild(btn);
    });
  })();
})();
