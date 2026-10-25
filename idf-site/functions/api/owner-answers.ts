/**
 * POST /api/owner-answers: Shawn's answers from the hidden /chat-answers/ page.
 *
 * The page exists so the owner can answer the chat questionnaire from a text
 * message link, on his phone, without an account anywhere. Each send is kept
 * whole in R2 under owner-answers/ and emailed as one readable table. He can
 * send more than once; the newest email is the current set.
 *
 * Settings (Cloudflare Pages):
 *   OWNER_ANSWERS_TO  optional; who gets the email, comma-separated. Falls back
 *                     to NOTIFY_TO, then to the same inbox as estimates.
 *   RESEND_API_KEY and NOTIFY_FROM, already set for the estimate form.
 *
 * The page is public but unlisted, so this is guarded like the other public
 * endpoints: a honeypot, a per-IP throttle, and nothing accepted except the 49
 * known question ids with bounded text.
 */
import { ownerQuestions, ownerQuestionId } from '../../src/content/owner-questions';

interface R2Bucket {
  put(key: string, value: string, options?: unknown): Promise<unknown>;
}
interface Env {
  ESTIMATE_UPLOADS?: R2Bucket;
  RESEND_API_KEY?: string;
  NOTIFY_FROM?: string;
  NOTIFY_TO?: string;
  OWNER_ANSWERS_TO?: string;
}
interface PagesContext {
  request: Request;
  env: Env;
}

/* Same inbox estimate.ts falls back to; see DEFAULT_NOTIFY_TO there. */
const DEFAULT_TO = 'interiordesignflooring@gmail.com';
const MAX_TEXT = 1000;
const MODES = new Set(['draft', 'alt', 'own', 'skip']);

const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 5;
const recent = new Map<string, number[]>();
const throttled = (ip: string | null): boolean => {
  if (!ip) return false;
  const now = Date.now();
  if (recent.size > 5000) recent.clear();
  const hits = (recent.get(ip) ?? []).filter((at) => now - at <= WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_IN_WINDOW;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : '');

type Answer = { mode: string; reply: string };

export const onRequest = async ({ request, env }: PagesContext): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }
  if (throttled(request.headers.get('CF-Connecting-IP'))) {
    return json({ ok: false, error: 'Too many sends in a minute. Wait a moment and try again.' }, 429);
  }

  let body: { answers?: Record<string, { mode?: unknown; reply?: unknown }>; name?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'That send was not readable. Try again.' }, 400);
  }
  /* Honeypot: a bot fills every field. Pretend it worked. */
  if (clean(body.website)) return json({ ok: true });

  const answers: Record<string, Answer> = {};
  for (const q of ownerQuestions) {
    const raw = body.answers?.[ownerQuestionId(q.n)];
    if (!raw || typeof raw.mode !== 'string' || !MODES.has(raw.mode)) continue;
    const reply = raw.mode === 'skip' ? '' : clean(raw.reply);
    if (raw.mode !== 'skip' && !reply) continue;
    answers[ownerQuestionId(q.n)] = { mode: raw.mode, reply };
  }
  const count = Object.keys(answers).length;
  if (count === 0) return json({ ok: false, error: 'There are no answers to send yet.' }, 400);

  const name = clean(body.name).slice(0, 80) || 'Shawn';
  const now = new Date();
  const record = { receivedAt: now.toISOString(), name, answered: count, answers };

  if (env.ESTIMATE_UPLOADS) {
    const key = `owner-answers/${now.toISOString().replace(/[:.]/g, '-')}.json`;
    try {
      await env.ESTIMATE_UPLOADS.put(key, JSON.stringify(record, null, 2), {
        httpMetadata: { contentType: 'application/json' },
      });
    } catch (err) {
      console.error('owner-answers: could not store', err);
    }
  }

  if (!env.RESEND_API_KEY) {
    console.log('owner-answers (no RESEND_API_KEY):', JSON.stringify(record));
    return json({ ok: true, answered: count });
  }

  const cell = 'padding:8px 10px;border-top:1px solid #E0D6C3;vertical-align:top';
  const rows = ownerQuestions
    .map((q) => {
      const a = answers[ownerQuestionId(q.n)];
      const reply = !a
        ? '<i style="color:#8A8173">Not answered</i>'
        : a.mode === 'skip'
          ? '<i style="color:#8A8173">Have them call us</i>'
          : escapeHtml(a.reply);
      return `<tr><td style="${cell};color:#6B6660">${q.n}</td><td style="${cell}"><b>${escapeHtml(q.q)}</b></td><td style="${cell}">${reply}</td></tr>`;
    })
    .join('');
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#14110D">` +
    `<p>${escapeHtml(name)} answered ${count} of ${ownerQuestions.length} chat questions.</p>` +
    `<p style="color:#6B6660;font-size:13px">If more than one of these emails arrives, the newest is the current set. ` +
    `Nothing is live in the chat until it is added and approved.</p>` +
    `<table style="border-collapse:collapse;width:100%"><tr><th></th><th align="left" style="padding:6px 10px">Customer asks</th>` +
    `<th align="left" style="padding:6px 10px">Chat replies</th></tr>${rows}</table></div>`;

  const to = (env.OWNER_ANSWERS_TO || env.NOTIFY_TO || DEFAULT_TO).split(',').map((a) => a.trim()).filter(Boolean);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || 'Website <onboarding@resend.dev>',
      to,
      subject: `Chat answers from ${name}: ${count} of ${ownerQuestions.length}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error('owner-answers: Resend failed', res.status, await res.text());
    /* Stored in R2 already when the binding exists, so the answers are not lost. */
    return json({ ok: true, answered: count, emailed: false });
  }
  return json({ ok: true, answered: count, emailed: true });
};
