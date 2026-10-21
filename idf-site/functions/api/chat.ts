/**
 * POST /api/chat, the assistant endpoint, on Cloudflare Workers AI.
 *
 * Client list item 7. A Cloudflare Pages Function, same shape as the other two
 * in this directory: its own Env, its own json helper, one exported onRequest
 * with an explicit 405 rather than a framework default.
 *
 * WHAT MAKES THIS ENDPOINT DIFFERENT FROM THE OTHER TWO, and why most of the
 * code below is restraint rather than feature: every other page on this site
 * says only what the owner approved. A language model says whatever it
 * predicts next. Pointed at a contractor's site it will quote prices, promise
 * timescales, claim the company is insured and offer to handle insurance
 * claims, because that is what the text it learned from does. Several of those
 * are not style preferences here:
 *
 *   - "Do not advertise that we negotiate or settle insurance claims" is a
 *     verbatim client instruction, and in Virginia that activity is public
 *     adjusting, licensed separately. faq-safety.ts enforces the same rule on
 *     the static copy with a build guard.
 *   - A deductible must never be mentioned. Also a build guard elsewhere.
 *   - Nothing may imply a price holds. The signed estimate governs that.
 *   - No claim of being insured or bonded. There is no approved source for one,
 *     which is why the FAQ is silent on it.
 *
 * A build guard cannot reach generated text. So this endpoint does not
 * generate any: it runs in RETRIEVAL MODE. The model is shown the site's
 * approved questions, every one on /faq/ and on the twelve service pages, and
 * its whole job is to return the id of the one the visitor is asking. The
 * endpoint then sends back that entry's answer verbatim, from the same module
 * the pages render. Nothing the model writes reaches the visitor, so nothing
 * it might predict, a price, a deductible, an offer to deal with an insurer,
 * can either. The worst a wrong or manipulated id can do is show an approved
 * answer to the wrong question, and the reply names the question it is
 * answering so that is visible rather than silent.
 *
 * When no approved answer fits, the visitor gets a fixed reply pointing to
 * the phone and the estimate form, and the question is written to R2 under
 * chat-unanswered/. That queue is how the FAQ grows: the owners read what
 * people actually asked and approve answers for it, and the next deploy can
 * retrieve them.
 *
 * THE SECOND THING THAT MAKES IT DIFFERENT: every request here spends the
 * client's money at an edge model. /api/estimate costs a mail send and a few
 * kilobytes of R2; this costs tokens, from anyone on the internet, as fast as
 * they can ask. The abuse gate below the system prompt is therefore not
 * hardening added at the end, it is the condition on which the endpoint is
 * allowed to be public at all.
 */

import {
  faqCatalog,
  faqById,
  noMatchReply,
  noMatchReplyEs,
  spanishFor,
  type CatalogEntry,
} from '../../src/content/faq-catalog';
import { englishOnlyNote } from '../../src/content/chat-es';

/**
 * The Workers AI binding, declared here rather than pulled from
 * @cloudflare/workers-types, matching how estimate.ts declares R2Bucket. Only
 * the one method this file calls is described.
 */
interface AiBinding {
  run(
    model: string,
    inputs: {
      messages: ChatMessage[];
      max_tokens?: number;
      temperature?: number;
    },
  ): Promise<{ response?: unknown }>;
}

interface Env {
  /**
   * Workers AI. Bound as AI under Settings > Bindings for the environment that
   * is being deployed, which is not the same thing as saving it in the
   * dashboard afterwards: a binding is baked into a deployment when it is
   * built. On 18 October a missing RESEND_API_KEY cost most of a day for
   * exactly that reason, so this endpoint says so in its logs on every
   * request rather than failing in a way that looks like a model problem.
   */
  AI?: AiBinding;

  /**
   * Turnstile secret key, the same one /api/estimate reads. Omit and the human
   * check is skipped, matching that endpoint: a deployment without it still
   * answers rather than refusing every visitor. The public half,
   * PUBLIC_TURNSTILE_SITE_KEY, is read at build time by the widget, so the two
   * halves have to be set or unset together. The table in CLOUDFLARE.md
   * section 3 covers what each mismatch does, and it applies here too.
   */
  TURNSTILE_SECRET?: string;

  /**
   * Optional HMAC key for the chat session below. Unset, the Turnstile secret
   * is used instead, which is why this endpoint needs nothing new added to the
   * Pages project to be safe. Set it if the two jobs should ever have separate
   * keys, for instance to rotate Turnstile without ending every open chat.
   */
  CHAT_SESSION_SECRET?: string;

  /**
   * The same R2 bucket /api/estimate writes leads to, bound as
   * ESTIMATE_UPLOADS. Questions with no approved answer are queued in it under
   * chat-unanswered/, well away from estimates/, so the lead lister never
   * mistakes one for a lead. Omit and the visitor still gets the fallback
   * reply; the question is not kept, and the log says so.
   */
  ESTIMATE_UPLOADS?: R2Bucket;
}

/** Only the one method this file calls, as in estimate.ts. */
interface R2Bucket {
  put(key: string, value: string, options?: unknown): Promise<unknown>;
}

interface PagesContext {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Llama 3.3 70B, fp8-quantised, served from Cloudflare's own edge.
 *
 * Chosen on 19 October over the 8B models for the one axis that decides this
 * endpoint: holding to prohibitions it has no incentive to hold to. 70B
 * against 8B is a large jump there, and the rules in SYSTEM_PROMPT are the
 * only thing standing between generated text and a licensing problem.
 *
 * Cost, from Cloudflare's published rates: $0.293 per M input tokens and
 * $2.253 per M output. That is roughly three times Claude Haiku 5.5 per
 * token, but Workers AI gives 10,000 free Neurons a day and this model bills
 * 26,668 neurons per M input and 204,805 per M output, which at this site's
 * plausible traffic absorbs most of the bill. Staying on the AI binding also
 * means no second vendor and no API key to store and rotate, which is worth
 * more here than the last margin of instruction-following.
 *
 * Retrieval mode changes the cost shape rather than the choice. The output is
 * now a dozen tokens, an id, so the bill is almost all input, and the 70B
 * stays because routing a loosely worded question to the right one of 53 is
 * the part a smaller model gets wrong.
 *
 * THE CONTEXT WINDOW IS 24,000 TOKENS. Not 128K, not 1M. Recounted for
 * retrieval: the routing prompt lists questions only, not answers, which is
 * about 5,200 characters or 1,500 tokens; the model sees at most the last
 * ROUTE_CONTEXT_TURNS user messages, capped by MAX_CHARS_PER_MESSAGE at
 * roughly 4,000 tokens; ROUTE_MAX_TOKENS reserves 24 for the id. Well inside.
 * Putting the answers into the prompt as well would roughly triple the first
 * figure, still fits, and is the next thing to try if routing proves weak.
 */
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/**
 * Limits on one request. These bound what a single call can cost; the gate
 * further down bounds how many calls an unverified visitor gets to make.
 */
const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 4000;
const MAX_CHARS_TOTAL = 12000;

/**
 * The model sees the visitor's latest message and at most this many earlier
 * ones, user turns only. Earlier user turns are there to resolve "and for a
 * bathroom?"; the assistant's own turns are approved copy the model has no
 * need to reread, and leaving them out keeps the prompt small.
 */
const ROUTE_CONTEXT_TURNS = 3;

/** An id and its JSON braces. Anything longer is the model writing prose. */
const ROUTE_MAX_TOKENS = 24;

/**
 * The verified-visitor session, and why the gate is shaped this way.
 *
 * A Turnstile token is single-use and expires in minutes. That is right for a
 * form submitted once and useless for a chat of fifteen turns: asking the
 * visitor to tick a box before every message is not a product. So the human
 * check happens once, and what it issues is a session the client carries.
 *
 * The session is signed rather than stored. Both storage-backed shapes need a
 * binding this Pages project does not have, a KV namespace or a Durable
 * Object, and adding one is a deploy-config change rather than a code change,
 * which on 18 October is exactly the class of change that cost a day. So the
 * session holds its own expiry and its own spent-message count, and the HMAC is
 * what makes those two numbers impossible for the client to edit.
 *
 * WHAT IT BUYS: one Turnstile pass admits at most SESSION_BUDGET model calls
 * within SESSION_TTL_MS. A scripted caller has to solve a real challenge for
 * every 25 messages, which is the cost that makes grinding this endpoint
 * pointless. A genuine visitor never sees it: 25 messages is a long
 * conversation and the challenge is interaction-only.
 *
 * WHAT IT DOES NOT BUY: this is not a global rate limit. Nothing here can
 * count across isolates, so the throttle below is a partial answer and says so.
 * If this endpoint ever carries real volume the fix is a Rate Limiting binding
 * or KV, not a larger comment.
 */
const SESSION_TTL_MS = 30 * 60_000;
const SESSION_BUDGET = 25;

/**
 * A per-IP throttle inside this isolate.
 *
 * Modest about what it is. Cloudflare runs many isolates across many colos and
 * recycles them freely, so a flood spread across them is not fully counted.
 * What it does catch is the common shape, one source hammering one endpoint
 * fast, because those requests do land on the same warm isolate. It costs
 * nothing and it is not load-bearing: the signed session is.
 *
 * The map is bounded so it cannot become the leak it is guarding against.
 * Past THROTTLE_MAX_KEYS, stale entries are swept and, failing that, the whole
 * map is dropped. Losing the counts is the correct failure.
 */
const THROTTLE_WINDOW_MS = 60_000;
const THROTTLE_MAX_IN_WINDOW = 12;
const THROTTLE_MAX_KEYS = 5000;

/**
 * The routing prompt. The model's only output is an id from the list, or null.
 *
 * Questions and their topic only, not answers: enough to route on, at a
 * fraction of the tokens. The rules lean towards null on purpose. A null costs a
 * visitor one fixed sentence and adds the question to the owners' queue; a
 * stretch match answers a question they did not ask, in the company's voice.
 */
const ROUTING_PROMPT = [
  'You route questions from visitors to the website of Interior Design Flooring,',
  'a general contractor in Sterling, Virginia, to a fixed list of approved answers.',
  '',
  'Each line below is: id | topic | question.',
  '',
  ...faqCatalog.map((entry) => `${entry.id} | ${entry.topic} | ${entry.q}`),
  '',
  'Reply with JSON and nothing else: {"id":"<id>"} for the one entry whose',
  'question the visitor is asking in their LATEST message, or {"id":null}.',
  '',
  'Return null when no entry asks the same thing, when the match is only a shared',
  'topic, when the visitor wants something specific to their own project that no',
  'entry covers (a price, a date, a timescale), or when the message is not a',
  'question about the company. Earlier messages are context only, for working out',
  'what words like "it" or "that" refer to. Never return an id that is not listed.',
  '',
  'Entries whose id starts with "chat-" are things the visitor wants to DO or say',
  '(book an estimate, be called back, get the phone number, say hello or thanks).',
  'Prefer one of those over an FAQ entry when the visitor is asking for the action',
  'rather than asking a question about it.',
].join('\n');

/**
 * Read an id out of whatever the model returned.
 *
 * JSON first, as asked. Failing that, a listed id standing on its own in the
 * text, because a model that wraps its JSON in a sentence has still chosen.
 * Anything else is no match: an id this file cannot find in the catalog is
 * treated exactly like null, never passed through.
 */
const readRoute = (raw: string): CatalogEntry | null => {
  const braces = raw.match(/\{[^{}]*\}/);
  if (braces) {
    try {
      const parsed = JSON.parse(braces[0]) as { id?: unknown };
      if (parsed.id === null) return null;
      if (typeof parsed.id === 'string') return faqById.get(parsed.id.trim()) ?? null;
    } catch {
      /* fall through to the bare-id read */
    }
  }
  const bare = raw.match(/[a-z]+(?:-[a-z]+)*-\d+/g) ?? [];
  const found = bare.map((id) => faqById.get(id)).filter((e): e is CatalogEntry => !!e);
  return found.length === 1 ? found[0] : null;
};

/**
 * Queue a question nobody has approved an answer for.
 *
 * One object per question, keyed by month so a listing can be read a month at
 * a time, as estimates/ is. Stored: the question, the earlier user turns that
 * give it meaning, the page it was asked on, and what the model said, so a
 * routing miss can be told apart from a genuine gap. Not stored: the IP or
 * the user agent. Nothing in triaging a question needs to know who asked it.
 */
const queueUnanswered = async (
  bucket: R2Bucket,
  record: { question: string; earlier: string[]; page: string | null; modelOutput: string; lang: string },
): Promise<void> => {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  const key = `chat-unanswered/${now.toISOString().slice(0, 7)}/${stamp}-${suffix}.json`;
  await bucket.put(key, JSON.stringify({ receivedAt: now.toISOString(), ...record }, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });

/**
 * Narrow an unknown value to the message list we are willing to send on.
 *
 * Returns the reason on failure rather than a boolean, so the caller can tell
 * the client what was wrong with its request instead of a flat 400. A system
 * role from the client is rejected rather than ignored: silently dropping it
 * would let a caller believe it had set behaviour that it had not, and the
 * only system prompt this endpoint sends is the one above.
 */
const readMessages = (value: unknown): { messages: ChatMessage[] } | { error: string } => {
  if (!Array.isArray(value)) return { error: 'messages must be an array.' };
  if (value.length === 0) return { error: 'messages must not be empty.' };
  if (value.length > MAX_MESSAGES) {
    return { error: `messages must contain at most ${MAX_MESSAGES} entries.` };
  }

  const messages: ChatMessage[] = [];
  let total = 0;

  for (const [index, entry] of value.entries()) {
    if (typeof entry !== 'object' || entry === null) {
      return { error: `messages[${index}] must be an object.` };
    }
    const { role, content } = entry as { role?: unknown; content?: unknown };

    if (role !== 'user' && role !== 'assistant') {
      return { error: `messages[${index}].role must be "user" or "assistant".` };
    }
    if (typeof content !== 'string' || content.trim() === '') {
      return { error: `messages[${index}].content must be a non-empty string.` };
    }
    if (content.length > MAX_CHARS_PER_MESSAGE) {
      return { error: `messages[${index}].content exceeds ${MAX_CHARS_PER_MESSAGE} characters.` };
    }

    total += content.length;
    if (total > MAX_CHARS_TOTAL) {
      return { error: `messages exceed ${MAX_CHARS_TOTAL} characters in total.` };
    }

    messages.push({ role, content });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return { error: 'The last message must be from the user.' };
  }

  return { messages };
};

/* ------------------------------------------------------------------
   The abuse gate.
   ------------------------------------------------------------------ */

const encoder = new TextEncoder();

/** base64url, because a session goes in a JSON body and should not need escaping. */
const toB64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64Url = (text: string): Uint8Array | null => {
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
};

/** Constant time, so a signature cannot be found one byte at a time. */
const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
};

const sign = async (secret: string, body: string): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
};

/** `spent` is how many model calls this session has already paid for. */
const mintSession = async (secret: string, spent: number): Promise<string> => {
  const body = toB64Url(encoder.encode(JSON.stringify({ n: spent, e: Date.now() + SESSION_TTL_MS })));
  return `${body}.${toB64Url(await sign(secret, body))}`;
};

/**
 * Read a session, or say why it cannot be used.
 *
 * Signature first, then the contents. An expiry read off an unverified payload
 * is the client's number rather than ours, and the whole point of signing is
 * that the client does not get to choose either of these two.
 */
const readSession = async (
  secret: string,
  value: unknown,
): Promise<{ spent: number } | { error: 'absent' | 'invalid' | 'expired' | 'spent' }> => {
  if (typeof value !== 'string' || value === '') return { error: 'absent' };

  const [body, signature] = value.split('.');
  if (!body || !signature) return { error: 'invalid' };

  const given = fromB64Url(signature);
  if (!given || !sameBytes(await sign(secret, body), given)) return { error: 'invalid' };

  const decoded = fromB64Url(body);
  if (!decoded) return { error: 'invalid' };

  let claims: { n?: unknown; e?: unknown };
  try {
    claims = JSON.parse(new TextDecoder().decode(decoded)) as { n?: unknown; e?: unknown };
  } catch {
    return { error: 'invalid' };
  }

  if (typeof claims.n !== 'number' || typeof claims.e !== 'number') return { error: 'invalid' };
  if (Date.now() > claims.e) return { error: 'expired' };
  if (claims.n >= SESSION_BUDGET) return { error: 'spent' };

  return { spent: claims.n };
};

/** Same call /api/estimate makes, kept separate rather than shared: a Pages
    Function is its own bundle, and importing across them to save fifteen lines
    buys a build-time coupling between two endpoints that fail independently. */
const verifyTurnstile = async (
  secret: string,
  token: string,
  ip: string | null,
): Promise<boolean> => {
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
};

const recent = new Map<string, number[]>();

const throttled = (ip: string | null): boolean => {
  if (!ip) return false;
  const now = Date.now();

  if (recent.size > THROTTLE_MAX_KEYS) {
    for (const [key, hits] of recent) {
      if (hits.every((at) => now - at > THROTTLE_WINDOW_MS)) recent.delete(key);
    }
    if (recent.size > THROTTLE_MAX_KEYS) recent.clear();
  }

  const hits = (recent.get(ip) ?? []).filter((at) => now - at <= THROTTLE_WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > THROTTLE_MAX_IN_WINDOW;
};

const handlePost = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;

  // Which services this deployment can actually see, on every request, for the
  // same reason estimate.ts does it: a missing binding is otherwise silent.
  console.log(
    'chat: ai=%s turnstile=%s',
    env.AI ? 'bound' : 'MISSING',
    env.TURNSTILE_SECRET ? 'set' : 'missing',
  );

  const ip = request.headers.get('CF-Connecting-IP');

  // First, because it is the only check that costs nothing: no body read, no
  // crypto, no siteverify round trip.
  if (throttled(ip)) {
    return json(
      {
        ok: false,
        error: 'That is a lot of messages at once. Please wait a moment and try again.',
      },
      429,
      { 'retry-after': String(Math.ceil(THROTTLE_WINDOW_MS / 1000)) },
    );
  }

  if (!env.AI) {
    console.error(
      'No AI binding named AI on this deployment. Add it under Settings > Bindings ' +
        'for THIS environment, then create a new deployment: an existing one keeps ' +
        'the config it was built with.',
    );
    return json(
      { ok: false, error: 'The assistant is not switched on yet. Please use the estimate form.' },
      503,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Body must be JSON.' }, 400);
  }

  if (typeof payload !== 'object' || payload === null) {
    return json({ ok: false, error: 'Body must be a JSON object.' }, 400);
  }

  const read = readMessages((payload as { messages?: unknown }).messages);
  /* Which language to answer in. Only the reply changes: the model routes a
     Spanish question to the same id as its English twin, and the endpoint
     sends that id's stored translation. Anything else reads as English. */
  const lang = (payload as { lang?: unknown }).lang === 'es' ? 'es' : 'en';
  if ('error' in read) return json({ ok: false, error: read.error }, 400);

  /* The human check, after validation on purpose: a malformed request should
     not cost a siteverify round trip, and a real client's 400 should never be
     ambiguous about which of the two things went wrong. */
  const gateKey = env.CHAT_SESSION_SECRET ?? env.TURNSTILE_SECRET;
  let session: string | undefined;

  if (env.TURNSTILE_SECRET && gateKey) {
    const body = payload as { session?: unknown; turnstileToken?: unknown };
    const existing = await readSession(gateKey, body.session);

    if ('spent' in existing) {
      session = await mintSession(gateKey, existing.spent + 1);
    } else {
      const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
      if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, ip))) {
        /* `verify: true` tells the widget to put the challenge back in front
           of the visitor instead of showing a dead end. All three reasons are
           recoverable by ticking a box, which is why they share the flag and
           differ only in what the sentence says. */
        return json(
          {
            ok: false,
            verify: true,
            error:
              existing.error === 'spent'
                ? 'Please confirm you are human to carry on chatting.'
                : existing.error === 'expired'
                  ? 'This conversation timed out. Please confirm you are human to carry on.'
                  : 'We could not confirm that came from a browser. Please reload the page and try again.',
          },
          403,
        );
      }
      session = await mintSession(gateKey, 1);
    }
  }

  const userTurns = read.messages.filter((m) => m.role === 'user').map((m) => m.content);
  const question = userTurns[userTurns.length - 1];
  const earlier = userTurns.slice(-ROUTE_CONTEXT_TURNS - 1, -1);

  let raw: string;
  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: ROUTING_PROMPT },
        {
          role: 'user',
          content: earlier.length
            ? `Earlier messages:\n${earlier.map((m) => `- ${m}`).join('\n')}\n\nLatest message:\n${question}`
            : question,
        },
      ],
      max_tokens: ROUTE_MAX_TOKENS,
      // Zero. This is a classifier, and the same question should land on the
      // same answer every time it is asked.
      temperature: 0,
    });
    /* Some Workers AI models hand back parsed JSON when the output is JSON.
       Re-serialise rather than guess which this one does today. */
    raw =
      typeof result?.response === 'string'
        ? result.response.trim()
        : result?.response && typeof result.response === 'object'
          ? JSON.stringify(result.response)
          : '';
  } catch (err) {
    // The model call is the one part that can fail for reasons outside this
    // file: quota, a model rename, an upstream outage. Log the real thing and
    // hand the visitor a sentence that points somewhere useful.
    console.error('Workers AI call failed', err);
    return json(
      {
        ok: false,
        error:
          'The assistant is unavailable right now. Please use the estimate form or call 571-233-5133.',
      },
      502,
    );
  }

  if (raw === '') {
    console.error('Workers AI returned no text for a valid request.');
    return json(
      { ok: false, error: 'The assistant could not answer that. Please try again.' },
      502,
    );
  }

  const match = readRoute(raw);

  if (!match) {
    if (env.ESTIMATE_UPLOADS) {
      let page: string | null = null;
      try {
        page = new URL(request.headers.get('Referer') ?? '').pathname;
      } catch {
        /* no referer, or not a URL: the page is simply unknown */
      }
      /* After the response, not before it: a visitor waiting on a storage
         write for a sentence that does not depend on it is a cost for
         nothing. A failed write is logged and the reply still goes. */
      context.waitUntil(
        queueUnanswered(env.ESTIMATE_UPLOADS, {
          question,
          earlier,
          page,
          modelOutput: raw.slice(0, 200),
          lang,
        }).catch((err) => console.error('Could not queue an unanswered question', err)),
      );
    } else {
      console.warn(
        'chat: unanswered question not queued, no R2 binding named ESTIMATE_UPLOADS on this deployment.',
      );
    }
  }

  /* The session goes back only on success, so a model failure does not spend
     one of the visitor's twenty-five. `reply` keeps the shape the widget has
     always read; `match` says which approved answer it is, or null. */
  let reply: string[];
  if (!match) {
    reply = lang === 'es' ? noMatchReplyEs : noMatchReply;
  } else if (lang === 'es') {
    /* No translation yet: the English, said to be English, rather than a
       translation nobody approved. */
    reply = spanishFor(match.id)?.a ?? [englishOnlyNote, ...match.a];
  } else {
    reply = match.a;
  }

  return json({
    ok: true,
    reply: reply.join('\n\n'),
    lang,
    match: match ? { id: match.id, question: match.q, url: match.url ?? null } : null,
    /* What the widget should offer next: the contact form, call buttons, or
       the main menu. Null for a plain answer. No match offers the contact
       form, so a question the bot cannot answer becomes a callback instead
       of a dead end. */
    action: match ? (match.action ?? null) : 'lead',
    model: MODEL,
    ...(session ? { session } : {}),
  });
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
