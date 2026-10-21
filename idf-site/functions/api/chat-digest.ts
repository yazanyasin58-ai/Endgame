/**
 * POST /api/chat-digest: the weekly email of what the assistant could not answer.
 *
 * The assistant only says approved text, so the way it gets better is someone
 * reading the questions it missed and approving an answer. Those questions
 * are already in R2 (chat-unanswered/, written by /api/chat), as are the
 * thumbs-down votes (chat-feedback/, written by /api/chat-feedback). This
 * gathers the last seven days of both into one email.
 *
 * Each missed question comes with a SUGGESTED reply drafted by Workers AI.
 * That draft goes to the person approving, never to a visitor: it is marked
 * as a draft, it is told to leave ___ wherever a fact is needed, and nothing
 * reaches the assistant until someone copies an answer into chat-replies.ts.
 *
 * Called once a week by .github/workflows/chat-digest.yml. Pages Functions
 * have no schedule of their own, so the schedule lives in GitHub Actions and
 * this endpoint is protected by a shared secret instead.
 *
 * Settings (Cloudflare Pages, both environments as needed):
 *   DIGEST_TOKEN   required; the same value as the CHAT_DIGEST_TOKEN secret
 *                  in GitHub. Without it the endpoint refuses everything.
 *   DIGEST_TO      required; who gets the email, comma-separated.
 *   RESEND_API_KEY and NOTIFY_FROM, already set for the estimate form.
 *
 * POST ?dry=1 returns what would be sent as JSON and sends nothing.
 */
import { business, hours, hoursLabel } from '../../src/content/idf';
import { faqById } from '../../src/content/faq-catalog';

interface R2Object {
  key: string;
  uploaded: Date;
}
interface R2Bucket {
  list(options: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
  }>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
}
interface AiBinding {
  run(
    model: string,
    inputs: { messages: { role: string; content: string }[]; max_tokens?: number; temperature?: number },
  ): Promise<{ response?: unknown }>;
}
interface Env {
  ESTIMATE_UPLOADS?: R2Bucket;
  AI?: AiBinding;
  DIGEST_TOKEN?: string;
  DIGEST_TO?: string;
  RESEND_API_KEY?: string;
  NOTIFY_FROM?: string;
}
interface PagesContext {
  request: Request;
  env: Env;
}

const DAYS = 7;
/** Enough for a busy week, and a ceiling on model calls and email length. */
const MAX_ITEMS = 60;
const MAX_DRAFTS = 25;
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Constant time, so the token cannot be found a character at a time. */
const sameText = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/** This month's and last month's folder, which between them hold any seven days. */
const monthPrefixes = (root: string, now: Date) => {
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return [`${root}/${now.toISOString().slice(0, 7)}/`, `${root}/${last.toISOString().slice(0, 7)}/`];
};

const readRecent = async <T>(bucket: R2Bucket, root: string, since: number, now: Date): Promise<T[]> => {
  const keys: string[] = [];
  for (const prefix of monthPrefixes(root, now)) {
    let cursor: string | undefined;
    do {
      const page = await bucket.list({ prefix, cursor, limit: 500 });
      for (const obj of page.objects) if (obj.uploaded.getTime() >= since) keys.push(obj.key);
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor && keys.length < MAX_ITEMS * 4);
  }
  const out: T[] = [];
  for (const key of keys.sort().reverse().slice(0, MAX_ITEMS * 4)) {
    const obj = await bucket.get(key);
    if (!obj) continue;
    try {
      out.push(JSON.parse(await obj.text()) as T);
    } catch {
      /* a record that is not JSON is skipped, not fatal */
    }
  }
  return out;
};

const DRAFT_PROMPT = [
  `You draft replies for the website assistant of ${business.name}, a licensed general contractor`,
  `in Sterling, Virginia (phone ${business.phonePrimary}, showroom at ${business.address}).`,
  `Hours: ${hours.map((h) => `${h.days} ${hoursLabel(h)}`).join('; ')}.`,
  '',
  'Write ONE reply of at most two short sentences to the visitor question you are given.',
  'This is a draft for the owner to approve, so wherever you would need a fact you were not',
  'given (a price, a timescale, a warranty, a licence, a policy), write ___ instead of guessing.',
  'Never state a price, never mention insurance coverage or a deductible, never offer to deal',
  'with an insurance company, never promise a date. Reply with the sentence only.',
].join('\n');

const draftReply = async (ai: AiBinding, question: string): Promise<string> => {
  try {
    const result = await ai.run(MODEL, {
      messages: [
        { role: 'system', content: DRAFT_PROMPT },
        { role: 'user', content: question },
      ],
      max_tokens: 120,
      temperature: 0.2,
    });
    return typeof result.response === 'string' ? result.response.trim() : '';
  } catch (err) {
    console.error('chat-digest: draft failed', err);
    return '';
  }
};

type Unanswered = { receivedAt: string; question: string; page: string | null; lang?: string };
type Vote = { receivedAt: string; vote: 'up' | 'down'; id: string; question: string; page: string; lang?: string };

export const onRequest = async ({ request, env }: PagesContext): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }
  if (!env.DIGEST_TOKEN) return json({ ok: false, error: 'DIGEST_TOKEN is not set.' }, 503);
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!sameText(given, env.DIGEST_TOKEN)) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!env.ESTIMATE_UPLOADS) return json({ ok: false, error: 'No R2 binding named ESTIMATE_UPLOADS.' }, 503);

  const now = new Date();
  const since = now.getTime() - DAYS * 86_400_000;
  const dry = new URL(request.url).searchParams.get('dry') === '1';

  const unanswered = await readRecent<Unanswered>(env.ESTIMATE_UPLOADS, 'chat-unanswered', since, now);
  const votes = await readRecent<Vote>(env.ESTIMATE_UPLOADS, 'chat-feedback', since, now);

  /* The same question asked five times is one row with a count. */
  const grouped = new Map<string, { question: string; count: number; pages: Set<string>; spanish: boolean }>();
  for (const item of unanswered) {
    const question = String(item.question ?? '').trim();
    if (!question) continue;
    const key = question.toLowerCase().replace(/\s+/g, ' ');
    const row = grouped.get(key) ?? { question, count: 0, pages: new Set<string>(), spanish: false };
    row.count += 1;
    if (item.page) row.pages.add(item.page);
    if (item.lang === 'es') row.spanish = true;
    grouped.set(key, row);
  }
  const missed = [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, MAX_ITEMS);

  const drafts: string[] = [];
  for (const [index, row] of missed.entries()) {
    drafts.push(env.AI && index < MAX_DRAFTS ? await draftReply(env.AI, row.question) : '');
  }

  const up = votes.filter((v) => v.vote === 'up').length;
  const down = votes.filter((v) => v.vote === 'down');

  const summary = {
    from: new Date(since).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    missed: missed.map((row, i) => ({
      question: row.question,
      count: row.count,
      pages: [...row.pages],
      spanish: row.spanish,
      draft: drafts[i] || null,
    })),
    votes: { up, down: down.length },
    downvoted: down.map((v) => ({ question: v.question, answeredWith: faqById.get(v.id)?.q ?? v.id, page: v.page })),
  };

  if (dry) return json({ ok: true, dry: true, ...summary });
  if (missed.length === 0 && down.length === 0) return json({ ok: true, sent: false, reason: 'Nothing new this week.', ...summary });

  const to = (env.DIGEST_TO ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  if (!to.length) return json({ ok: false, error: 'DIGEST_TO is not set.' }, 503);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'RESEND_API_KEY is not set.' }, 503);

  const cell = 'padding:8px 10px;border-top:1px solid #E0D6C3;vertical-align:top';
  const missedRows = summary.missed
    .map(
      (row) =>
        `<tr><td style="${cell}"><b>${escapeHtml(row.question)}</b>` +
        `<div style="color:#6B6660;font-size:12px">${row.count}× · ${escapeHtml(row.pages.join(', ') || 'page unknown')}` +
        `${row.spanish ? ' · asked in Spanish' : ''}</div></td>` +
        `<td style="${cell};color:#3A342A">${row.draft ? escapeHtml(row.draft) : '<i>No draft</i>'}</td></tr>`,
    )
    .join('');
  const downRows = summary.downvoted
    .map(
      (row) =>
        `<tr><td style="${cell}">${escapeHtml(row.question)}</td>` +
        `<td style="${cell};color:#6B6660">${escapeHtml(row.answeredWith)}</td></tr>`,
    )
    .join('');

  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#14110D">` +
    `<p>The website assistant, ${summary.from} to ${summary.to}.</p>` +
    (missed.length
      ? `<h3 style="margin:18px 0 6px">${missed.length} question(s) it could not answer</h3>` +
        `<p style="color:#6B6660;font-size:13px;margin:0 0 8px">The drafts are suggestions written by AI for you to check. ` +
        `None of them is live until it is approved and added to the chatbot answer sheet.</p>` +
        `<table style="border-collapse:collapse;width:100%"><tr><th align="left" style="padding:6px 10px">Question</th>` +
        `<th align="left" style="padding:6px 10px">Suggested reply (draft)</th></tr>${missedRows}</table>`
      : '') +
    `<h3 style="margin:18px 0 6px">Answer ratings</h3><p>${up} helpful, ${down.length} not helpful.</p>` +
    (down.length
      ? `<table style="border-collapse:collapse;width:100%"><tr><th align="left" style="padding:6px 10px">Question</th>` +
        `<th align="left" style="padding:6px 10px">Answered with</th></tr>${downRows}</table>`
      : '') +
    `</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || 'Website assistant <onboarding@resend.dev>',
      to,
      subject: `Website assistant: ${missed.length} unanswered, ${down.length} not helpful (week to ${summary.to})`,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error('chat-digest: Resend failed', res.status, detail);
    return json({ ok: false, error: `Resend returned ${res.status}.` }, 502);
  }
  return json({ ok: true, sent: true, to: to.length, missed: missed.length, downvoted: down.length });
};
