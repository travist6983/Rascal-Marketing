/**
 * htmlToMarkdown(html, options) — renders a built page body as Markdown.
 *
 * Written for THIS site's markup, not the whole web: the pages are authored
 * here, well-formed, and disciplined about aria-hidden on decoration, which is
 * what makes a dependency-free converter safe. The rules:
 *
 *   - aria-hidden subtrees, <script>, <style>, <template>, <svg>, <form> and
 *     <button> are dropped whole — decoration and UI chrome, not content
 *   - so is anything marked data-chrome, for the chrome that is none of those:
 *     a filter bar's live count and an empty state nobody has triggered are
 *     interface state, and a twin that reads "Showing all 133 prompts" is
 *     telling a crawler about a control it cannot press
 *   - h1..h6, p, ul/ol/li, blockquote, hr, table, figure map to Markdown
 *   - <summary> becomes a ### heading (the FAQ's question rows)
 *   - <span class="chip"> becomes bold — it labels the thing after it
 *   - <img> becomes *[Image: alt]*; decorative alt="" images vanish
 *   - internal links can be rewritten via options.mapHref, so Markdown pages
 *     link to Markdown pages and a crawler never has to leave text
 */

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', middot: '·',
  rarr: '→', larr: '←', frac12: '½', times: '×'
};

function decode(text) {
  return text
    /* Entity-encoded braces are how the HTML shows a deliberately raw token
       (the /prompts page demonstrates the stored form). Emit them escaped so
       they render as braces while staying distinguishable from a renderer
       that failed to run — the check suite treats \{name\} as intentional. */
    .replace(/&#0*123;|&#x0*7b;/gi, '\\{')
    .replace(/&#0*125;|&#x0*7d;/gi, '\\}')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (m, name) =>
      Object.prototype.hasOwnProperty.call(ENTITIES, name) ? ENTITIES[name] : m);
}

const SKIP = new Set(['script', 'style', 'template', 'svg', 'form', 'button', 'select']);
const BLOCK = new Set(['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'figure', 'figcaption', 'picture', 'details']);
const VOID = new Set(['img', 'br', 'hr', 'source', 'input', 'meta', 'link']);

function attrsOf(raw) {
  const out = {};
  for (const m of raw.matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)) out[m[1]] = m[2] ?? '';
  return out;
}

export function htmlToMarkdown(html, options = {}) {
  const mapHref = options.mapHref || ((h) => h);
  const blocks = [];
  let inline = '';

  const listStack = [];   // {ordered, index}
  const aHref = [];
  const chipStack = [];
  let quoteDepth = 0;
  let heading = 0;
  let table = null;       // {rows, caption, cur, inCaption}

  function flush() {
    const text = inline.replace(/[ \t\n]+/g, ' ').trim();
    inline = '';
    if (!text) { heading = 0; return; }
    const quote = '> '.repeat(quoteDepth);
    if (heading) {
      blocks.push(quote + '#'.repeat(heading) + ' ' + text);
      heading = 0;
    } else if (listStack.length) {
      const depth = '  '.repeat(listStack.length - 1);
      const top = listStack[listStack.length - 1];
      blocks.push(quote + depth + (top.ordered ? `${++top.index}.` : '-') + ' ' + text);
    } else {
      blocks.push(quote + text);
    }
  }

  function text(t) {
    if (table) {
      if (table.inCaption) table.caption += decode(t);
      else if (table.cur !== null) table.rows[table.rows.length - 1][table.cur] += decode(t);
      return;
    }
    inline += decode(t);
  }

  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)\/?>|<!--[\s\S]*?-->/g;
  let last = 0;
  let skipDepth = 0;
  let skipTag = null;
  let m;

  while ((m = re.exec(html))) {
    if (!skipDepth) text(html.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[0].startsWith('<!--')) continue;

    const closing = m[0][1] === '/';
    const tag = m[1].toLowerCase();
    const attrs = closing ? {} : attrsOf(m[2] || '');
    const selfClosed = /\/>$/.test(m[0]) || VOID.has(tag);

    if (skipDepth) {
      if (tag === skipTag && !selfClosed) skipDepth += closing ? -1 : 1;
      if (skipDepth === 0) skipTag = null;
      continue;
    }
    if (!closing && (SKIP.has(tag) || attrs['aria-hidden'] === 'true' || 'data-chrome' in attrs)) {
      if (!selfClosed) { skipDepth = 1; skipTag = tag; }
      continue;
    }

    /* tables assemble separately, then emit as one block */
    if (tag === 'table' && !closing) { flush(); table = { rows: [], caption: '', cur: null, inCaption: false }; continue; }
    if (table) {
      if (tag === 'table' && closing) {
        const rows = table.rows.filter((r) => r.length);
        if (rows.length) {
          if (table.caption.trim()) blocks.push('*' + table.caption.replace(/\s+/g, ' ').trim() + '*');
          const width = Math.max(...rows.map((r) => r.length));
          const line = (r) => '| ' + Array.from({ length: width }, (_, i) => (r[i] || '').replace(/\s+/g, ' ').trim() || ' ').join(' | ') + ' |';
          blocks.push([line(rows[0]), '| ' + Array(width).fill('---').join(' | ') + ' |', ...rows.slice(1).map(line)].join('\n'));
        }
        table = null;
      } else if (tag === 'caption') {
        table.inCaption = !closing;
      } else if (tag === 'tr' && !closing) {
        table.rows.push([]); table.cur = null;
      } else if ((tag === 'th' || tag === 'td') && !closing) {
        const row = table.rows[table.rows.length - 1];
        if (row) { row.push(''); table.cur = row.length - 1; }
      } else if ((tag === 'th' || tag === 'td') && closing) {
        table.cur = null;
      }
      continue;
    }

    switch (tag) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        if (closing) flush();
        else { flush(); heading = Number(tag[1]); }
        continue;
      case 'summary':
        if (closing) flush();
        else { flush(); heading = 3; }
        continue;
      case 'p': case 'li':
        if (closing) flush();
        continue;
      case 'ul': case 'ol':
        flush();
        if (closing) listStack.pop(); else listStack.push({ ordered: tag === 'ol', index: 0 });
        continue;
      case 'blockquote':
        flush(); quoteDepth = Math.max(0, quoteDepth + (closing ? -1 : 1));
        continue;
      case 'hr':
        flush(); blocks.push('---'); continue;
      case 'br':
        inline += ' '; continue;
      case 'img': {
        const alt = decode(attrs.alt || '').trim();
        if (alt) { flush(); blocks.push('*[Image: ' + alt + ']*'); }
        continue;
      }
      case 'a':
        if (!closing) {
          aHref.push(attrs.href || '');
          if (attrs.href && !attrs.href.startsWith('#')) inline += '[';
        } else {
          const href = aHref.pop() || '';
          if (href && !href.startsWith('#')) inline += `](${mapHref(href)})`;
        }
        continue;
      case 'strong': case 'b':
        inline += '**'; continue;
      case 'em': case 'i':
        inline += '*'; continue;
      case 'code':
        inline += '`'; continue;
      case 'span':
        if (!closing) {
          const isChip = /(?:^|\s)chip(?:\s|"|$)/.test((attrs.class || '') + ' ');
          chipStack.push(isChip);
          if (isChip) inline += '**';
        } else if (chipStack.pop()) {
          inline += '**:';
        }
        continue;
      default:
        if (BLOCK.has(tag)) flush();
        continue;
    }
  }
  if (!skipDepth) text(html.slice(last));
  flush();

  return blocks.filter(Boolean).join('\n\n')
    .replace(/\*\*\s*\*\*:?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}
