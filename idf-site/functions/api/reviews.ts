/**
 * GET /api/reviews — the live Google reviews feed.
 *
 * A Cloudflare Pages Function. The page renders the curated reviews from
 * `src/content/idf.ts` server-side; this endpoint is what upgrades that to the
 * live Google set, and the page keeps working unchanged if it fails.
 *
 * Three things it deliberately does not do:
 *
 *   1. It takes NO input. The place ID is server-side, so the endpoint cannot
 *      be turned into a free proxy for querying arbitrary places on the
 *      client's billed API key.
 *   2. It never returns the key, and never returns Google's raw response —
 *      only the handful of fields the carousel renders.
 *   3. It never fails hard. Any error is `{ ok: false }` with HTTP 200, so the
 *      page quietly keeps the curated reviews rather than showing an error
 *      where testimonials should be.
 *
 * See CLOUDFLARE.md § 3b for the key and the Google Cloud setup.
 */

interface Env {
  /** Google Places API key. Secret. Omit and this endpoint returns ok:false. */
  GOOGLE_PLACES_KEY?: string;
  /** Overrides the place ID below. Public information; only here to avoid a deploy to change it. */
  GOOGLE_PLACE_ID?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

/** Interior Design Flooring, 45431 Ruritan Circle, Sterling VA. */
const DEFAULT_PLACE_ID = 'ChIJr4P8Rvk4tokR4Ni_5rGjQbY';

/**
 * Only reviews at or above this many stars are returned.
 *
 * This is a curated selection, not a summary of what people say — which is
 * exactly why `rating` and `total` below are always returned alongside, and
 * why the carousel prints them. Showing a rating-filtered set of reviews while
 * implying it represents reviews generally is review suppression under the
 * FTC's consumer-review rule (16 CFR 465.6, in force since October 2024). The
 * true average and the true count, displayed next to the selection with a link
 * to all of them, is what makes it a selection rather than a misrepresentation.
 *
 * The two travel together on purpose: the filter and the aggregate are
 * produced by this one response, so a caller cannot get the filtered reviews
 * without also getting the numbers that keep them honest.
 */
const MIN_RATING = 4;

/** Google returns at most 5 reviews per place. There is no paging. */
const CACHE_SECONDS = 86_400;

interface OutReview {
  name: string;
  rating: number;
  quote: string;
  when: string;
  photo?: string;
  uri?: string;
}

const json = (body: unknown, seconds = 0): Response =>
  new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': seconds
        ? `public, max-age=${Math.min(seconds, 1800)}, s-maxage=${seconds}`
        : 'no-store',
    },
  });

const handleGet = async (context: PagesContext): Promise<Response> => {
  const { env, request } = context;
  /*
   * Trimmed. A secret pasted into the Pages dashboard can carry a trailing
   * newline or space, and it would be sent as part of the X-Goog-Api-Key
   * header — Google then rejects it as API_KEY_INVALID, which reads as a wrong
   * key rather than a whitespace problem. Costs nothing to rule out.
   */
  const key = env.GOOGLE_PLACES_KEY?.trim();
  if (!key) {
    console.warn('reviews: GOOGLE_PLACES_KEY not set — returning ok:false');
    return json({ ok: false, reason: 'unconfigured' });
  }

  // Cache on a fixed key, not the incoming URL: a query string appended by a
  // link or a crawler must not become a separate cache entry and a separate
  // billed call.
  const cacheKey = new Request(new URL('/api/reviews', request.url).toString());
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const placeId = env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID;
  const fields = 'rating,userRatingCount,googleMapsUri,reviews';

  let payload: Record<string, unknown>;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields },
    });
    if (!res.ok) {
      // Read the WHOLE body before parsing, and truncate only for the log.
      // Parsing a truncated copy is how the first version of this silently
      // dropped `upstreamStatus`: Google's key errors run to ~570 characters,
      // so a 500-character slice is invalid JSON.
      const body = await res.text();
      console.error('reviews: Places API', res.status, body.slice(0, 500));

      /*
       * Return the upstream status code and Google's own status enum —
       * PERMISSION_DENIED, SERVICE_DISABLED, INVALID_ARGUMENT and so on.
       *
       * Reading the Pages runtime log needs dashboard authentication, which
       * whoever is debugging this may not have; without these two values
       * `{ok:false}` is indistinguishable between a key that is missing, a key
       * restricted to the legacy Places API rather than Places API (New), the
       * API not enabled on the project, billing off, and a bad field mask.
       * Neither value can carry the key or any customer data — the status enum
       * is a fixed vocabulary and the code is an integer — so this is safe to
       * expose on a public endpoint. Google's free-text message is
       * deliberately NOT included; it is logged instead.
       */
      let status: string | undefined;
      let detail: string | undefined;
      try {
        const parsed = JSON.parse(body) as {
          error?: { status?: unknown; details?: { reason?: unknown }[] };
        };
        if (typeof parsed.error?.status === 'string') status = parsed.error.status;
        // details[].reason is the precise one. INVALID_ARGUMENT could be
        // several things; API_KEY_INVALID, SERVICE_DISABLED and
        // API_KEY_SERVICE_BLOCKED each name exactly one fix — the last
        // meaning the key is restricted to some other API, which is what
        // happens when "Places API" (legacy) is picked instead of
        // "Places API (New)".
        for (const d of parsed.error?.details ?? []) {
          if (typeof d?.reason === 'string') {
            detail = d.reason;
            break;
          }
        }
      } catch {
        /* Not JSON. The code alone still says a great deal. */
      }
      /*
       * On a key error only, say whether the stored value even has the shape
       * of a Google API key — 'AIza' followed by 35 more URL-safe characters.
       * That separates "the wrong value was pasted into the secret" from "a
       * real key Google does not recognise", which are different fixes.
       *
       * A boolean about the format every Google key shares discloses nothing
       * about this one: not its value, not its length, not any character of
       * it. The key itself is never returned or logged.
       */
      const keyShapeOk =
        detail === 'API_KEY_INVALID' ? /^AIza[0-9A-Za-z_-]{35}$/.test(key) : undefined;

      return json({
        ok: false,
        reason: 'upstream',
        upstreamCode: res.status,
        upstreamStatus: status,
        upstreamReason: detail,
        keyShapeOk,
      });
    }
    payload = (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error('reviews: Places API threw', err);
    return json({ ok: false, reason: 'upstream', upstreamCode: null });
  }

  // Read defensively. A field Google renames or omits should cost us that one
  // field, not the whole section.
  const raw = Array.isArray(payload.reviews) ? (payload.reviews as Record<string, unknown>[]) : [];
  const reviews: OutReview[] = [];
  for (const item of raw) {
    const rating = typeof item.rating === 'number' ? item.rating : 0;
    if (rating < MIN_RATING) continue;

    const text = item.text as { text?: unknown } | undefined;
    const quote = typeof text?.text === 'string' ? text.text.trim() : '';
    if (!quote) continue; // a star-only review has nothing to quote

    const author = item.authorAttribution as Record<string, unknown> | undefined;
    const name = typeof author?.displayName === 'string' ? author.displayName.trim() : '';
    if (!name) continue; // never publish a quote we cannot attribute

    reviews.push({
      name,
      rating: Math.round(rating),
      quote,
      when:
        typeof item.relativePublishTimeDescription === 'string'
          ? item.relativePublishTimeDescription
          : '',
      photo: typeof author?.photoUri === 'string' ? author.photoUri : undefined,
      uri:
        typeof item.googleMapsUri === 'string'
          ? item.googleMapsUri
          : typeof author?.uri === 'string'
            ? author.uri
            : undefined,
    });
  }

  const body = {
    ok: true,
    /** The true average across every review, filtered or not. */
    rating: typeof payload.rating === 'number' ? payload.rating : null,
    /** The true number of reviews, filtered or not. */
    total: typeof payload.userRatingCount === 'number' ? payload.userRatingCount : null,
    /** Where to read all of them. */
    href: typeof payload.googleMapsUri === 'string' ? payload.googleMapsUri : null,
    minRating: MIN_RATING,
    reviews,
  };

  const response = json(body, CACHE_SECONDS);
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};

export const onRequest = async (context: PagesContext): Promise<Response> => {
  if (context.request.method === 'GET') return handleGet(context);
  return new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } });
};
