/**
 * Frequently asked questions.
 *
 * Asked for on the client's master list, item 6: "a professional
 * expandable/collapsible FAQ area", with the offer that we draft generic
 * construction and real estate questions for their review if they have not
 * written their own. These are that draft. THE CLIENT HAS NOT APPROVED THEM
 * YET, so treat every answer as provisional wording, not as settled copy.
 *
 * THE RULE EVERY ANSWER HAD TO PASS: it may only state something the site
 * already states somewhere else, approved. An FAQ is the easiest place on a
 * website to invent a fact, because the format invites a confident sentence
 * and nobody cross-checks it against the rest of the pages. So:
 *
 *   - No timescales beyond the 24-hour estimate turnaround, which is in
 *     processSteps and on five pages already. "Most kitchens take six weeks"
 *     is the kind of sentence that belongs in a contract, not here.
 *   - No prices, and nothing implying a price holds. The signed estimate
 *     governs that.
 *   - No claim of being insured or bonded. It is the single most expected
 *     line in a contractor FAQ and there is no approved source for it, so it
 *     is absent. If the client supplies the carrier and the limits, add it.
 *   - Nothing about negotiating or settling insurance claims. That is public
 *     adjusting, licensed separately in Virginia, and it is also a verbatim
 *     client instruction. There is a build-time guard for it below.
 *   - Nothing that reads as brokerage. The firm licence question is still
 *     open, so the real estate answers offer renovation work and an
 *     introduction to a licensed agent, exactly as /real-estate/ does.
 *
 * `home: true` marks the handful that also appear on the homepage. The full
 * set lives at /faq/ and that is the only page carrying FAQPage structured
 * data, for the same reason LocalBusinessSchema is homepage-only: the same
 * markup on two pages describes two things to a parser.
 */
import { business, hours, hoursLabel, serviceArea, promo } from './idf';

export type FaqItem = {
  q: string;
  /** Paragraphs. Several short ones beat one long one in a collapsed panel. */
  a: string[];
  /** Also shown in the homepage band. */
  home?: boolean;
};

export type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const faqGroups: FaqGroup[] = [
  {
    id: 'estimates',
    title: 'Estimates and cost',
    items: [
      {
        q: 'Do you charge for an estimate?',
        home: true,
        a: [
          'No. Tell us the type of project and the address, we walk the site ourselves, and your written estimate follows within 24 hours of that visit.',
        ],
      },
      {
        q: 'How quickly will I get my estimate?',
        home: true,
        a: [
          'Within 24 hours of the site visit. We will not quote a project we have not stood in, so the visit comes first.',
        ],
      },
      {
        q: 'Is the written estimate the final price?',
        a: [
          'The written estimate is what we stand behind. If something changes the scope once the work is under way, it is handled as a written change order agreed before that work happens, not added to an invoice afterwards.',
          'Nothing on this website sets a price. The signed estimate is the only document that does.',
        ],
      },
      {
        q: `What does the “${promo.headline}” offer actually cover?`,
        a: [
          'It applies to a first project with us.',
          promo.fine,
          'Ask us about it when you request your estimate and we will tell you where you land before anything is signed.',
        ],
      },
      {
        q: 'Do you offer a military or veteran discount?',
        home: true,
        a: [
          'Yes. Mention it when you get in touch and we will go through it with you.',
        ],
      },
      {
        q: 'Can a project be financed?',
        a: [
          'We work with a lending partner who handles renovation and construction financing, and we can introduce you when you request your estimate.',
          'Approval, rates and terms are set by the lender, not by us. There is no application on this website and we do not see your financial information.',
        ],
      },
    ],
  },
  {
    id: 'licence',
    title: 'Licence and who does the work',
    items: [
      {
        q: 'Are you licensed?',
        home: true,
        a: [
          `Yes. ${business.name} is a Virginia Class A general contractor, licence number ${business.licenseNumber}. That number is public and you are welcome to look it up before you call us.`,
        ],
      },
      {
        q: 'Who will I actually be dealing with?',
        home: true,
        a: [
          `Shawn and Nancy Waziri, who have run this company since ${business.established}. The person who walks your site, writes your estimate and stands behind the work is the owner, not a project manager you meet once.`,
        ],
      },
      {
        q: 'Do you use subcontractors?',
        a: [
          'We hold the licence, pull the permits, schedule the trades in the order the work actually needs, supervise the site while it is live, and stand in front of the inspector.',
          'Work that requires a separate licence, such as surveying or a structural engineering stamp, is placed with a licensed professional and coordinated by us. You still have one number to call.',
        ],
      },
    ],
  },
  {
    id: 'area',
    title: 'Where we work',
    items: [
      {
        q: 'What areas do you serve?',
        home: true,
        a: [`${serviceArea.short}. ${serviceArea.detail}`],
      },
      {
        q: 'Can I visit the showroom?',
        a: [
          `Yes, and contracts are signed and selections are made there. We are at ${business.address}.`,
          hours.map((h) => `${h.days}, ${hoursLabel(h)}`).join('. ') + '.',
        ],
      },
    ],
  },
  {
    id: 'work',
    title: 'The work itself',
    items: [
      {
        q: 'What kinds of project do you take on?',
        a: [
          'Custom homes and ground-up construction, additions, full home renovations, kitchens, bathrooms and basements, flooring, roofing and siding, windows and doors, painting and drywall, and water damage restoration.',
          'Every one of those has its own page on this site with what the work covers and where it stops.',
        ],
      },
      {
        q: 'How long will my project take?',
        a: [
          'That depends entirely on scope, and anyone who gives you a number before walking the site is guessing.',
          'The schedule comes with the written estimate after the visit, so you have it before you commit to anything.',
        ],
      },
      {
        q: 'Do you build new homes from scratch?',
        a: [
          'Yes. Custom homes and ground-up construction are part of what we do, and there is a dedicated page covering how a build runs from design through to completion.',
        ],
      },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance and restoration work',
    items: [
      {
        q: 'Do you handle repairs after water or storm damage?',
        home: true,
        a: [
          'Yes. We document the damage with photographs, measurements and a written scope, produce an itemised repair estimate suitable for your claim file, answer your insurer’s questions about our own estimate and our own scope, and carry out the remediation, structural repair and full reconstruction.',
          'What we will not do is stand between you and your insurer. Negotiating or settling a claim on a policyholder’s behalf is public adjusting, which is licensed separately in Virginia and is a different profession from ours.',
        ],
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling a home',
    items: [
      {
        q: 'Should I renovate before I sell?',
        a: [
          'Some work returns more than it costs and some does not, and which is which depends on the house and the street.',
          'Tell us about the property and we will walk it and give you a straight answer on what is worth doing, what is not, and what it would cost.',
        ],
      },
      {
        q: 'Do you list homes, or work with agents?',
        a: [
          'We are a contractor, not a brokerage. The renovation work is ours.',
          'We work alongside licensed agents in the area and are glad to introduce you to one if you need it. The listing is theirs.',
        ],
      },
    ],
  },
];

/** Flattened, for the structured data and the guards. */
export const faqItems: FaqItem[] = faqGroups.flatMap((g) => g.items);

/** The subset shown on the homepage, in the order they are written above. */
export const faqHome: FaqItem[] = faqItems.filter((i) => i.home);

/*
 * Build-time guards.
 *
 * The phrase guard is not decoration. "We handle your insurance claim" is the
 * single most natural sentence to write in a contractor FAQ, it is what the
 * client was told not to advertise, and it describes a licensed activity this
 * company is not licensed for. A future edit that reaches for it should fail
 * the build rather than reach the website.
 */
{
  const seen = new Set<string>();
  for (const item of faqItems) {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key)) throw new Error(`faq: the same question twice — "${item.q}"`);
    seen.add(key);
    if (!item.a.length || item.a.some((p) => !p.trim())) {
      throw new Error(`faq: empty answer for "${item.q}"`);
    }
  }

  if (!faqHome.length) {
    throw new Error('faq: nothing marked `home`, so the homepage band would render empty.');
  }

  /*
   * A flat ban on the words does not work, and finding that out is the
   * useful part: the one answer that MUST discuss claim negotiation is the
   * one that disowns it, and a ban fails the build on its own disclaimer.
   * Writing the rule as a ban caught this file on the first run.
   *
   * So the rule is conditional instead, and it is stronger than a ban. Any
   * item that raises negotiating, settling, handling or fighting a claim has
   * to say in the same breath that this is public adjusting and not what we
   * do. The honest sentence passes. "We handle your insurance claim" does
   * not, because it carries no such qualification, and neither does anything
   * a future edit reaches for to sound more helpful.
   */
  const CLAIM_HANDLING =
    /\b(negotiat|settl|fight|maximi[sz]|handl|manag)\w*\b[^.]{0,40}\bclaims?\b|\bclaims?\b[^.]{0,40}\b(negotiat|settl|fight|maximi[sz])\w*/i;

  for (const item of faqItems) {
    const whole = [item.q, ...item.a].join(' ');

    if (CLAIM_HANDLING.test(whole) && !/public adjusting/i.test(whole)) {
      throw new Error(
        `faq: "${item.q}" raises negotiating or handling an insurance claim without ` +
          `saying that this is public adjusting and not something we do. That is a ` +
          `licensed activity in Virginia and a verbatim client instruction forbids ` +
          `advertising it. Either remove the claim language or keep the disclaimer with it.`,
      );
    }

    /* No conditional version of this one. A deductible must never be
       mentioned in any direction, which is recorded above the insurance
       content in idf.ts. */
    if (/\bdeductible\b/i.test(whole)) {
      throw new Error(`faq: "${item.q}" mentions a deductible, which must never appear here.`);
    }
  }
}
