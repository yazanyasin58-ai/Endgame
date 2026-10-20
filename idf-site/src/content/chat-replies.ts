/**
 * The assistant's own replies: everything it can say that is not an FAQ answer.
 *
 * WHY A SECOND LIST. The FAQ answers questions a visitor reads on a page. A
 * chat also gets "hi", "can someone call me", "what's your number" and "I want
 * to book an estimate", and answering those with the nearest FAQ entry reads
 * like a search box rather than an assistant. The client asked for exactly
 * this on 20 October: "I would like to schedule an estimate" should be met
 * with "leave your contact details and we'll be in touch", not a paragraph
 * about whether estimates cost money.
 *
 * The safety argument is unchanged. These are still fixed, approved strings,
 * routed to by id and sent back word for word, and every one passes the same
 * guards as the FAQ. A model still writes nothing the visitor sees.
 *
 * TWO STATUSES.
 *
 *   - `live` replies use only facts the site already publishes (the phone,
 *     the email, the address, the hours, the service list, the 24-hour
 *     estimate promise). They go into the routing catalog.
 *   - `pending` replies need the owner to confirm or supply a fact first:
 *     a price, a warranty, a licence, a policy. They are drafted here so the
 *     wording is ready, and they are NOT routed until someone flips them to
 *     `live`. Every one carries `needs`, the question for Shawn or Yaz. The
 *     same list is in CHAT-RESPONSES.md for whoever is filling it in.
 *
 * An `action` makes the widget do something after showing the text:
 *   - `lead` opens the in-chat contact form, posted to /api/estimate.
 *   - `call` adds call and text buttons.
 *   - `menu` brings the main menu back.
 */
import { business, hours, hoursLabel, serviceArea } from './idf';
import { assertSafeFaq } from './faq-safety';

export type ChatAction = 'lead' | 'call' | 'menu';

export type ChatReply = {
  /** Short, and shaped `chat-<word>-<n>` so the endpoint's bare-id fallback reads it. */
  id: string;
  /** What the visitor is asking, phrased the way they would. The model routes on this. */
  q: string;
  a: string[];
  status: 'live' | 'pending';
  action?: ChatAction;
  /** Optional link for "read more". Omitted when the reply is the whole story. */
  url?: string;
  /** For pending replies: what has to be confirmed before this can go live. */
  needs?: string;
};

const hoursLine = hours.map((h) => `${h.days}: ${hoursLabel(h)}`).join('. ') + '.';

export const chatReplies: ChatReply[] = [
  /* ------------------------------------------------ conversation */
  {
    id: 'chat-hello-1',
    q: 'Hello / hi / good morning (a greeting with no question yet)',
    a: [
      'Hi there! I can tell you about our services, set up a free estimate, or get you to Shawn and Nancy directly. What are you working on?',
    ],
    status: 'live',
    action: 'menu',
  },
  {
    id: 'chat-thanks-1',
    q: 'Thank you / thanks / that is all / bye',
    a: [`You're welcome. If anything else comes up, I'm here, or you can call us on ${business.phonePrimary}.`],
    status: 'live',
    action: 'menu',
  },
  {
    id: 'chat-human-1',
    q: 'Can I talk to a real person / speak to someone / is this a bot?',
    a: [
      `I'm an assistant that answers from the company's own approved answers. For anything I can't cover, Shawn and Nancy pick up on ${business.phonePrimary}, or leave your details and they'll call you back.`,
    ],
    status: 'live',
    action: 'call',
  },

  /* ------------------------------------------------ getting in touch */
  {
    id: 'chat-estimate-1',
    q: 'I would like to schedule / book / get an estimate or quote',
    a: [
      "Happy to set that up. Leave your name, phone and email below and we'll be in touch to arrange the site visit.",
      'The estimate is free, and your written estimate follows within 24 hours of the visit.',
    ],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-callback-1',
    q: 'Can someone call me back / schedule a consultation call',
    a: ["Of course. Leave your name, phone and email below and Shawn or Nancy will call you back."],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-phone-1',
    q: 'What is your phone number / how do I contact you / can I text you?',
    a: [
      `You can call or text ${business.phonePrimary}, or email ${business.email}.`,
    ],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-hours-1',
    q: 'What are your hours / when are you open?',
    a: [`Our Sterling showroom hours are: ${hoursLine}`],
    status: 'live',
    url: '/contact/',
  },
  {
    id: 'chat-where-1',
    q: 'Where are you located / what is your address?',
    a: [`We're at ${business.address}. ${serviceArea.detail}`],
    status: 'live',
    url: '/contact/',
  },

  /* ------------------------------------------------ the work */
  {
    id: 'chat-services-1',
    q: 'What services do you offer / what do you do?',
    a: [
      'We handle custom homes and new construction, additions, full home renovations, kitchens, bathrooms and basements, flooring, roofing and siding, windows and doors, painting and drywall, and water damage restoration.',
      'Tell me which one you have in mind and I can tell you more, or I can set up a free estimate.',
    ],
    status: 'live',
    url: '/services/',
  },
  {
    id: 'chat-projects-1',
    q: 'Can I see photos of your past work / your portfolio?',
    a: ['Yes, our recent projects are on the Projects page, with photos of the finished work.'],
    status: 'live',
    url: '/projects/',
  },

  /* ------------------------------------------------ pending: needs an answer */
  {
    id: 'chat-price-1',
    q: 'How much does flooring / a kitchen / a bathroom cost? Price per square foot?',
    a: ['[CONFIRM] Typical starting range, e.g. "Most kitchen remodels we do start around $___", or keep the current line: every price comes from the written estimate after the visit.'],
    status: 'pending',
    needs: 'Is the client willing to publish any starting price or price per square foot? If not, this stays a "free estimate" reply.',
  },
  {
    id: 'chat-warranty-1',
    q: 'Do you offer a warranty / guarantee on your work?',
    a: ['[CONFIRM] Yes. Our workmanship is covered for ___ years from completion, and materials carry the manufacturer\'s warranty.'],
    status: 'pending',
    needs: 'Is there a workmanship warranty, and for how long? Is it in the contract?',
  },
  {
    id: 'chat-insured-1',
    q: 'Are you insured / bonded?',
    a: ['[CONFIRM] Yes. We carry general liability insurance with ___ and can provide a certificate on request.'],
    status: 'pending',
    needs: 'Punch list S1: the insurance carrier and limits, or approval to say nothing about insurance.',
  },
  {
    id: 'chat-mddc-1',
    q: 'Are you licensed in Maryland / DC?',
    a: ['[CONFIRM] Yes. Our Maryland MHIC number is ___ and our DC licence is ___.'],
    status: 'pending',
    needs: 'Punch list S2: MHIC and DC licence numbers, or narrow the service area to Virginia.',
  },
  {
    id: 'chat-flooring-types-1',
    q: 'What types of flooring do you install (hardwood, LVP, tile, carpet, laminate)?',
    a: ['[CONFIRM] We install ___ (e.g. hardwood, engineered wood, luxury vinyl plank, tile, laminate, carpet). Samples are at the Sterling showroom.'],
    status: 'pending',
    needs: 'Which flooring types do they install, and which do they not? Any brands they carry?',
  },
  {
    id: 'chat-own-materials-1',
    q: 'Can I supply my own materials / flooring?',
    a: ['[CONFIRM] Yes / No. ___'],
    status: 'pending',
    needs: 'Do they install customer-supplied materials, and does that change any warranty?',
  },
  {
    id: 'chat-permits-1',
    q: 'Do you pull the permits?',
    a: ['[CONFIRM] Yes. We pull the permits for the work we do and meet the inspector on site.'],
    status: 'pending',
    needs: 'The FAQ says "we pull the permits". Is that true for every job type, including flooring-only work?',
  },
  {
    id: 'chat-deposit-1',
    q: 'How does payment work / do you need a deposit / what payment methods do you take?',
    a: ['[CONFIRM] We take a ___% deposit at signing, with the balance in stages set out in the contract. We accept ___.'],
    status: 'pending',
    needs: 'Deposit percentage, payment schedule, and accepted payment methods (card, check, ACH, Zelle).',
  },
  {
    id: 'chat-start-1',
    q: 'How soon can you start / are you booked up?',
    a: ['[CONFIRM] Most projects can start within ___ weeks of signing, depending on materials.'],
    status: 'pending',
    needs: 'Typical lead time from signing to start, or keep it as "we will give you a start date with the estimate".',
  },
  {
    id: 'chat-flooring-time-1',
    q: 'How long does a flooring installation take?',
    a: ['[CONFIRM] A typical ___ room job takes about ___ days.'],
    status: 'pending',
    needs: 'Is there a typical duration they are happy to quote for common jobs (one room of LVP, a whole floor of hardwood)?',
  },
  {
    id: 'chat-live-in-1',
    q: 'Can I stay in my home during the renovation?',
    a: ['[CONFIRM] ___'],
    status: 'pending',
    needs: 'Their usual answer on living at home during work, dust control and daily cleanup.',
  },
  {
    id: 'chat-small-jobs-1',
    q: 'Do you take on small jobs / repairs / is there a minimum?',
    a: ['[CONFIRM] ___'],
    status: 'pending',
    needs: 'Is there a minimum job size? Do they do small repairs (a few boards, one door)?',
  },
  {
    id: 'chat-design-1',
    q: 'Do you help with design / choosing materials?',
    a: ['[CONFIRM] Yes. Selections are made with you at the showroom or on site, and ___.'],
    status: 'pending',
    needs: 'Do they offer design help or 3D renderings, and is there a charge?',
  },
  {
    id: 'chat-emergency-1',
    q: 'Do you do emergency water damage service / 24-hour response?',
    a: ['[CONFIRM] ___'],
    status: 'pending',
    needs: 'Do they respond out of hours to water damage? If so, what number and what hours?',
  },
  {
    id: 'chat-asbestos-1',
    q: 'Do you remove popcorn ceilings / handle asbestos or lead paint?',
    a: ['[CONFIRM] ___'],
    status: 'pending',
    needs: 'Punch list S14: leave it out, or the owner\'s own words on what they do and do not handle.',
  },
  {
    id: 'chat-hoa-1',
    q: 'Can you help with HOA approval paperwork?',
    a: ['[CONFIRM] ___'],
    status: 'pending',
    needs: 'Do they prepare drawings or paperwork for HOA architectural review?',
  },
  {
    id: 'chat-spanish-1',
    q: 'Do you speak Spanish / another language?',
    a: ['[CONFIRM] ___'],
    status: 'pending',
    needs: 'Any languages besides English the office or crews can handle?',
  },
];

/** The replies the assistant may actually send. */
export const liveChatReplies = chatReplies.filter((r) => r.status === 'live');

/* ---------------------------------------------------------------- guards */

if (new Set(chatReplies.map((r) => r.id)).size !== chatReplies.length) {
  throw new Error('chat-replies: two replies share an id.');
}

for (const reply of liveChatReplies) {
  if (reply.a.some((p) => /\[CONFIRM\]|___/.test(p))) {
    throw new Error(`chat-replies: ${reply.id} is live but still has a placeholder in it.`);
  }
}

assertSafeFaq(chatReplies, 'chat-replies');
