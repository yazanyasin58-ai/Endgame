/**
 * POST /api/event — counts contact-link taps and form sends.
 *
 * The browser half is src/scripts/track.ts. Each event is a kind (call, text,
 * email, form), the page it happened on, and for forms which form it was. No
 * IP address, no user-agent, nothing that identifies a person is written:
 * the privacy policy says so, and this file is what keeps it true.
 *
 * Events go to Workers Analytics Engine through a binding named LEAD_EVENTS.
 * Without the binding the endpoint still answers, and logs the event instead,
 * so the site never breaks over a missing setting. CLOUDFLARE.md § 3c has the
 * binding steps and the query that turns these into "leads per page".
 */

interface AnalyticsEngineDataset {
  writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

interface Env {
  LEAD_EVENTS?: AnalyticsEngineDataset;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const KINDS = new Set(['call', 'text', 'email', 'form']);
const FORM_LABELS = new Set(['estimate', 'popup', 'chat', 'listing', '']);

const noContent = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

export const onRequest = async ({ request, env }: PagesContext): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }

  let body: { kind?: unknown; page?: unknown; label?: unknown };
  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const kind = String(body.kind ?? '');
  // A path on this site, nothing else: no query strings (they can carry
  // personal details from a mistyped link) and nothing that is not a path.
  const page = String(body.page ?? '').split(/[?#]/)[0].slice(0, 200);
  const rawLabel = String(body.label ?? '').toLowerCase();
  // The listing form's enquiry is "Property listing". Anything else unknown
  // folds into "other", so the label can never carry what a visitor typed.
  const label = FORM_LABELS.has(rawLabel) ? rawLabel : rawLabel.includes('listing') ? 'listing' : 'other';

  // Anything malformed is dropped quietly. A 204 either way, so a script
  // probing the endpoint learns nothing from the answer.
  if (!KINDS.has(kind) || !page.startsWith('/')) return noContent();

  if (env.LEAD_EVENTS) {
    env.LEAD_EVENTS.writeDataPoint({ blobs: [kind, page, label], doubles: [1], indexes: [kind] });
  } else {
    console.log(`event (no LEAD_EVENTS binding): ${kind} ${page} ${label}`);
  }
  return noContent();
};
