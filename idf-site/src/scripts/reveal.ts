/**
 * Scroll entrances, for every page.
 *
 * This was an inline script in HomeSections.astro, which meant the other
 * twenty-seven pages had none. The behaviour is unchanged; only its reach is
 * different, and it now runs from the base layout.
 *
 * THE SCRIPT DOES ONE THING: add `.in` when an element arrives. What is
 * hidden, by how much, and for how long is all in reveal.css, because a
 * script that hid things on load would have to paint them first.
 *
 * Reduced motion is honoured LIVE AND IN BOTH DIRECTIONS. Turning it on
 * pins everything to its finished state immediately; turning it back off
 * re-arms the observer rather than leaving the rest of the page pinned. A
 * visitor who changes the setting mid-visit gets the setting they chose,
 * not the one they loaded with.
 */
const SELECTOR = [
  '.rv',
  '[data-draft-rule]',
  'main .hp-section:not(.hp-pagehead)',
  'main .hp-showroom',
  'main .hp-mil',
  'main .hp-final',
].join(',');

export function initReveal(): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = () => [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  let io: IntersectionObserver | null = null;

  function pinAll(): void {
    io?.disconnect();
    io = null;
    for (const el of targets()) el.classList.add('in');
  }

  function arm(): void {
    if (io) return;
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          /* Arrived. Stop watching it, so a long page is not paying for
             dozens of live observations while someone scrolls. */
          io?.unobserve(entry.target);
        }
      },
      /* A margin off the bottom means a section starts arriving slightly
         before it would otherwise be noticed, so it is finished by the time
         it is properly in view rather than still moving under the reader.
         The low threshold matters for tall sections, which on a phone can
         be taller than the screen and would never reach a high one. */
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    for (const el of targets()) {
      if (!el.classList.contains('in')) io.observe(el);
    }
  }

  /**
   * The backstop, and it is not optional.
   *
   * IntersectionObserver reports CHANGES in intersection. A section that is
   * jumped clean over, by an anchor link, a restored scroll position, a
   * flick on a phone or a find-in-page, can go from below the viewport to
   * above it without a single frame in between, and no callback ever fires.
   * Before this change that cost an animation. Now it would leave a section
   * of a live page permanently invisible, which is the price of hiding
   * things in CSS and the reason this exists.
   *
   * So position is also evaluated DIRECTLY, from the rect, on a
   * rAF-coalesced passive scroll listener. Anything whose top has passed
   * the bottom of the viewport is revealed whether or not the observer ever
   * noticed it. The same failure cost this project a bug in the sticky
   * header, by exactly this mechanism.
   *
   * It unbinds itself once nothing is left, so a finished page is not
   * paying for a scroll listener.
   */
  let queued = false;
  let sweeping = false;

  const sweep = (): void => {
    queued = false;
    const left = targets().filter((el) => !el.classList.contains('in'));
    for (const el of left) {
      if (el.getBoundingClientRect().top < innerHeight * 0.95) {
        el.classList.add('in');
        io?.unobserve(el);
      }
    }
    if (left.every((el) => el.classList.contains('in'))) unbindSweep();
  };

  const onScroll = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };

  function bindSweep(): void {
    if (sweeping) return;
    sweeping = true;
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
  }

  function unbindSweep(): void {
    if (!sweeping) return;
    sweeping = false;
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
  }

  const apply = () => {
    if (reduce.matches) {
      pinAll();
      unbindSweep();
      return;
    }
    arm();
    bindSweep();
    sweep();
  };

  reduce.addEventListener('change', apply);
  apply();
}
