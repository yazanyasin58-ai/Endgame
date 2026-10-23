/**
 * Lead counting: which pages lead people to get in touch.
 *
 * Cloudflare Web Analytics already counts page views, but it has no events, so
 * it cannot say which pages end in a call, a text or a form. Two things here
 * fill that gap, and neither identifies anyone:
 *
 *   Taps and sends  A tap on a tel:, sms: or mailto: link, or a form that
 *                   sends successfully, is reported to /api/event as a kind
 *                   and the page it happened on. Nothing else. The function
 *                   writes it to Workers Analytics Engine (see CLOUDFLARE.md).
 *
 *   Lead source     The first page of the visit and the site that sent the
 *                   visitor are kept in sessionStorage, and a form submission
 *                   carries them, with the page it was sent from, as three
 *                   extra fields. They appear in the notification email, so
 *                   each lead says where it came from without any dashboard.
 *
 * The privacy policy describes both. Change it if either changes.
 */

const LANDING = 'idf-landing';

type Landing = { page: string; referrer: string };

/** The referring site's host, or '' for direct visits and our own pages. */
function externalReferrer(): string {
  try {
    if (!document.referrer) return '';
    const host = new URL(document.referrer).hostname;
    return host === location.hostname ? '' : host;
  } catch {
    return '';
  }
}

/**
 * Records the first page of the visit. Every page calls this; only the first
 * call in a tab's session writes. Storage can be refused (private windows,
 * blocked site data), and then the form simply goes without it.
 */
export function rememberLanding(): void {
  try {
    if (sessionStorage.getItem(LANDING)) return;
    const value: Landing = { page: location.pathname, referrer: externalReferrer() };
    sessionStorage.setItem(LANDING, JSON.stringify(value));
  } catch {
    /* No storage, no landing page. The form still sends. */
  }
}

function landing(): Landing {
  try {
    const raw = sessionStorage.getItem(LANDING);
    if (raw) return JSON.parse(raw) as Landing;
  } catch {
    /* Fall through to what this page knows. */
  }
  return { page: location.pathname, referrer: externalReferrer() };
}

/**
 * Adds the lead-source fields to a form body. `set`, not `append`, so a form
 * that is sent twice after a failure does not carry them twice.
 */
export function withSource(body: FormData): FormData {
  const first = landing();
  body.set('page', location.pathname);
  body.set('landing', first.page);
  if (first.referrer) body.set('referrer', first.referrer);
  return body;
}

export type LeadEvent = 'call' | 'text' | 'email' | 'form' | 'chat';

/**
 * Reports one event. sendBeacon because a tap on tel: can hand the page to
 * the phone app straight away, and a beacon is the one request the browser
 * promises to finish when that happens. Failure is silent by design: counting
 * must never get in the way of the call itself.
 */
export function track(kind: LeadEvent, label = ''): void {
  try {
    const body = JSON.stringify({ kind, page: location.pathname, label });
    const blob = new Blob([body], { type: 'application/json' });
    if (!navigator.sendBeacon?.('/api/event', blob)) {
      void fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* Ignore. */
  }
}

const KIND_BY_SCHEME: Record<string, LeadEvent> = {
  'tel:': 'call',
  'sms:': 'text',
  'mailto:': 'email',
};

/**
 * One listener for every contact link on the page, including ones added
 * later (the chat panel, the pop-up), so no component has to remember to
 * wire itself up. Capture phase, so a component that stops propagation on
 * its own links is still counted.
 */
export function initTracking(): void {
  rememberLanding();
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const kind = KIND_BY_SCHEME[link.protocol];
      if (kind) track(kind);
    },
    { capture: true },
  );
}
