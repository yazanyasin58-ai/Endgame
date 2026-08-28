/**
 * POST /api/estimate — the estimate form's backend.
 *
 * A Cloudflare Pages Function. The site itself stays a static build; this file
 * is the only server-side code, and Pages runs it at the edge for the one
 * route it owns. It does three things, in this order, and any one of them can
 * be absent without taking the form down:
 *
 *   1. Verifies a Turnstile token, if TURNSTILE_SECRET is set.
 *   2. Writes the submission and its photographs to R2, if the bucket is bound.
 *   3. Emails the owner through Resend, if RESEND_API_KEY is set.
 *
 * With nothing configured at all the endpoint still validates and returns a
 * reference, so a half-configured project fails loudly in the logs rather than
 * silently dropping a customer. See CLOUDFLARE.md for what to set where.
 */

interface R2Bucket {
  put(key: string, value: ArrayBuffer | string, options?: unknown): Promise<unknown>;
}

interface Env {
  /** R2 binding. Named ESTIMATE_UPLOADS in the Pages project settings. */
  ESTIMATE_UPLOADS?: R2Bucket;
  /** Turnstile secret key. Omit to run without spam protection. */
  TURNSTILE_SECRET?: string;
  /** Resend API key. Omit and nothing is emailed — submissions land in R2 only. */
  RESEND_API_KEY?: string;
  /** Where the notification goes. Defaults to the address on the site. */
  NOTIFY_TO?: string;
  /**
   * Envelope sender. Must be on a domain verified in Resend. Until the real
   * domain is verified, Resend's own onboarding@resend.dev works for testing.
   */
  NOTIFY_FROM?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

const MAX_FILES = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — a phone photograph, comfortably
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_EMAIL_ATTACHMENT_BYTES = 15 * 1024 * 1024; // Resend's ceiling is 40MB; stay well under

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf']);

/** Fields the form posts. Anything else in the body is ignored. */
const TEXT_FIELDS = [
  // Which form this came from. The estimate form omits it; the listing form
  // sets it. Anything else a client sends is ignored, as with every field
  // here — the allowlist is what stops an arbitrary POST filling the email.
  'enquiry',
  'name',
  'phone',
  'email',
  'address',
  'type',
  'propertyType',
  'budget',
  'timeframe',
  'details',
  'source',
] as const;

const REQUIRED_FIELDS = ['name', 'phone', 'email', 'address', 'type'] as const;

const LABELS: Record<string, string> = {
  enquiry: 'Enquiry type',
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  type: 'Type of work',
  propertyType: 'Property type',
  budget: 'Budget range',
  timeframe: 'Timeframe',
  details: 'Details',
  source: 'Heard about us via',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

/** A short, human-readable reference the customer can quote on the phone. */
function makeReference(now: Date): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `IDF-${stamp}-${rand}`;
}

/** Strip anything that could escape the key prefix or confuse a mail client. */
function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'upload';
  return base.replace(/[^A-Za-z0-9._-]/g, '_').slice(-100) || 'upload';
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * A short single-line subject, whatever the customer typed.
 *
 * The lead word tells the reader which form it came from before they open it:
 * an estimate request and a property listing go to different people.
 */
function subjectLine(fields: Record<string, string>, reference: string): string {
  const clean = (v: string, max: number) => v.replace(/\s+/g, ' ').trim().slice(0, max);
  const kind = clean(fields.enquiry, 30) || 'Estimate request';
  const who = clean(fields.name, 60) || 'New enquiry';
  const what = clean(fields.type, 40);
  return what ? `${kind} — ${who} — ${what}` : `${kind} — ${who} — ${reference}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Base64 without blowing the stack on a multi-megabyte photograph. */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const result = (await res.json()) as { success?: boolean };
  return result.success === true;
}

const handlePost = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Could not read the form. Please try again.' }, 400);
  }

  // Honeypot. Bots fill every field they find; a real browser never sees this
  // one. Answer as if it worked so the bot does not learn to adapt.
  if (String(form.get('company') ?? '').trim() !== '') {
    return json({ ok: true, reference: makeReference(new Date()) });
  }

  if (env.TURNSTILE_SECRET) {
    const token = String(form.get('cf-turnstile-response') ?? '');
    const ip = request.headers.get('CF-Connecting-IP');
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, ip))) {
      return json(
        { ok: false, error: 'We could not verify that request came from a browser. Please reload and try again.' },
        400,
      );
    }
  }

  const fields: Record<string, string> = {};
  for (const key of TEXT_FIELDS) {
    fields[key] = String(form.get(key) ?? '').trim().slice(0, 4000);
  }

  const missing = REQUIRED_FIELDS.filter((key) => fields[key] === '');
  if (missing.length > 0) {
    return json(
      { ok: false, error: `Please fill in: ${missing.map((k) => LABELS[k]).join(', ')}.` },
      400,
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400);
  }

  const uploads = form
    .getAll('photos')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (uploads.length > MAX_FILES) {
    return json({ ok: false, error: `Please attach at most ${MAX_FILES} files.` }, 400);
  }

  let total = 0;
  for (const file of uploads) {
    const ext = extensionOf(file.name);
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return json(
        { ok: false, error: `${file.name} is not a photo or PDF. Please attach JPG, PNG, WEBP, HEIC or PDF.` },
        400,
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return json({ ok: false, error: `${file.name} is over 10 MB. Please send that one by text or email.` }, 400);
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) {
    return json({ ok: false, error: 'Those files come to more than 40 MB in total. Please send fewer at a time.' }, 400);
  }

  // Photographs are the part a customer cannot easily re-send, so refuse the
  // submission outright rather than accept it and drop them.
  if (uploads.length > 0 && !env.ESTIMATE_UPLOADS) {
    return json(
      {
        ok: false,
        error:
          'File uploads are not switched on yet. Please submit without photos and text or email them instead — the form shows both.',
      },
      503,
    );
  }

  const now = new Date();
  const reference = makeReference(now);
  const prefix = `estimates/${now.toISOString().slice(0, 7)}/${reference}`;

  const stored: { key: string; name: string; size: number; type: string; body: ArrayBuffer }[] = [];
  for (const [index, file] of uploads.entries()) {
    const name = safeFilename(file.name);
    const key = `${prefix}/${String(index + 1).padStart(2, '0')}-${name}`;
    const body = await file.arrayBuffer();
    await env.ESTIMATE_UPLOADS!.put(key, body, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { reference, submittedBy: fields.email },
    });
    stored.push({ key, name, size: file.size, type: file.type, body });
  }

  const record = {
    reference,
    receivedAt: now.toISOString(),
    ...fields,
    photos: stored.map(({ key, name, size, type }) => ({ key, name, size, type })),
    ip: request.headers.get('CF-Connecting-IP') ?? null,
    userAgent: request.headers.get('User-Agent') ?? null,
  };

  if (env.ESTIMATE_UPLOADS) {
    await env.ESTIMATE_UPLOADS.put(`${prefix}/submission.json`, JSON.stringify(record, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  if (env.RESEND_API_KEY) {
    const to = env.NOTIFY_TO || 'interiordesignflooring@gmail.com';
    const from = env.NOTIFY_FROM || 'Estimate Form <onboarding@resend.dev>';

    const rows = TEXT_FIELDS.filter((key) => fields[key] !== '')
      .map(
        (key) =>
          `<tr><td style="padding:6px 14px 6px 0;vertical-align:top;color:#6B6660;white-space:nowrap">${LABELS[key]}</td>` +
          `<td style="padding:6px 0;vertical-align:top;color:#14110D">${escapeHtml(fields[key]).replace(/\n/g, '<br>')}</td></tr>`,
      )
      .join('');

    // Attach what fits; anything larger stays in R2 and is named in the email.
    const attachments: { filename: string; content: string }[] = [];
    let attached = 0;
    const overflow: string[] = [];
    for (const file of stored) {
      if (attached + file.size <= MAX_EMAIL_ATTACHMENT_BYTES) {
        attachments.push({ filename: file.name, content: toBase64(file.body) });
        attached += file.size;
      } else {
        overflow.push(file.key);
      }
    }

    const photoNote = stored.length
      ? `<p style="color:#6B6660;font-size:13px">${stored.length} file(s) attached to this request.` +
        (overflow.length
          ? ` ${overflow.length} too large to attach — in R2 under <code>${escapeHtml(prefix)}/</code>.`
          : '') +
        `</p>`
      : '<p style="color:#6B6660;font-size:13px">No files attached.</p>';

    const send = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: fields.email,
        // Fields are capped at 4000 characters for the body; a subject line is
        // not the place for that, and long subjects get truncated or flagged
        // by mail clients. Collapse whitespace and keep it short.
        subject: subjectLine(fields, reference),
        html:
          `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">` +
          `<p style="color:#6B6660;font-size:13px;margin:0 0 14px">Reference ${reference} · ${now.toUTCString()}</p>` +
          `<table style="border-collapse:collapse">${rows}</table>` +
          photoNote +
          `</div>`,
        attachments,
      }),
    }).then(async (res) => {
      if (!res.ok) console.error('Resend failed', res.status, await res.text());
    });

    // The customer should not wait on the mail API, and a mail failure must not
    // fail a submission already durably in R2.
    context.waitUntil(send.catch((err) => console.error('Resend threw', err)));
  } else {
    console.warn(`No RESEND_API_KEY set — ${reference} stored but nobody was emailed.`);
  }

  return json({ ok: true, reference });
};

/**
 * Single entry point. Pages would route onRequestPost on its own, but keeping
 * one export makes the 405 for every other method explicit rather than a
 * framework default.
 */
export const onRequest = async (context: PagesContext): Promise<Response> => {
  if (context.request.method === 'POST') return handlePost(context);
  return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
};
