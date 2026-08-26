/**
 * Ad rendering — the layout engine.
 *
 * `social/card.mjs` draws one prompt on paper for the organic feed. This draws
 * the other thing: a bought placement, which has a headline, a phone with the
 * product actually on it, and a button. Different job, different file, same
 * palette, same lockup and the same type as the landing page — an ad that does
 * not look like the page it lands on wastes the click.
 *
 * What is reused from card.mjs rather than rewritten: the Chrome lookup, the
 * headless shot, the bounded fan-out, the inlined variable fonts and the HTML
 * escape. Those are render plumbing and there should be exactly one of each.
 *
 * Four templates, named after what they do rather than after the competitor
 * creative each was drawn from:
 *
 *   feature   two columns, three feature rows, a band with the CTA
 *   notify    ink ground, a phone with a notification escaping its bounds
 *   compare   two labelled phones, one of them a drawn camera roll
 *   quiet     one centred statement, ticked promises, a phone rising
 *   ledger    no phone at all — one question and four years of its answers
 *   card      the ad as a prompt card, the organic post's own vocabulary
 *   capture   one capture verb, deep: a headline, one piece of evidence, ticks
 *   pricing   the offer stated — the free column first, em dashes for absent
 *   library   a wall of real prompts dissolving behind one pulled forward
 *
 * Copy lives in social/ads.js. Design lives in social/ad.css. This file only
 * decides which element goes where, the same split the prompt cards use.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { escapeHtml, fontFaces, root } from './card.mjs';

export { SIZES, escapeHtml, findChrome, pool, root, shoot, slugify } from './card.mjs';

/** Every name on an ad comes from the same file the site's tokens come from. */
const CONFIG = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
export const PRODUCT = CONFIG.PRODUCT;

/**
 * Token resolution, to a fixed point, exactly as the site build does it.
 *
 * CLAUDE.md forbids typing the product name, the domain, a price or the prompt
 * count into markup, and an ad is markup. Until there was a pricing creative
 * this file only had to resolve {{PRODUCT}} inside icon.svg and could do it
 * with one replace; a table with {{PRICE_YEAR}} in it cannot, because
 * PRICE_YEAR's own value is "${{PRICE_YEAR_NUM}}" — a token whose value holds
 * another token. So substitute until nothing changes.
 *
 * A token with no value in the config is left standing rather than blanked, and
 * adHtml() below refuses to hand back a document with one still in it. A blank
 * where a price should be is the failure this is here to prevent.
 */
export function fill(text) {
  let out = text;
  for (let pass = 0; pass < 12; pass++) {
    const next = out.replace(/\{\{([A-Z0-9_]+)\}\}/g, (whole, name) =>
      name in CONFIG ? String(CONFIG[name]) : whole);
    if (next === out) return out;
    out = next;
  }
  throw new Error(`tokens in "${text.slice(0, 60)}" never settled — a value cites itself`);
}

/* --------------------------------------------------------------------------
   Palette
   -------------------------------------------------------------------------- */

/**
 * A tint is three values, not one: the ink, the soft ground a chip sits on, and
 * the band under the CTA. `lift` is the fourth, and only the ink-ground
 * template uses it — terracotta at 4.0:1 on #23253C is legible but tiring at
 * headline size, so the dark ad lifts the accent to the tint's own light end.
 */
export const TINTS = {
  terracotta: { ink: '#C05A2B', soft: '#FBEDE2', band: '#F5E9DC', lift: '#F0A878' },
  peri: { ink: '#5566D6', soft: '#E9EBFB', band: '#E4E7FA', lift: '#A9B4F2' }
};

/* --------------------------------------------------------------------------
   Drawn parts
   -------------------------------------------------------------------------- */

/**
 * Line icons in the app's own idiom: 24px box, rounded caps, no fills. Drawn
 * here rather than imported because the site ships no icon set — the only SVG
 * in src/ is the brand mark — and an ad is not the place to introduce a
 * dependency the site does not have.
 */
const ICON = {
  question: '<path d="M7 4h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/><path d="M9 16v3.2a.4.4 0 0 0 .68.29L13 16"/>',
  camera: '<path d="M6.5 6h1.2l1-1.7a1 1 0 0 1 .86-.5h4.88a1 1 0 0 1 .86.5l1 1.7h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8A2.5 2.5 0 0 1 6.5 6z"/><circle cx="12" cy="12" r="3.4"/>',
  voice: '<path d="M12 3.2a3 3 0 0 1 3 3v5.4a3 3 0 0 1-6 0V6.2a3 3 0 0 1 3-3z"/><path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0"/><path d="M12 17.8V21"/><path d="M8.6 21h6.8"/>',
  video: '<path d="M7 5h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"/><path d="M16 10.6l3.4-2.3a.6.6 0 0 1 .94.5v6.4a.6.6 0 0 1-.94.5L16 13.4z"/>',
  seal: '<path d="M7 10.5V8a5 5 0 0 1 10 0v2.5"/><path d="M6.2 10.5h11.6a1.8 1.8 0 0 1 1.8 1.8v6.4a1.8 1.8 0 0 1-1.8 1.8H6.2a1.8 1.8 0 0 1-1.8-1.8v-6.4a1.8 1.8 0 0 1 1.8-1.8z"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.2V12l3.3 2"/>',
  search: '<circle cx="10.6" cy="10.6" r="6.4"/><path d="M15.3 15.3L20 20"/>',
  calendar: '<path d="M5.5 6h13A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6z"/><path d="M8 3.6V7.4"/><path d="M16 3.6V7.4"/><path d="M4 10.6h16"/>',
  heart: '<path d="M12 20.3l-7.1-6.9a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6a4.6 4.6 0 0 1 6.5 6.5z"/>',
  page: '<path d="M13.4 3.6H7.4A2.4 2.4 0 0 0 5 6v12a2.4 2.4 0 0 0 2.4 2.4h9.2A2.4 2.4 0 0 0 19 18V9.2z"/><path d="M13.4 3.6V9.2H19"/>',
  tick: '<path d="M5 12.6l4.6 4.6L19 7.4"/>',
  arrow: '<path d="M4 12h14"/><path d="M12.6 6.2L18.4 12l-5.8 5.8"/>'
};

export function icon(name) {
  const drawn = ICON[name];
  if (!drawn) throw new Error(`no icon "${name}" — the set is ${Object.keys(ICON).join(', ')}`);
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawn}</svg>`
  );
}

/**
 * The app icon, read from src/assets/icon.svg rather than copied, so the ad
 * cannot end up carrying an older drawing than the site does. The file's
 * aria-label is a {{PRODUCT}} token — this is the one place outside the build
 * that has to resolve it, and it resolves it from the same config.
 *
 * This is the *icon*, not the lockup — the notify template's notification is
 * the one place an ad shows what iOS shows, and iOS shows the home-screen icon
 * next to a notification, never a wordmark. Everywhere else, lockup() below.
 */
function brandMark() {
  const path = join(root, 'src', 'assets', 'icon.svg');
  if (!existsSync(path)) throw new Error(`missing ${path} — the lockup needs the brand mark`);
  return readFileSync(path, 'utf8').replace(/\{\{PRODUCT\}\}/g, PRODUCT).trim();
}

/**
 * The site's own lockup — the fan of cards and the drawn wordmark — lifted out
 * of src/partials/header.html rather than redrawn here, for the same reason
 * brandMark() reads icon.svg instead of copying it: an ad carrying an older
 * drawing than the site is a defect nobody catches until it is bought.
 *
 * Two things change on the way through.
 *
 * The mask ids are namespaced `vlh-` → `vla-`. Nothing collides today, because
 * an ad has exactly one lockup on it; it would the moment one had two, and a
 * duplicate id in SVG fails by rendering the wrong mask rather than by
 * complaining.
 *
 * And the svg's `aria-hidden` becomes a name. On the site the mark sits inside
 * an <a aria-label="{{PRODUCT}}"> that carries the name for it. The ad drops
 * the anchor — there is nothing to click in a PNG — and this is the only thing
 * on the canvas that says what the product is called, so the name moves onto
 * the element that survived rather than being lost with the one that did not.
 */
function siteLockup() {
  const path = join(root, 'src', 'partials', 'header.html');
  if (!existsSync(path)) throw new Error(`missing ${path} — the lockup lives in the site's header`);

  const anchor = readFileSync(path, 'utf8').match(/<a class="wordmark brand"[\s\S]*?<\/a>/);
  if (!anchor) {
    throw new Error(`no .wordmark.brand anchor in ${path} — the site's lockup moved or was renamed`);
  }
  const svg = anchor[0].match(/<svg[\s\S]*<\/svg>/);
  if (!svg) throw new Error(`the .wordmark.brand anchor in ${path} has no drawing in it`);

  return svg[0]
    .replace(/vlh-/g, 'vla-')
    .replace(/aria-hidden="true"/, `role="img" aria-label="${escapeHtml(PRODUCT)}"`);
}

export function lockup() {
  return `<div class="lockup">${siteLockup()}</div>`;
}

/**
 * The hand mark under the accent phrase.
 *
 * Stretched to the phrase's own width so a two-word accent and a six-word one
 * both get an underline that stops where the words stop. `non-scaling-stroke`
 * is what keeps that stretch from also stretching the ink — without it a wide
 * accent gets a hairline and a narrow one gets a slab.
 */
const SWASH =
  '<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">' +
  '<path vector-effect="non-scaling-stroke" d="M1.5 6.6C18 2.4 33 9.4 51 5.6S84 2.6 98.5 6"/></svg>';

/** The curved arrow from the copy down into the notification. */
const ARROW =
  '<svg class="arrow" viewBox="0 0 300 300" aria-hidden="true">' +
  '<path d="M262 6C240 86 178 130 92 148"/>' +
  '<path d="M92 148l36-16"/><path d="M92 148l24 26"/></svg>';

/* --------------------------------------------------------------------------
   Copy
   -------------------------------------------------------------------------- */

/**
 * The headline, with one phrase set in the tint and underlined.
 *
 * `accent` must be a literal substring of `headline`. A near miss is a typo
 * that would otherwise ship as an ad with no accent at all and no complaint,
 * so it throws — the copy files are hand-written and this is the one field in
 * them that has to agree with another field.
 */
export function headline(text, accent) {
  if (!accent) return escapeHtml(text);
  const at = text.indexOf(accent);
  if (at === -1) {
    throw new Error(`accent "${accent}" is not in the headline "${text}"`);
  }
  return (
    escapeHtml(text.slice(0, at)) +
    `<span class="accent">${escapeHtml(accent)}${SWASH}</span>` +
    escapeHtml(text.slice(at + accent.length))
  );
}

function maybe(html, condition) {
  return condition ? html : '';
}

/* --------------------------------------------------------------------------
   The phone
   -------------------------------------------------------------------------- */

export function screenPath(name) {
  const path = join(root, 'assets', 'screens', `${name}.png`);
  if (!existsSync(path)) {
    throw new Error(`no capture "${name}" — looked for ${path}`);
  }
  return path;
}

/**
 * A capture in the frame. The image is referenced by absolute file URL rather
 * than inlined: the captures run to 2.9 MB each and four ads at three sizes is
 * a lot of base64 to hand a browser that is reading the page off the same disk.
 */
function phone(name, klass = '') {
  const src = pathToFileURL(screenPath(name)).href;
  return (
    `<div class="phone ${klass}"><div class="screen">` +
    `<img src="${escapeHtml(src)}" alt=""></div></div>`
  );
}

/**
 * The camera roll, drawn rather than screenshotted.
 *
 * There is no capture of somebody else's Photos app in this repo and there
 * should not be one. What the comparison is about is the *shape* of the thing —
 * tiles, a date, and nothing else — so tiles, a date and nothing else is what
 * gets drawn. No faces, no children, no borrowed interface.
 */
function cameraRoll({ date, note, tiles = 12 }) {
  return (
    '<div class="phone"><div class="screen"><div class="roll">' +
    `<p class="roll-date">${escapeHtml(date)}</p>` +
    `<div class="roll-grid">${'<i></i>'.repeat(tiles)}</div>` +
    `<p class="roll-note">${escapeHtml(note)}</p>` +
    '</div></div></div>'
  );
}

/* --------------------------------------------------------------------------
   Shared blocks
   -------------------------------------------------------------------------- */

function cta(ad) {
  return `<span class="cta">${escapeHtml(ad.cta)}${icon('arrow')}</span>`;
}

function reassure(ad) {
  return maybe(`<p class="reassure">${escapeHtml(ad.reassurance)}</p>`, ad.reassurance);
}

function band(ad) {
  return (
    '<div class="band">' +
    maybe(`<p class="script">${escapeHtml(ad.script)}</p>`, ad.script) +
    `<div class="right">${cta(ad)}${reassure(ad)}</div>` +
    '</div>'
  );
}

function features(list) {
  if (!list || list.length === 0) return '';
  const rows = list
    .map(
      (f) =>
        `<li><span class="chip">${icon(f.icon)}</span><div>` +
        `<p class="f-label">${escapeHtml(f.label)}</p>` +
        `<p class="f-body">${escapeHtml(f.body)}</p></div></li>`
    )
    .join('');
  return `<ul class="features">${rows}</ul>`;
}

function kicker(ad) {
  return maybe(`<p class="kicker">${escapeHtml(ad.kicker)}</p>`, ad.kicker);
}

/** ✓ affirms a promise. An absent thing is an em dash in grey, never a cross. */
function ticks(list) {
  const rows = list
    .map((t) =>
      typeof t === 'string'
        ? `<li>${icon('tick')}<span>${escapeHtml(t)}</span></li>`
        : `<li class="none"><span class="dash">—</span><span>${escapeHtml(t.none)}</span></li>`
    )
    .join('');
  return `<ul class="ticks">${rows}</ul>`;
}

/* --------------------------------------------------------------------------
   Parts the new templates draw
   -------------------------------------------------------------------------- */

/**
 * A prompt with its verb marked, the way a prompt card marks it.
 *
 * `{ pre, verb, post }` is the shape social/prompts.js already stores every
 * prompt in, so a creative quoting the library quotes it in the library's own
 * shape rather than re-typing the sentence with a span in the middle. A plain
 * string is allowed and gets no mark.
 */
function promptText(prompt) {
  if (typeof prompt === 'string') return escapeHtml(prompt);
  return (
    escapeHtml(prompt.pre) +
    `<mark>${escapeHtml(prompt.verb)}</mark>` +
    escapeHtml(prompt.post)
  );
}

/**
 * A transcript line, with the words they got wrong lifted out.
 *
 * `[square brackets]` mark them. A transcript is the one piece of copy in this
 * file that has to highlight several fragments of one sentence, and bracket
 * markers keep that legible in ads.js where a nest of spans would not be.
 */
function transcript(line) {
  return line
    .split(/(\[[^\]]+\])/)
    .map((part) =>
      part.startsWith('[') && part.endsWith(']')
        ? `<em class="said">${escapeHtml(part.slice(1, -1))}</em>`
        : escapeHtml(part)
    )
    .join('');
}

/**
 * The waveform, drawn.
 *
 * Bar heights are percentages of the track rather than pixels, so the same
 * fifty numbers draw at portrait, square and story without a size block each.
 * `played` is where the terracotta stops and the rule colour starts — a
 * playhead, not data, and it is not pretending to be data.
 */
const WAVE = [
  15, 28, 43, 34, 57, 73, 53, 80, 60, 92, 70, 48, 33, 55, 77, 100, 82, 62, 43, 72,
  87, 58, 38, 52, 73, 47, 28, 40, 60, 78, 55, 35, 48, 67, 42, 25, 37, 57, 75, 52,
  32, 45, 63, 40, 22, 33, 50, 68, 45, 27
];

function waveform(played = 26) {
  const bars = WAVE.map(
    (h, i) => `<i class="${i < played ? 'on' : ''}" style="height:${h}%"></i>`
  ).join('');
  return `<div class="wave">${bars}</div>`;
}

/**
 * The one thing the ad is holding up: what the archive actually ends up with.
 *
 *   voice   a waveform and the transcript under it
 *   plate   a still and the prompt that sent you looking
 *   did     no media at all, because an activity has none
 *
 * The third is the reason this is a switch rather than one shape with optional
 * parts. A quarter of the library asks for nothing but ten minutes, and drawing
 * a photograph on that ad to keep the layout regular would be the only
 * dishonest frame in the set.
 */
function evidence(ad) {
  const e = ad.evidence;
  const stamp = `<p class="ev-stamp">${escapeHtml(e.stamp)}</p>`;

  if (e.kind === 'voice') {
    return (
      '<div class="ev ev--voice">' +
      `<div class="ev-track"><span class="ev-glyph">${icon('voice')}</span>${waveform()}</div>` +
      `<div class="ev-foot"><p class="ev-quote">${transcript(e.quote)}</p>${stamp}</div>` +
      '</div>'
    );
  }

  if (e.kind === 'plate') {
    /* No photograph of a child appears on any surface this repo builds. The
       plate is the site's own --wash token for a still and a warm neutral for a
       frame of video: an abstract reads as an image, where a grey box reads as
       one that failed to load. */
    return (
      `<div class="ev ev--plate"><div class="plate plate--${escapeHtml(e.plate)}">` +
      `<span class="plate-badge">${escapeHtml(e.badge)}</span>` +
      maybe('<span class="plate-play"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M8 5.6l10 6.4-10 6.4z"/></svg></span>', e.duration) +
      maybe(`<span class="plate-time">${escapeHtml(e.duration ?? '')}</span>`, e.duration) +
      '</div><div class="ev-body">' +
      `<p class="ev-prompt">${promptText(e.prompt)}</p>` +
      `<div class="ev-foot"><p class="ev-note">${escapeHtml(e.note)}</p>${stamp}</div>` +
      '</div></div>'
    );
  }

  if (e.kind === 'did') {
    return (
      '<div class="ev ev--did">' +
      `<div class="ev-head"><span class="plate-badge">${escapeHtml(e.badge)}</span>${stamp}</div>` +
      `<p class="ev-prompt">${promptText(e.prompt)}</p>` +
      `<div class="did">${icon('tick')}<p class="did-label">${escapeHtml(e.done)}</p>` +
      `<p class="did-note">${escapeHtml(e.note)}</p></div>` +
      '</div>'
    );
  }

  throw new Error(`no evidence kind "${e.kind}" — they are voice, plate, did`);
}

/** One question and the years of its answers, which is the whole ledger ad. */
function entries(list) {
  const rows = list
    .map(
      (e) =>
        '<li class="entry"><div class="entry-when">' +
        `<p class="entry-date">${escapeHtml(e.date)}</p>` +
        `<p class="entry-age">${escapeHtml(e.age)}</p></div>` +
        `<p class="entry-answer">${escapeHtml(e.answer)}</p></li>`
    )
    .join('');
  return `<ul class="entries">${rows}</ul>`;
}

/**
 * The price table, free column first.
 *
 * `null` is an absent thing and renders as the em dash the whole system uses.
 * There is no cross column and there is no red, and a comparison whose free
 * column is a row of dashes reads as a punishment list — so ads.js orders the
 * rows that have a real free entry above the ones that do not, exactly as
 * /pricing does.
 */
function priceTable(ad) {
  const head =
    '<div class="prow prow--head"><span></span>' +
    ad.columns
      .map((c, i) => `<span class="${i === 0 ? 'pcol-free' : ''}">${escapeHtml(c)}</span>`)
      .join('') +
    '</div>';

  const rows = ad.rows
    .map(([label, ...cells]) =>
      `<div class="prow"><span class="prow-label">${escapeHtml(label)}</span>` +
      cells
        .map((c) => (c === null ? '<span class="none"><span class="dash">—</span></span>'
          : `<span>${escapeHtml(c)}</span>`))
        .join('') +
      '</div>'
    )
    .join('');

  const price =
    `<div class="prow prow--price"><span class="prow-label">${escapeHtml(ad.price.label)}</span>` +
    `<span class="price-free">${escapeHtml(ad.price.free)}</span>` +
    `<span class="price-paid">${escapeHtml(ad.price.paid)}` +
    maybe(` <em>${escapeHtml(ad.price.note ?? '')}</em>`, ad.price.note) +
    '</span></div>';

  return `<div class="ptable">${head}${rows}${price}</div>`;
}

/** The wall behind the featured prompt. Kind carries colour, as it does everywhere. */
function wall(list) {
  const chips = list
    .map((c) => `<span class="qchip qchip--${escapeHtml(c.kind)}">${escapeHtml(c.text)}</span>`)
    .join('');
  return `<div class="wall">${chips}</div>`;
}

/* --------------------------------------------------------------------------
   Templates
   -------------------------------------------------------------------------- */

const TEMPLATE = {
  feature: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="body">
    <div class="col-copy body-box">
      ${kicker(ad)}
      <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
      <p class="sub">${escapeHtml(ad.subhead)}</p>
      ${features(ad.features)}
    </div>
    ${phone(ad.screen)}
  </div>
  ${band(ad)}`,

  notify: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    ${kicker(ad)}
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
    <p class="sub">${escapeHtml(ad.subhead)}</p>
  </div>
  ${ARROW}
  ${phone(ad.screen)}
  <div class="notif">${brandMark()}<div>
    <p class="n-title">${escapeHtml(ad.notification.title)}</p>
    <p class="n-body">${escapeHtml(ad.notification.body)}</p>
  </div></div>
  <div class="foot">${cta(ad)}${reassure(ad)}</div>`,

  compare: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
    <p class="sub">${escapeHtml(ad.subhead)}</p>
  </div>
  <div class="cols">
    <div class="col col--before">
      <p class="col-label">${escapeHtml(ad.columns[0])}</p>
      ${ad.roll ? cameraRoll(ad.roll) : phone(ad.secondScreen)}
      ${ticks(ad.beforeTicks ?? [])}
    </div>
    <div class="col col--after">
      <p class="col-label">${escapeHtml(ad.columns[1])}</p>
      ${phone(ad.screen)}
      ${ticks(ad.afterTicks ?? [])}
    </div>
  </div>
  ${band(ad)}`,

  ledger: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    ${kicker(ad)}
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
    <p class="sub">${escapeHtml(ad.subhead)}</p>
  </div>
  <div class="ledger">
    <div class="ledger-rule"><span class="ledger-label">${escapeHtml(ad.questionLabel)}</span><i></i></div>
    <p class="ledger-q">${escapeHtml(ad.question)}</p>
    ${entries(ad.entries)}
  </div>
  ${band(ad)}`,

  card: (ad) =>
    `<div class="head card-head">
    <span class="badge">${escapeHtml(ad.badge)}</span>
    <p class="stamp">${escapeHtml(ad.stamp)}</p>
  </div>
  <div class="card-body body-box"><p class="h card-prompt">${promptText(ad.prompt)}</p></div>
  <div class="card-foot">${lockup()}<div class="right">${cta(ad)}${reassure(ad)}</div></div>`,

  capture: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    ${kicker(ad)}
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
    <p class="sub">${escapeHtml(ad.subhead)}</p>
  </div>
  <div class="stage stage--capture">
    ${evidence(ad)}
    ${ticks(ad.ticks ?? [])}
  </div>
  <div class="foot">${cta(ad)}${reassure(ad)}</div>`,

  pricing: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
    <p class="sub">${escapeHtml(ad.subhead)}</p>
  </div>
  <div class="stage stage--price">
    ${priceTable(ad)}
    <p class="promise">${escapeHtml(ad.promise)}</p>
  </div>
  <div class="foot">${cta(ad)}${reassure(ad)}</div>`,

  library: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    ${kicker(ad)}
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
  </div>
  <div class="stage stage--wall">
    ${wall(ad.wall)}
    <div class="wall-fade"></div>
    <div class="featured">
      <span class="featured-label">${escapeHtml(ad.featured.label)}</span>
      <p class="featured-prompt">${promptText(ad.featured.prompt)}</p>
    </div>
    <p class="wall-note">${escapeHtml(ad.note)}</p>
  </div>
  ${band(ad)}`,

  quiet: (ad) =>
    `<div class="head">${lockup()}</div>
  <div class="copy body-box">
    ${kicker(ad)}
    <h1 class="h">${headline(ad.headline, ad.accent)}</h1>
    <p class="sub">${escapeHtml(ad.subhead)}</p>
    ${maybe(
      `<ul class="promises">${(ad.promises ?? [])
        .map((p) => `<li>${icon('tick')}${escapeHtml(p)}</li>`)
        .join('')}</ul>`,
      (ad.promises ?? []).length > 0
    )}
  </div>
  <div class="stage">
    ${phone(ad.screen)}
    <div class="foot">${cta(ad)}${reassure(ad)}</div>
  </div>`
};

/* --------------------------------------------------------------------------
   Describing a creative to something that cannot see it
   -------------------------------------------------------------------------- */

/**
 * What is actually ON a creative, in a sentence.
 *
 * `npm run social:captions` writes the alt text for a queued ad, and it is
 * working from the copy alone — it never sees the render. Told only that the
 * layout is called "photo" it will confidently describe a phone that is not
 * there, a waveform on the video ad, and "a plain text card" for one with a
 * phone rising out of it. Every one of those shipped in the first pass.
 *
 * So the layout describes itself, from the same object that draws it. Written
 * for a person who cannot see the image, because that is exactly who the alt
 * text is for.
 */
export function describe(ad) {
  const shapes = {
    feature: () =>
      'Two columns: a headline and three labelled feature rows on the left, a phone ' +
      'showing the app on the right, and a band across the bottom holding a line in a ' +
      'script face and the button.',

    notify: () =>
      'A dark ink background. A phone tilts up from the bottom left and an iOS-style ' +
      'notification escapes its edge, with a drawn arrow curving down from the headline ' +
      'to point at it.',

    compare: () =>
      `Two labelled columns side by side — "${ad.columns?.[0] ?? 'before'}" is a drawn ` +
      `grid of blank camera-roll thumbnails, "${ad.columns?.[1] ?? 'after'}" is a phone ` +
      'showing the app — with a short ticked list under each.',

    quiet: () =>
      'A centred headline, a row of ticked pills, and a phone rising out of the bottom ' +
      'edge and dissolving into the background.',

    ledger: () =>
      `No phone. The question "${ad.question}" is printed once, and under it ` +
      `${ad.entries?.length ?? 0} dated entries stack in a single column — ` +
      `${(ad.entries ?? []).map((e) => e.date).join(', ')} — each with the child's age ` +
      'beside the date and the answer alongside.',

    card: () =>
      'The whole canvas is one prompt card on warm paper: a small badge, the question in ' +
      `large type with the word "${ad.prompt?.verb ?? ''}" highlighted in a filled block, ` +
      'and the wordmark and the button along the bottom.',

    pricing: () =>
      'A two-column price table — Free first, then Membership — with an em dash where a ' +
      'feature is absent rather than a cross, and a line underneath about nothing being ' +
      'locked behind payment.',

    library: () =>
      'A wall of small prompt chips fading down into the background, with one prompt ' +
      `pulled forward on a raised card: "${ad.featured?.prompt?.pre ?? ''}` +
      `${ad.featured?.prompt?.verb ?? ''}${ad.featured?.prompt?.post ?? ''}".`,

    capture: () => {
      const e = ad.evidence ?? {};
      if (e.kind === 'voice') {
        return (
          'A card holding a drawn audio waveform beside a microphone glyph, with the ' +
          'transcript underneath — the mispronounced words highlighted — and the length ' +
          `of the recording and the child's age (${e.stamp}). Three ticked lines below it.`
        );
      }
      if (e.kind === 'plate' && e.plate === 'still') {
        return (
          'A card whose top half is a warm neutral video frame with a play button and a ' +
          `"${e.duration}" pill, the prompt printed underneath, and a date and the ` +
          `child's age (${e.stamp}). Three ticked lines below it.`
        );
      }
      if (e.kind === 'plate') {
        return (
          'A card whose top half is a soft warm gradient standing in for a photograph — ' +
          'no child is shown — with the prompt printed underneath and a date and the ' +
          `child's age (${e.stamp}). Three ticked lines below it.`
        );
      }
      return (
        'A card with the prompt in large type and a green "Did it" row beneath it. No ' +
        'photo and no media of any kind. Three ticked lines below it.'
      );
    }
  };

  const shape = shapes[ad.template];
  if (!shape) throw new Error(`no description for template "${ad.template}"`);
  return `${shape()} The lockup — a fan of cards and the word Vellum — sits at the top.`;
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

/**
 * The stylesheet and the inlined webfont — the pair every render needs.
 *
 * Nunito alone, because the ad's type is now the landing page's type and the
 * landing page self-hosts exactly one face: display is Nunito, body copy is the
 * system stack (src/assets/site.css `--display` / `--text`). Source Sans 3 is
 * still shipped and still set on every prompt card; it is simply not a face the
 * site has ever used, and an ad that sets its body copy in one is off-brand in
 * the specific way nobody can name and everybody sees.
 */
export function loadAdAssets() {
  return {
    css: readFileSync(join(root, 'social', 'ad.css'), 'utf8'),
    fonts: fontFaces(['Nunito'])
  };
}

/**
 * Shrinks the headline until the copy block fits its box, after the webfont has
 * loaded — measuring against the fallback face measures a different width and
 * ships an ad that is either overset or half empty.
 *
 * The flag it sets is the one the shared `shoot()` already waits on, which is
 * why every template's copy block carries `.body-box`: that class is the fit
 * contract between this script and the screenshotter, not a layout hook.
 */
const FIT = `
document.fonts.ready.then(function () {
  /* Is the copy column overset?
     Not scrollHeight against clientHeight, which is what this used to ask. Two
     bits of the accent's own decoration answer yes to that question forever:
     the swash hangs 0.19em BELOW the phrase it underlines, which is the point
     of it, and '.accent' is a positioned inline, so its glyph box pokes out of
     a 1.08 line-height at both ends. Both are descendants of the copy box and
     both count toward its scrollHeight, and both scale with the font — so on a
     creative whose headline is the LAST thing in the box, the loop below used
     to grind that headline to its floor chasing an overflow no font size could
     clear, and then report it as overset anyway.
     Ask the question that was meant instead: does any block in the column end
     below the column's content edge. A child's border box excludes decoration
     that overhangs it, which is exactly the distinction wanted here. */
  var box = document.querySelector('.body-box');
  function overset() {
    if (!box) return false;
    var edge = box.getBoundingClientRect().bottom -
      parseFloat(getComputedStyle(box).paddingBottom);
    var kids = box.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].getBoundingClientRect().bottom > edge + 1) return true;
    }
    return false;
  }

  var h = box && box.querySelector('.h');
  if (h) {
    var size = parseFloat(getComputedStyle(h).fontSize);
    var floor = size * 0.66;
    while (size > floor && overset()) {
      size -= 1;
      h.style.fontSize = size + 'px';
    }
  }

  /* The band is one row measured horizontally: a script line on the left, the
     button and its line on the right, inside the same margin the rest of the ad
     keeps. Nothing above enforces that. It is a space-between flex row, so a row
     wider than its content box does not wrap and does not clip — it spends the
     difference on the right padding, walks the button toward the canvas edge,
     and only reports a defect once the button has left the canvas entirely.
     The set shipped that way: at 1080 the button's right edge stood at 1071
     against a margin that stops at 1008, and it looked like a design decision.

     So the row is fitted rather than trusted, and the two knobs turn in the
     order it costs least to turn them. The script line is decoration and goes
     first. The button is the ask and shrinks only if the row still does not
     fit — which is what a CTA long enough to name a store needs. Whatever is
     left over after both floors is reported below like any other overset copy. */
  var band = document.querySelector('.band');
  var bandRight = band && band.querySelector('.right');
  var bandFits = function () {
    if (!band || !bandRight) return true;
    var margin = parseFloat(getComputedStyle(band).paddingRight);
    return bandRight.getBoundingClientRect().right <=
      band.getBoundingClientRect().right - margin + 0.5;
  };
  if (band && bandRight) {
    [
      [band.querySelector('.script'), 0.75],
      [bandRight.querySelector('.cta'), 0.8]
    ].forEach(function (pair) {
      var el = pair[0];
      if (!el) return;
      var pt = parseFloat(getComputedStyle(el).fontSize);
      var min = pt * pair[1];
      while (pt > min && !bandFits()) {
        pt -= 1;
        el.style.fontSize = pt + 'px';
      }
    });
  }

  /* Everything that carries a word has to be wholly inside the canvas, and
     outside the band unless it belongs to the band. Copy that overruns is the
     one defect this renderer cannot show you — it looks like a design decision
     until you read the ad. */
  var ad = document.querySelector('.ad');
  var edge = ad && ad.getBoundingClientRect();
  var lid = band ? band.getBoundingClientRect().top : edge.bottom;
  var over = [];
  /* Every element that carries a word, minus the wall: .qchip is a decorative
     bank of prompts that is *supposed* to run out of the bottom of its box and
     be clipped there, and a rect ignores clipping, so watching it would report
     the dissolve as a defect on every render. */
  var watched = ad ?  '.h,.sub,.kicker,.features li,.ticks li,.promises li,.col-label,' +
                '.script,.cta,.reassure,.n-title,.n-body,.roll-note,' +
                '.entry-date,.entry-age,.entry-answer,.ledger-label,.ledger-q,' +
                '.badge,.stamp,.card-prompt,.ev-prompt,.ev-quote,.ev-note,.ev-stamp,' +
                '.did-label,.did-note,.plate-badge,.plate-time,.prow span,.promise,' +
                '.featured-label,.featured-prompt,.wall-note' : '';
  (watched ? document.querySelectorAll(watched) : []).forEach(function (el) {
    var r = el.getBoundingClientRect();
    var inBand = band && band.contains(el);
    var name = (el.className || el.tagName).toString().split(' ')[0];
    var text = (el.textContent || '').trim().slice(0, 42);
    if (r.bottom > edge.bottom + 0.5 || r.top < edge.top - 0.5 ||
        r.right > edge.right + 0.5 || r.left < edge.left - 0.5) {
      over.push(name + ' leaves the canvas — "' + text + '"');
    } else if (!inBand && r.bottom > lid + 0.5) {
      over.push(name + ' runs under the band — "' + text + '"');
    }
  });
  if (overset()) {
    over.push('the copy column is still overset after shrinking the headline');
  }
  if (!bandFits()) {
    over.push('the band row still overruns its margin after shrinking the script and the button');
  }

  /* Copy sliding under the phone is the same defect as copy sliding under the
     band, and it reads as a cropping bug rather than as depth. Two things are
     over a phone on purpose — the quiet template's button and the notify
     template's notification — so they are named rather than inferred. The band
     is a third: it is opaque and it sits above the phone, so a phone passing
     behind it is the design, not a collision. */
  var overPhone = '.cta,.reassure,.n-title,.n-body';
  var phones = [].slice.call(document.querySelectorAll('.phone'));
  (watched ? document.querySelectorAll(watched) : []).forEach(function (el) {
    if (el.closest(overPhone) || el.matches(overPhone) ||
        el.closest('.phone') || el.closest('.band')) return;
    var r = el.getBoundingClientRect();
    phones.forEach(function (ph) {
      var q = ph.getBoundingClientRect();
      if (r.left < q.right - 2 && r.right > q.left + 2 &&
          r.top < q.bottom - 2 && r.bottom > q.top + 2) {
        var name = (el.className || el.tagName).toString().split(' ')[0];
        over.push(name + ' runs under the phone — "' +
          (el.textContent || '').trim().slice(0, 42) + '"');
      }
    });
  });

  document.documentElement.dataset.overflow = over.join(' | ');
  document.documentElement.dataset.fitted = 'true';
});
`;

export function adHtml(ad, { css, fonts, size }) {
  const build = TEMPLATE[ad.template];
  if (!build) {
    throw new Error(`no template "${ad.template}" — they are ${Object.keys(TEMPLATE).join(', ')}`);
  }
  const tint = TINTS[ad.tint];
  if (!tint) throw new Error(`no tint "${ad.tint}" — they are ${Object.keys(TINTS).join(', ')}`);

  const html = `<!doctype html>
<html lang="en" data-size="${size.name}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(`${PRODUCT} — ${ad.headline}`)}</title>
<style>
${fonts}
:root { --w: ${size.w}px; --h: ${size.h}px; }
${css}
</style>
</head>
<body>
<article class="ad ad--${ad.template}"
  style="--tint: ${tint.ink}; --tint-soft: ${tint.soft}; --tint-band: ${tint.band}; --tint-lift: ${tint.lift}">
${build(ad)}
</article>
<script>${FIT}</script>
</body>
</html>
`;

  /* The site's rule, enforced here rather than trusted: no price, name, domain
     or prompt count is typed into an ad. A token the config has no value for
     would otherwise print as literal braces on a bought placement. */
  const filled = fill(html);
  const leftover = filled.match(/\{\{[A-Z0-9_]+\}\}/);
  if (leftover) {
    throw new Error(`${ad.id}: ${leftover[0]} has no value in site.config.json`);
  }
  return filled;
}

/* --------------------------------------------------------------------------
   Chrome
   -------------------------------------------------------------------------- */

/**
 * One headless shot per creative.
 *
 * A near-copy of `shoot()` in social/card.mjs, and deliberately not a call to
 * it: an ad has a failure mode a prompt card does not have. A card is one
 * sentence in a box that the fit script shrinks until it fits, so it cannot
 * overrun. An ad has a headline, a subhead, three feature bodies, a script line
 * and a button, all sized independently, and a sentence three words too long
 * slides under the band and ships looking intentional. So this waits for the
 * page's own overflow report and hands it back, and the caller refuses to
 * pretend the render succeeded.
 *
 * Everything else is the card's shot, unchanged: the same system Chrome, a
 * browser per shot, format from the extension.
 */
export async function shootAd(chrome, html, out, size) {
  const { chromium } = await import('playwright').catch(() => {
    throw new Error('playwright is missing — run `npm install`');
  });

  const jpeg = /\.jpe?g$/i.test(out);
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    const page = await browser.newPage({
      viewport: { width: size.w, height: size.h },
      deviceScaleFactor: 1
    });
    await page.goto(pathToFileURL(html).href);
    await page.waitForFunction(
      () => document.documentElement.dataset.fitted === 'true',
      null,
      { timeout: 15000 }
    );
    await page.screenshot({
      path: out,
      type: jpeg ? 'jpeg' : 'png',
      ...(jpeg ? { quality: 92 } : {})
    });
    const report = await page.evaluate(() => document.documentElement.dataset.overflow ?? '');
    return report ? report.split(' | ') : [];
  } catch (error) {
    throw new Error(`${basename(html)} failed to render — ${error.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }
}
