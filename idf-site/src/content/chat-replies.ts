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

/** The owner's answer to questions he would rather take by phone. */
const intakeReply = [
  `Good question. Our intake and support team can answer that best. Call or text ${business.phonePrimary}, or leave your number and they will call you back.`,
];

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

  /* ------------------------------------------------ the owner's answers, 6 Nov 2026
     From Shawn's questionnaire (/chat-answers/), lightly tidied for grammar
     and nothing added. */
  {
    id: 'chat-price-1',
    q: 'How much does flooring / a kitchen / a bathroom cost? Price per square foot?',
    a: ['Every price comes from the written estimate after we visit, so it reflects your actual space and materials. The estimate is free.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-small-jobs-1',
    q: 'Do you take on small jobs / repairs / is there a minimum job size?',
    a: [`No job is too small or too large. Call or text ${business.phonePrimary} and we will get back to you as soon as possible.`],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-deposit-1',
    q: 'Do you need a deposit / what payment methods do you take / when is the rest paid?',
    a: ['Some jobs need a deposit before work starts, depending on the project.', 'We accept all forms of payment. The balance is paid in stages set out in your contract, and the details are agreed with you before the project starts.'],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-offer-1',
    q: 'When does the 25% off offer end? Can I combine it with the military discount?',
    a: ['The first-project offer runs until the end of the year. It cannot be combined with the military and veteran discount.'],
    status: 'live',
    action: 'lead',
    url: '/faq/#estimates',
  },
  {
    id: 'chat-price-match-1',
    q: 'Can you match or beat another quote?',
    a: ['We put the quality of the job first, so we do not guarantee to match a quote. We will work with you to find a price that works for both of us. Tell us about the other quote and we can talk it through.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-visit-time-1',
    q: 'How soon can someone come out for the estimate visit?',
    a: ['We contact you as soon as your request comes in and book the visit at a time that works for you, typically within 7 days.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-photo-estimate-1',
    q: 'Can you estimate from photos or a video call?',
    a: ['Without measurements and a look at the space it is hard to be exact, but we can give you a rough idea from photos before the visit. The written estimate follows the in-person visit.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-start-1',
    q: 'How soon can you start / are you booked up?',
    a: ['Most projects start within 1 to 3 weeks of signing, depending on materials.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-weekends-1',
    q: 'Do you work evenings or weekends?',
    a: ['Yes, when the contract and timeline call for it. We stick to the deadlines we agree with you while keeping the quality of the work first.'],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-crews-1',
    q: 'Are the crews your own employees? Are they background-checked?',
    a: ['Yes. From the crew on site to the office, everyone is our own in-house team, and everyone is background-checked.'],
    status: 'live',
  },
  {
    id: 'chat-furniture-1',
    q: 'Do you move the furniture and appliances?',
    a: ['Yes. We handle everything from start to finish. If you have questions about it, call or email us and we will get back to you as soon as possible.'],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-disposal-1',
    q: 'Do you take up and dispose of the old floor?',
    a: ['Yes. Removal and disposal are included in the contract.'],
    status: 'live',
  },
  {
    id: 'chat-samples-1',
    q: 'Can you bring samples to my home? Where can I see samples?',
    a: ['Come and visit our Sterling showroom to see our samples in person and talk through your project.'],
    status: 'live',
    url: '/contact/',
  },
  {
    id: 'chat-design-1',
    q: 'Do you help with design / choosing materials / 3D renderings?',
    a: ['Yes. Selections are made with you at the showroom or on site, and our team helps you picture the result if you are not sure exactly what you want.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-spanish-1',
    q: 'Do you speak Spanish / ¿Hablan español?',
    a: ['This chat can answer in Spanish. For a call in Spanish, please leave your number and we will arrange it.'],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-years-1',
    q: 'How long have you been in business?',
    a: ['Since 1989. Shawn and Nancy Waziri have run the company from day one.'],
    status: 'live',
    url: '/about/',
  },
  {
    id: 'chat-reviews-1',
    q: 'Where can I read your reviews?',
    a: ['There are customer reviews on our home page, and a link there to all of our reviews and comments on Google.'],
    status: 'live',
    url: '/',
  },
  {
    id: 'chat-follow-up-1',
    q: 'I already got an estimate. How do I follow up?',
    a: [`Call or text ${business.phonePrimary} with your reference number and we will pick it up from there.`],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-problem-1',
    q: 'I have a problem / complaint with work you finished',
    a: [`Sorry to hear it. Please call ${business.phonePrimary} or leave your details here and Shawn or Nancy will call you back.`],
    status: 'live',
    action: 'lead',
  },
  {
    id: 'chat-text-photos-1',
    q: 'Can I text you photos of my project?',
    a: [`Yes. Text them to ${business.phonePrimary}, or add them on the estimate form.`],
    status: 'live',
    url: '/estimate/',
  },
  {
    id: 'chat-vendor-1',
    q: 'I sell marketing, SEO or software. Who do I talk to?',
    a: [`Thanks. Please email ${business.email} and we will reply if it is a fit.`],
    status: 'live',
  },
  /* ------------------------------------------------ handed to the intake team
     Questions the owner chose to answer by phone rather than in the chat. */
  { id: 'chat-kitchen-time-1', q: 'How long does a kitchen or bathroom remodel take?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-flooring-time-1', q: 'How long does a flooring installation take?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-bonded-1', q: 'Are you bonded?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-warranty-1', q: 'Do you offer a warranty / guarantee on your work?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-lead-safe-1', q: 'Are you lead-safe (EPA RRP) certified for older homes?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-flooring-types-1', q: 'Which flooring types or brands do you carry / install?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-own-materials-1', q: 'Can I supply my own materials / flooring?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-over-existing-1', q: 'Can new flooring go over my existing floor or tile?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-recommend-1', q: 'What flooring do you recommend for a basement or kitchen?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-materials-only-1', q: 'Do you sell materials without installation?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-live-in-1', q: 'Can I stay in my home during the renovation?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-dust-1', q: 'How do you handle dust and cleanup?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-pets-1', q: 'I have pets. Is that a problem?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-be-home-1', q: 'Do I need to be home while you work?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-updates-1', q: 'How will I hear how the job is going?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-architect-1', q: 'Can you work with my architect or designer?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-hoa-1', q: 'Can you help with HOA approval paperwork?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-asbestos-1', q: 'Do you remove popcorn ceilings / handle asbestos or lead paint?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-referral-1', q: 'Do you have a referral program?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-hiring-1', q: 'Are you hiring / do you have jobs?', a: intakeReply, status: 'live', action: 'lead' },
  { id: 'chat-subcontractor-1', q: 'I am a subcontractor looking for work', a: intakeReply, status: 'live', action: 'lead' },
  /* ------------------------------------------------ from the checklist, 6 Nov 2026 */
  {
    id: 'chat-insured-1',
    q: 'Are you insured / bonded?',
    a: ['Yes, we are licensed and insured. Contact us for more details on our coverage.'],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-mddc-1',
    q: 'Are you licensed in Maryland / DC?',
    a: ['Yes. We are licensed to work in Washington, DC, Maryland, and Virginia. Contact us if you need the license details for your project.'],
    status: 'live',
    action: 'call',
  },
  {
    id: 'chat-emergency-1',
    q: 'Do you do emergency water damage service / 24-hour response?',
    a: [
      `We take calls during business hours and do not run a 24-hour emergency line. Our hours are: ${hoursLine}`,
      'Outside those hours, leave your details and we will call you back as soon as we open.',
    ],
    status: 'live',
    action: 'lead',
    url: '/services/water-damage-mold/',
  },
  /* ------------------------------------------------ pending: needs an answer */
  {
    id: 'chat-permits-1',
    q: 'Do you pull the permits?',
    a: ['[CONFIRM] Yes. We pull the permits for the work we do and meet the inspector on site.'],
    status: 'pending',
    needs: 'The FAQ says "we pull the permits". Is that true for every job type, including flooring-only work?',
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
