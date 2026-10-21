/**
 * POST /api/chat-feedback: a visitor's thumbs up or down on one assistant answer.
 *
 * Retrieval mode can only go wrong one way: the model picks the wrong approved
 * answer. The visitor is the only one who sees that happen, so the thumbs are
 * how a wrong match reaches the owners. Each vote is written to R2 under
 * chat-feedback/, beside chat-unanswered/, and the weekly digest
 * (/api/chat-digest) reads both.
 *
 * What is stored is what is needed to fix a match and nothing else: the
 * question as typed, the id of the answer it got, the vote, the page and the
 * language. No IP, no session, nothing that says who asked.
 */
import { faqById } from '../../src/content/faq-catalog';

interface R2Bucket {
  put(key: string, value: string, options?: unknown): Promise<unknown>;
}

interface Env {
  ESTIMATE_UPLOADS?: R2Bucket;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const MAX_QUESTION = 500;

/* Same shape as the chat endpoint's throttle: per isolate, best effort, there
   to stop one script filling the bucket rather than to count exactly. */
const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 10;
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

const noContent = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

export const onRequest = async ({ request, env }: PagesContext): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }
  if (throttled(request.headers.get('CF-Connecting-IP'))) return noContent();

  let body: { vote?: unknown; id?: unknown; question?: unknown; page?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const vote = body.vote === 'up' || body.vote === 'down' ? body.vote : null;
  const id = typeof body.id === 'string' && faqById.has(body.id) ? body.id : null;
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  const page = String(body.page ?? '').split(/[?#]/)[0].slice(0, 200);

  /* Malformed votes are dropped quietly, with the same 204, as /api/event does. */
  if (!vote || !id || !question || !page.startsWith('/')) return noContent();

  if (!env.ESTIMATE_UPLOADS) {
    console.log(`chat-feedback (no R2 binding): ${vote} ${id}`);
    return noContent();
  }

  const now = new Date();
  const key =
    `chat-feedback/${now.toISOString().slice(0, 7)}/` +
    `${now.toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}.json`;
  try {
    await env.ESTIMATE_UPLOADS.put(
      key,
      JSON.stringify(
        { receivedAt: now.toISOString(), vote, id, question, page, lang: body.lang === 'es' ? 'es' : 'en' },
        null,
        2,
      ),
      { httpMetadata: { contentType: 'application/json' } },
    );
  } catch (err) {
    console.error('Could not store chat feedback', err);
  }
  return noContent();
};
