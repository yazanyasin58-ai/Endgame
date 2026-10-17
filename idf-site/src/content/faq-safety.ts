/**
 * The rules every question and answer on this site has to pass, in one place.
 *
 * There are now two sets of FAQs: the general ones at /faq/ and a short set
 * on each of the twelve service pages. Checking them with two copies of the
 * same code would mean the copies drift, and the first thing to drift would
 * be the rule that matters most.
 *
 * These are build failures, not review notes. An FAQ is the easiest place on
 * a website to say something the business cannot stand behind, because the
 * format invites a confident sentence and nobody cross-checks it.
 */
export type QA = { q: string; a: string[] };

/**
 * Written as a CONDITION, not a ban, and that distinction was learned the
 * hard way: a flat ban on claim language failed the build on the site's own
 * disclaimer, which is the one answer that has to raise the subject in order
 * to disown it. Requiring the qualification instead lets the honest sentence
 * through and still catches every helpful-sounding version.
 */
const CLAIM_HANDLING =
  /\b(negotiat|settl|fight|maximi[sz]|handl|manag)\w*\b[^.]{0,40}\bclaims?\b|\bclaims?\b[^.]{0,40}\b(negotiat|settl|fight|maximi[sz])\w*/i;

export function assertSafeFaq(items: readonly QA[], where: string): void {
  const seen = new Set<string>();

  for (const item of items) {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key)) throw new Error(`${where}: the same question twice — "${item.q}"`);
    seen.add(key);

    if (!item.a.length || item.a.some((p) => !p.trim())) {
      throw new Error(`${where}: empty answer for "${item.q}"`);
    }

    const whole = [item.q, ...item.a].join(' ');

    if (CLAIM_HANDLING.test(whole) && !/public adjusting/i.test(whole)) {
      throw new Error(
        `${where}: "${item.q}" raises negotiating or handling an insurance claim without ` +
          `saying that this is public adjusting and not something we do. That is a licensed ` +
          `activity in Virginia and a verbatim client instruction forbids advertising it. ` +
          `Either remove the claim language or keep the disclaimer with it.`,
      );
    }

    /* No conditional version of this one. A deductible must never be
       mentioned in any direction, which is recorded above the insurance
       content in idf.ts. */
    if (/\bdeductible\b/i.test(whole)) {
      throw new Error(`${where}: "${item.q}" mentions a deductible, which must never appear.`);
    }
  }
}

/**
 * No question may appear in two places on the site.
 *
 * Twelve service pages and a general FAQ is twelve chances to paste the same
 * question twice and then answer it two different ways. It also matters for
 * search: each page carries its own FAQPage markup, and the same question on
 * two URLs is the duplication that makes the markup worthless.
 */
export function assertNoDuplicateQuestions(
  sets: readonly { where: string; items: readonly QA[] }[],
): void {
  const seen = new Map<string, string>();
  for (const set of sets) {
    for (const item of set.items) {
      const key = item.q.trim().toLowerCase().replace(/\s+/g, ' ');
      const first = seen.get(key);
      if (first) {
        throw new Error(
          `Duplicate FAQ question across the site: "${item.q}"\n` +
            `  first in: ${first}\n  again in: ${set.where}\n` +
            `Give one of them its own wording, or keep the question in only one place.`,
        );
      }
      seen.set(key, set.where);
    }
  }
}
