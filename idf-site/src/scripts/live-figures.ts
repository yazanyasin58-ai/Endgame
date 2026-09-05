/**
 * Overwrite the committed Google rating and review count with the live ones.
 *
 * Anything on the page carrying `data-live-figure="googleRating"` or
 * `"googleTotal"` is replaced from a single /api/reviews response. It lives
 * here rather than in the carousel because the About page prints the same
 * numbers without a carousel, and two copies of this would be two chances for
 * the page to show two different ratings.
 *
 * Doing nothing is the correct failure: the markup already contains the
 * committed values, which are real figures read on a stated date.
 */
export interface LiveFigureData {
  rating: number | null;
  total: number | null;
}

export function applyLiveFigures(data: LiveFigureData): void {
  if (typeof data.rating === 'number') {
    document
      .querySelectorAll<HTMLElement>('[data-live-figure="googleRating"]')
      .forEach((el) => {
        el.textContent = data.rating!.toFixed(1);
      });
  }
  if (typeof data.total === 'number') {
    document
      .querySelectorAll<HTMLElement>('[data-live-figure="googleTotal"]')
      .forEach((el) => {
        el.textContent = String(data.total);
      });
  }
}

/**
 * Fetch once and apply. For pages that show the figures but have no carousel
 * doing the fetch already — the carousel calls `applyLiveFigures` directly
 * with the response it has, so nothing fetches twice.
 */
export function fetchAndApplyLiveFigures(): void {
  if (!document.querySelector('[data-live-figure]')) return;
  fetch('/api/reviews', { headers: { accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.ok) applyLiveFigures(data);
    })
    .catch(() => {
      /* The committed figures are already on the page. */
    });
}
