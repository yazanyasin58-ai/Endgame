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

export type CatalogEntry = {
  id: string;
  /** The group or service the question sits under, given to the model as context. */
  topic: string;
  q: string;
  a: string[];
  /** Where the same answer can be read on the site. */
  url: string;
};

const serviceTitle = new Map(servicePages.map((s) => [s.slug, s.title]));

export const faqCatalog: CatalogEntry[] = [
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
  `Shawn and Nancy can answer it directly on ${business.phonePrimary}, or you can use the free estimate form on this site.`,
];

/* ---------------------------------------------------------------- guards */

if (faqById.size !== faqCatalog.length) {
  throw new Error('faq-catalog: two entries share an id. A group id and a service slug collide.');
}

assertSafeFaq(
  [{ q: 'The assistant reply when nothing matches', a: noMatchReply }],
  'faq-catalog/no-match',
);
