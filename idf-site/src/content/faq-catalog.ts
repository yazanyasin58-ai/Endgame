/**
 * Every approved question and answer on the site, flattened into one list
 * with a stable id each, for the assistant.
 *
 * WHY THE ASSISTANT READS THIS AND NOTHING ELSE. /api/chat runs in retrieval
 * mode: the model is shown the questions below and asked for one id, and the
 * endpoint then sends back that entry's answer exactly as written. The model
 * never writes a word the visitor sees. That is the whole safety argument, and
 * it only holds if what is sent back is the same text the pages carry, which
 * is why this is built from faqGroups and serviceFaq rather than copied out of
 * them. Edit an answer there and the assistant says the new one; there is no
 * second copy to forget.
 *
 * Importing service-faq.ts here also means every guard in faq-safety.ts runs
 * whenever this module loads, including inside the Function bundle. An answer
 * that fails those guards fails the build before it can be retrieved.
 *
 * IDS are the group or service slug plus the question's position, one-based:
 * `faq-estimates-1`, `flooring-3`. Short on purpose, because all of them go
 * into the prompt on every request. They are stable for as long as the order
 * is, which is long enough: the model only has to keep them straight within
 * one request, and an unanswered-question record stores the question text,
 * not an id.
 */
import { business } from './idf';
import { faqGroups } from './faq';
import { serviceFaq } from './service-faq';
import { servicePages } from './services-detail';
import { assertSafeFaq } from './faq-safety';
import { liveChatReplies, type ChatAction } from './chat-replies';
import { answersEs, noMatchReplyEs } from './chat-es';

export type CatalogEntry = {
  id: string;
  /** The group or service the question sits under, given to the model as context. */
  topic: string;
  q: string;
  a: string[];
  /** Where the same answer can be read on the site, if anywhere. */
  url?: string;
  /** What the widget does after showing the reply. Chat replies only. */
  action?: ChatAction;
};

const serviceTitle = new Map(servicePages.map((s) => [s.slug, s.title]));

export const faqCatalog: CatalogEntry[] = [
  /* First, so a visitor who wants to DO something (book, be called back, get
     the number) meets the reply that does it before the FAQ entry that talks
     about it. Only the live ones: see chat-replies.ts for the pending list. */
  ...liveChatReplies.map((reply) => ({
    id: reply.id,
    topic: 'Talking to the assistant',
    q: reply.q,
    a: reply.a,
    url: reply.url,
    action: reply.action,
  })),
  ...faqGroups.flatMap((group) =>
    group.items.map((item, index) => ({
      id: `faq-${group.id}-${index + 1}`,
      topic: group.title,
      q: item.q,
      a: item.a,
      url: `/faq/#${group.id}`,
    })),
  ),
  ...Object.entries(serviceFaq).flatMap(([slug, items]) =>
    items.map((item, index) => ({
      id: `${slug}-${index + 1}`,
      topic: serviceTitle.get(slug) ?? slug,
      q: item.q,
      a: item.a,
      url: `/services/${slug}/#svc-faq-h`,
    })),
  ),
];

/** The Spanish for an entry, or null when it has not been translated yet. */
export const spanishFor = (id: string): { q: string; a: string[] } | null => answersEs[id] ?? null;

export const faqById: ReadonlyMap<string, CatalogEntry> = new Map(
  faqCatalog.map((entry) => [entry.id, entry]),
);

/**
 * What the assistant says when no approved answer fits.
 *
 * The one piece of assistant copy that is not an FAQ answer, so it is held to
 * the same guards as one. It promises nothing about the question being read
 * or answered later: the unanswered queue is a backlog for the owners, not a
 * service level, and the visitor should leave with a route that works today.
 */
export const noMatchReply: string[] = [
  'I do not have an approved answer to that one, and I would rather not guess.',
  `Want Shawn or Nancy to answer it? Leave your number below and they will call you back, or call ${business.phonePrimary}.`,
];

export { noMatchReplyEs };

/* ---------------------------------------------------------------- guards */

/* A Spanish key that names nothing means the English questions were reordered
   or renamed and the translations now sit on the wrong answers. */
const strayEs = Object.keys(answersEs).filter((id) => !faqById.has(id));
if (strayEs.length) {
  throw new Error(`chat-es: translations for ids that are not in the catalog: ${strayEs.join(', ')}`);
}
const untranslated = faqCatalog.filter((entry) => !answersEs[entry.id]).map((entry) => entry.id);
if (untranslated.length) {
  console.warn(`chat-es: no Spanish yet for ${untranslated.join(', ')}; the assistant shows English for these.`);
}

if (faqById.size !== faqCatalog.length) {
  throw new Error('faq-catalog: two entries share an id. A group id and a service slug collide.');
}

assertSafeFaq(
  [{ q: 'The assistant reply when nothing matches', a: noMatchReply }],
  'faq-catalog/no-match',
);
