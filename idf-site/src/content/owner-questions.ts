/**
 * The questions behind /chat-answers/, the hidden page Shawn fills in from his
 * phone. Each one is something customers are likely to type into the website
 * chat that it can't answer yet. His answers come back through
 * /api/owner-answers and become fixed chat replies once approved.
 *
 * `d` is the drafted reply; every ___ is a blank he fills in. `alt` is an
 * optional ready-made alternative. `ready` marks drafts that need no facts.
 * Same list as the "IDF Chatbot Answer Sheet", except question 40, which now
 * asks who can take a call in Spanish (the chat itself answers in Spanish).
 */
import { business } from './idf';

const PHONE = business.phonePrimary;

export interface OwnerQuestion {
  n: number;
  q: string;
  d: string;
  alt?: string;
  h?: string;
  ready?: boolean;
}
export interface OwnerSection {
  k: string;
  t: string;
  sub: string;
  qs: OwnerQuestion[];
}

export const ownerSections: OwnerSection[] = [

 {k:'pricing', t:'Pricing and payment', sub:'What customers ask before anyone visits.', qs:[
  {n:1, q:'How much does flooring cost per square foot?', d:'Installed, most ___ runs about $___ to $___ a square foot. Your written estimate gives the exact figure.', alt:'Every price comes from the written estimate after we visit, so it reflects your actual space and materials.'},
  {n:2, q:'How much does a kitchen remodel cost?', d:'Our kitchen projects usually range from $___ to $___, depending on size and finishes.', alt:'Every kitchen is priced from a written estimate after we visit.'},
  {n:3, q:'How much does a bathroom remodel cost?', d:'Our bathroom projects usually range from $___ to $___, depending on size and finishes.', alt:'Every bathroom is priced from a written estimate after we visit.'},
  {n:4, q:'Is there a minimum job size? Do you do small repairs?', d:'We take on jobs from about $___ and up. For small repairs, ___.'},
  {n:5, q:'Do you need a deposit?', d:'We take ___% when the contract is signed.'},
  {n:6, q:'What payment methods do you take?', d:'We accept ___.', h:'For example: card, check, ACH, Zelle.'},
  {n:7, q:'When is the rest paid?', d:'The balance is paid in stages set out in your contract: ___.'},
  {n:8, q:'When does the 25% off offer end? Can I combine it with the military discount?', d:'The offer runs until ___. It ___ combine with the military and veteran discount.', h:'Second blank: "does" or "does not".'},
  {n:9, q:'Can you match or beat another quote?', d:'___'},
 ]},
 {k:'timing', t:'Timing and scheduling', sub:'The questions the chat gets most. Rough ranges help even if every job differs.', qs:[
  {n:10, q:'How soon can someone come out for the estimate visit?', d:'We usually visit within ___ days of your request.'},
  {n:11, q:'Can you estimate from photos or a video call?', d:'___'},
  {n:12, q:'How soon can you start?', d:'Most projects start within ___ weeks of signing, depending on materials.'},
  {n:13, q:'How long does a flooring install take?', d:'One room of ___ usually takes ___ days. A whole floor takes about ___.'},
  {n:14, q:'How long does a kitchen or bathroom take?', d:'A typical bathroom takes ___ weeks and a kitchen ___ weeks once work starts.'},
  {n:15, q:'Do you work evenings or weekends?', d:'___'},
 ]},
 {k:'licence', t:'Licence, insurance and warranty', sub:'These need to be exactly right, since customers rely on them.', qs:[
  {n:16, q:'Are you insured?', d:'Yes. We carry general liability insurance with ___ and can send a certificate on request.'},
  {n:17, q:'Are you licensed in Maryland or DC?', d:'Our Maryland MHIC number is ___ and our DC licence is ___.', alt:'We are licensed in Virginia. For work in Maryland or DC, please call us to talk it through.'},
  {n:18, q:'Are you bonded?', d:'___'},
  {n:19, q:'Is there a warranty on your work?', d:'Our workmanship is covered for ___ years from completion. Materials carry the manufacturer\'s warranty.'},
  {n:20, q:'Are you lead-safe (EPA RRP) certified for older homes?', d:'___'},
  {n:21, q:'Are the crews your own employees? Are they background-checked?', d:'___'},
 ]},
 {k:'flooring', t:'Flooring', sub:'Where the company started, and still the most common enquiry.', qs:[
  {n:22, q:'Which brands do you carry?', d:'We work with ___ and can source most major brands.'},
  {n:23, q:'Can I supply my own flooring?', d:'___. If you do, the warranty covers ___.'},
  {n:24, q:'Do you move the furniture and appliances?', d:'___'},
  {n:25, q:'Do you take up and dispose of the old floor?', d:'Yes, removal and disposal are ___.', h:'For example: "included in the price" or "priced separately".'},
  {n:26, q:'Can new flooring go over my existing floor or tile?', d:'___'},
  {n:27, q:'What do you recommend for a basement or kitchen?', d:'___'},
  {n:28, q:'Do you sell materials without installation?', d:'___'},
  {n:29, q:'Can you bring samples to my home?', d:'___. Samples are also at the Sterling showroom.'},
 ]},
 {k:'during', t:'During the project', sub:'What living with the work is like.', qs:[
  {n:30, q:'Can I stay in my home during the work?', d:'___'},
  {n:31, q:'How do you handle dust and cleanup?', d:'___'},
  {n:32, q:'I have pets. Is that a problem?', d:'___'},
  {n:33, q:'Do I need to be home while you work?', d:'___', h:'For example: a key, a lockbox or a garage code.'},
  {n:34, q:'How will I hear how the job is going?', d:'___', h:'For example: texts, photos or a weekly call.'},
 ]},
 {k:'design', t:'Design and planning', sub:'', qs:[
  {n:35, q:'Do you help with design? Do you do 3D renderings?', d:'Selections are made with you at the showroom or on site. ___'},
  {n:36, q:'Can you work with my architect or designer?', d:'___'},
  {n:37, q:'Can you help with HOA approval?', d:'___'},
 ]},
 {k:'restore', t:'Restoration and emergencies', sub:'', qs:[
  {n:38, q:'I have water damage right now. Can someone come tonight?', d:'___', h:'Your out-of-hours number and hours, or "call first thing in the morning".'},
  {n:39, q:'Do you remove popcorn ceilings? What about asbestos or lead paint?', d:'___', h:'Older textured ceilings can contain asbestos. Say what you test for and what you hand to a specialist.'},
 ]},
 {k:'company', t:'The company and existing customers', sub:'Most of these are already drafted. Check them and confirm.', qs:[
  {n:40, q:'Do you speak Spanish? / ¿Hablan español?', d:'Yes. Call ___ and ask for ___, who speaks Spanish.', alt:'The chat can answer in Spanish. For a call in Spanish, please leave your number and we will arrange it.', h:'The chat now has a Spanish version. This is about who can talk to a customer in Spanish.'},
  {n:41, q:'How long have you been in business?', d:'Since 1989. Shawn and Nancy Waziri have run the company from day one.', ready:true},
  {n:42, q:'Where can I read your reviews?', d:'There are customer reviews on our home page, and on Google at ___.'},
  {n:43, q:'Do you have a referral program?', d:'___'},
  {n:44, q:'I already got an estimate. How do I follow up?', d:'Call or text '+PHONE+' with your reference number and we\'ll pick it up from there.', ready:true},
  {n:45, q:'I have a problem with work you finished.', d:'Sorry to hear it. Please call '+PHONE+' or leave your details here and Shawn or Nancy will call you back.', ready:true},
  {n:46, q:'Can I text you photos of my project?', d:'Yes. Text them to '+PHONE+', or add them on the estimate form.', ready:true},
 ]},
 {k:'others', t:'People who aren\'t customers', sub:'Sales pitches are already most of the non-customer traffic.', qs:[
  {n:47, q:'I sell marketing, SEO or software. Who do I talk to?', d:'Thanks. Please email info.interiordesignflooring@gmail.com and we\'ll reply if it\'s a fit.', ready:true},
  {n:48, q:'Are you hiring?', d:'___', h:'Where to send a resume, or "not right now".'},
  {n:49, q:'I\'m a subcontractor looking for work.', d:'___'},
 ]},
];

export const ownerQuestions = ownerSections.flatMap((s) => s.qs);
export const ownerQuestionId = (n: number) => 'q' + String(n).padStart(2, '0');
