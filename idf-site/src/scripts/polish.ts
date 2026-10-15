/**
 * The behaviour half of src/styles/polish.css. Three small jobs, each of
 * which only ADDS to a page that is already complete without it.
 *
 * 1. Pointer spotlight. One delegated listener for the whole document, not
 *    one per card: the review cards can be replaced wholesale by the live
 *    Google fetch, and a delegated listener needs no re-binding when that
 *    happens. It writes two custom properties and nothing else.
 *
 * 2. Word-by-word headings, after the 21st.dev "Text Reveal" component. The
 *    heading carries its full text as aria-label and the animated words are
 *    aria-hidden, so assistive tech hears one heading rather than a run of
 *    separate words, and every section named by aria-labelledby keeps its
 *    name. The original component used a visually hidden copy instead; that
 *    doubles the text when someone selects and copies the heading.
 *    Under reduced motion nothing is split at all.
 *
 * 3. Settling staggered cards, so their hover response has no entrance
 *    delay. See the note above .pl-settled in polish.css.
 *
 * 4. A ripple from the point of a tap or click, after the 21st.dev "Ripple
 *    Button". Also delegated, so buttons added later ripple too. The span is
 *    decoration only and removes itself when its animation ends.
 *
 * Plus the hidden-tab pause, which until now only the homepage had.
 */

/** Cards that light up under the pointer. Must not already use ::before. */
const SPOT = [
  '.hp-xgroup',
  '.hp-figure',
  '.rc-card',
  '.re-item',
  '.inv-card',
  '.ab-count-item',
  '.ir-item',
  '.sv-group',
  '.nf-list a',
].join(',');

/**
 * Headings that rise word by word. Each must sit inside something reveal.ts
 * adds `.in` to, or its words would wait for a trigger that never comes;
 * split() checks that rather than trusting this list.
 */
const SPLIT = 'main .hp-h2, main .hp-final-heading, main .lyh-band h2, main .hp-mil-h';

/** Mirrors the SELECTOR in reveal.ts: the elements that receive `.in`. */
const REVEALED = [
  '.rv',
  'main .hp-section:not(.hp-pagehead)',
  'main .hp-showroom',
  'main .hp-mil',
  'main .hp-final',
].join(',');

/** Grids whose children stagger in, from reveal.css. */
const STAGGERED = ':is(.hp-explore, .re-grid, .hp-pillars) > *';

/** Controls that ripple. Each is position:relative and clips (motion.css). */
const RIPPLE = [
  '.hp-btn',
  '.ef-submit',
  '.hp-section > .hp-textlink',
  '.hp-textlink.hp-faq-more',
  '.hp-xlink',
  '.faq-q',
  '.callbar a',
  '.sg-sub-inline a',
  '.svc-more-list a',
  '.gal-filter-btn',
  '.rc-arrow',
  '.nf-list a',
  ':is(.sv-group, .hp-pillar) .hp-pillar-link',
].join(',');

/** Per-word delay, capped so a long heading still finishes inside ~0.6s. */
const WORD_STEP = 70;
const MAX_STAGGER = 600;

function spotlight(): void {
  let raf = 0;
  let last: PointerEvent | null = null;

  const paint = () => {
    raf = 0;
    if (!last) return;
    const target = last.target instanceof Element ? last.target.closest<HTMLElement>(SPOT) : null;
    if (!target) return;
    if (!target.hasAttribute('data-spot')) target.setAttribute('data-spot', '');
    const r = target.getBoundingClientRect();
    target.style.setProperty('--pl-x', `${last.clientX - r.left}px`);
    target.style.setProperty('--pl-y', `${last.clientY - r.top}px`);
  };

  document.addEventListener(
    'pointermove',
    (e) => {
      // A finger has no hover, and a light left where it lifted looks stuck.
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      last = e;
      if (!raf) raf = requestAnimationFrame(paint);
    },
    { passive: true },
  );
}

function split(): void {
  for (const h of document.querySelectorAll<HTMLElement>(SPLIT)) {
    if (h.classList.contains('pl-split')) continue;
    // Plain text only. A heading with a link or an <em> in it keeps its
    // markup rather than being flattened into words.
    if (h.children.length > 0) continue;
    if (!h.closest(REVEALED)) continue;

    const text = (h.textContent || '').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(Boolean);
    if (words.length === 0) continue;

    const step = Math.min(WORD_STEP, MAX_STAGGER / words.length);

    const shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    words.forEach((word, i) => {
      const clip = document.createElement('span');
      clip.className = 'pl-clip';
      const w = document.createElement('span');
      w.className = 'pl-word';
      w.textContent = word;
      w.style.setProperty('--pl-d', `${Math.round(i * step)}ms`);
      clip.append(w);
      shown.append(clip);
      if (i < words.length - 1) shown.append(' ');
    });

    h.setAttribute('aria-label', text);
    h.replaceChildren(shown);
    h.classList.add('pl-split');
  }
}

function settle(): void {
  document.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    const el = e.target;
    if (el instanceof HTMLElement && el.matches(STAGGERED)) el.classList.add('pl-settled');
  });
}

function ripple(reduce: MediaQueryList): void {
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (reduce.matches || e.button !== 0) return;
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>(RIPPLE) : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'pl-ripple';
      dot.setAttribute('aria-hidden', 'true');
      dot.style.left = `${e.clientX - r.left}px`;
      dot.style.top = `${e.clientY - r.top}px`;
      // Big enough to reach the far corner from wherever the tap landed.
      dot.style.setProperty('--rs', `${Math.ceil(Math.max(r.width, r.height) * 2.2)}px`);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
      el.append(dot);
    },
    { passive: true },
  );
}

export function initPolish(): void {
  spotlight();
  settle();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  ripple(reduce);
  // Splitting is one-way: once a heading is words, it stays words. Turning
  // reduced motion on later is still honoured, because polish.css pins every
  // word to its finished state under that query.
  if (!reduce.matches) split();

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
  });
}
