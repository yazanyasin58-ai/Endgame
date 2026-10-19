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
 * A build guard cannot reach generated text, so the only place those rules can
 * live is the system prompt, and the only honest way to run this endpoint is to
 * treat that prompt as part of the product rather than as decoration.
 *
 * NOT YET SAFE TO EXPOSE PUBLICLY. See the note above `MAX_MESSAGES`.
 */

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
  ): Promise<{ response?: string }>;
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
 * THE CONTEXT WINDOW IS 24,000 TOKENS. Not 128K, not 1M. The caps below sit
 * comfortably inside it: 12,000 characters of history is roughly 3,000
 * tokens, the system prompt is under 1,000, and MAX_TOKENS reserves 512 for
 * the answer. That leaves a wide margin today and almost none of it is free
 * for the taking. If anyone later feeds this endpoint retrieved content, the
 * site's 53 FAQ answers being the obvious candidate, the budget has to be
 * recounted against 24,000 rather than assumed to fit.
 */
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/**
 * Limits, and the reason they are not optional.
 *
 * Workers AI is billed, and this endpoint takes a conversation from anyone on
 * the internet and spends the client's money running it. Unlike /api/estimate
 * there is no Turnstile token in front of it yet, so these caps are the only
 * thing standing between a public URL and a bill. They bound the worst case;
 * they do not make it safe.
 *
 * BEFORE THIS GOES PUBLIC it needs the same Turnstile check the estimate form
 * uses, or a rate limit keyed on CF-Connecting-IP, or both. That is deliberately
 * not wired here: it would add a hard dependency on TURNSTILE_SECRET to an
 * endpoint nobody has pointed a UI at yet, and a guard that silently rejects
 * every request is worse than a guard that is visibly still to come.
 */
const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 4000;
const MAX_CHARS_TOTAL = 12000;
const MAX_TOKENS = 512;

/**
 * What the assistant is allowed to be.
 *
 * Every factual claim in here is one the site already makes somewhere the
 * owner approved: the license number, the founding year, the owners' names,
 * the 24-hour estimate turnaround, the phone number. Nothing new is asserted,
 * because an assistant inventing a credential is the same failure as a page
 * inventing one, with less chance of anybody noticing.
 */
const SYSTEM_PROMPT = [
  'You are the assistant on the website of Interior Design Flooring, a general',
  'contractor in Sterling, Virginia, owner-operated by Shawn and Nancy Waziri',
  'since 1989, holding Virginia Class A General Contractor license #2705162130.',
  '',
  'Your job is to help a visitor understand what the company does and to get',
  'them to a free estimate. You are not a salesperson and not an estimator.',
  '',
  'Rules you must never break, in order of how much damage breaking them does:',
  '',
  '1. Never discuss negotiating, settling, filing or handling an insurance',
  '   claim on a customer behalf. In Virginia that is public adjusting and it',
  '   is licensed separately. The company repairs insurance damage; it does not',
  '   deal with the insurer for anyone. Never mention a deductible at all, in',
  '   any context, including offering to cover, waive, discount or absorb one.',
  '2. Never give a price, a price range, a rate, a per-square-foot figure or an',
  '   estimate of cost, and never say what work "usually" or "typically" costs.',
  '   Only the signed written estimate sets a price. If asked about cost, say',
  '   the estimate is free and the written estimate follows the site visit.',
  '3. Never claim the company is insured or bonded. Say it is licensed, and',
  '   give the license number, which anyone can look up.',
  '4. Never invent a statistic, a project count, an award, a certification, a',
  '   team member, a client name or a review. If you do not know, say so and',
  '   point to the estimate form or the phone number.',
  '5. Never promise a timescale for the work itself. The one timing commitment',
  '   the company publishes is that the written estimate follows within 24',
  '   hours of the site visit. Say that and nothing more.',
  '6. Never act as or refer to a real estate agent or brokerage service, and',
  '   never give legal, tax or financing advice.',
  '',
  'Style: plain, direct, warm, short. Two or three sentences is usually right.',
  'Never use em dashes; use commas or full stops. Do not use exclamation marks.',
  '',
  'When you cannot answer, or when the question needs a human, say so and point',
  'to the free estimate form on this site or to 571-233-5133. That is a better',
  'answer than a confident guess, and it is the answer the owners would want.',
].join('\n');

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
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

const handlePost = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;

  // Which services this deployment can actually see, on every request, for the
  // same reason estimate.ts does it: a missing binding is otherwise silent.
  console.log('chat: ai=%s', env.AI ? 'bound' : 'MISSING');

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
  if ('error' in read) return json({ ok: false, error: read.error }, 400);

  try {
    const result = await env.AI.run(MODEL, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...read.messages],
      max_tokens: MAX_TOKENS,
      // Low, on purpose. This assistant is answering factual questions about a
      // real company under hard content rules, and invention is the failure
      // mode that matters here, not dullness.
      temperature: 0.3,
    });

    const reply = typeof result?.response === 'string' ? result.response.trim() : '';
    if (reply === '') {
      console.error('Workers AI returned no text for a valid request.');
      return json(
        { ok: false, error: 'The assistant could not answer that. Please try again.' },
        502,
      );
    }

    return json({ ok: true, reply, model: MODEL });
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
