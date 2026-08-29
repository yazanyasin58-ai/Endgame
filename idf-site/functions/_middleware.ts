/**
 * Site-wide access gate.
 *
 * Pages runs this before every request — pages, assets and /api/estimate
 * alike — so nothing behind it is reachable without the password. It exists
 * because the site is not ready to be public: the preview URLs are guessable
 * enough to matter, and "unlisted" is not the same as "private".
 *
 * Two things control it, and they are deliberately different in kind:
 *
 *   GATE_ENABLED   a constant in this file, committed to the repository
 *   SITE_PASSWORD  a secret, set in the Pages project, never in the repo
 *
 * Splitting them that way is the point. If the gate were controlled by the
 * presence of the secret alone, then losing the variable — a settings change,
 * a new environment, a typo — would silently publish the whole site and
 * nothing in the repository would show that anything had changed. Instead:
 *
 *   GATE_ENABLED false                  → open, and the repo says so
 *   GATE_ENABLED true, password set     → gated
 *   GATE_ENABLED true, password missing → 503, closed, with an explanation
 *
 * The last line is the one that matters. A gate whose failure mode is "open"
 * is not a gate. AT LAUNCH: set GATE_ENABLED to false in a commit, so the
 * change to a public site is a reviewable line of code rather than a
 * dashboard toggle nobody can see afterwards.
 *
 * What this is NOT: it is a shared password, so it proves someone knows the
 * password, not who they are. If you need per-person access with a real
 * identity behind it, Cloudflare Access does that properly — see CLOUDFLARE.md.
 * Do not run both at once, or visitors are asked to log in twice.
 */

/*
 * Off. The site is back to an open preview at the client's request, which is
 * where it was before the gate went in.
 *
 * Note what this does NOT change: `preLaunch` in src/lib/site.ts is still
 * true, so every page keeps its noindex and robots.txt still disallows
 * everything. Open to anyone with the link, still invisible to search — which
 * is the state this was in all along.
 *
 * Set back to true to close it again; SITE_PASSWORD in the Pages project is
 * all it needs.
 */
const GATE_ENABLED = false;

/** Shown in the browser's password prompt. */
const REALM = 'Interior Design Flooring — private preview';

interface Env {
  /**
   * The password. Set in the Pages project as an encrypted variable, for both
   * Production and Preview. Anything non-empty works; a long random string is
   * better than a memorable one, since it is shared rather than personal.
   */
  SITE_PASSWORD?: string;
  /** Optional username. Most browsers show the field regardless; default 'idf'. */
  SITE_USER?: string;
}

interface MiddlewareContext {
  request: Request;
  env: Env;
  next(): Promise<Response>;
}

/**
 * Compares without leaking where two strings diverge through timing.
 * Length is compared first and separately — that much is observable anyway
 * from the encoded credential's own length.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized(): Response {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'www-authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

function misconfigured(): Response {
  return new Response(
    'This site is closed to visitors and SITE_PASSWORD is not set, so nobody can be let ' +
      'in. Set SITE_PASSWORD in the Cloudflare Pages project (Settings > Variables and ' +
      'Secrets, for both Production and Preview) and redeploy.',
    {
      status: 503,
      headers: {
        'cache-control': 'no-store',
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
      },
    },
  );
}

export const onRequest = async (context: MiddlewareContext): Promise<Response> => {
  if (!GATE_ENABLED) return context.next();

  const password = context.env.SITE_PASSWORD;
  if (!password) return misconfigured();

  const header = context.request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (!encoded || scheme.toLowerCase() !== 'basic') return unauthorized();

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  // Only the first colon separates the two — a password may contain colons.
  const separator = decoded.indexOf(':');
  if (separator === -1) return unauthorized();
  const user = decoded.slice(0, separator);
  const supplied = decoded.slice(separator + 1);

  const expectedUser = context.env.SITE_USER || 'idf';
  if (!safeEqual(user, expectedUser) || !safeEqual(supplied, password)) return unauthorized();

  // Past the gate. Everything behind it stays out of caches and indexes: a
  // shared proxy must not hold a copy of a page it should not have fetched.
  const response = await context.next();
  const gated = new Response(response.body, response);
  gated.headers.set('cache-control', 'no-store, private');
  gated.headers.set('x-robots-tag', 'noindex, nofollow');
  return gated;
};
