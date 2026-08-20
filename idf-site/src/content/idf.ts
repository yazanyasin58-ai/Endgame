/**
 * Single source of approved content for Interior Design Flooring.
 * Every fact here traces to the build brief. Versions import from this
 * module only — no version may carry its own copy of a fact or review.
 */

export const business = {
  name: 'Interior Design Flooring',
  lockup: 'CONSTRUCTION & REMODELING',
  established: '1989',
  yearsInBusiness: '37',
  address: '45431 Ruritan Circle, Suite 160, Sterling, VA 20164',
  phonePrimary: '703-430-8129',
  phonePrimaryHref: 'tel:+17034308129',
  phonePrimarySms: 'sms:+17034308129',
  phoneSecondary: '571-233-5133',
  email: 'interiordesignflooring@gmail.com',
  license: 'Virginia Class A General Contractor #2705162130',
  licenseShort: 'Class A #2705162130',
  licenseNumber: '2705162130',
  owners: 'Shawn and Nancy Waziri',
  region: 'Northern Virginia',
  tagline: 'One Team. One Vision. One Build. No Middlemen. No Delays.',
} as const;

export const trustBar = [
  'Licensed & Insured',
  'Class A #2705162130',
  'Since 1989',
  'Residential & Commercial',
] as const;

export const pillars = [
  {
    id: 'build-new',
    number: '01',
    title: 'BUILD NEW',
    services: ['Custom Homes', 'Ground Up Construction', 'Townhomes & Duplexes'],
  },
  {
    id: 'renovate',
    number: '02',
    title: 'RENOVATE',
    services: ['Full Home Renovations', 'Additions', 'Kitchen and Bath Remodeling'],
  },
  {
    id: 'transform',
    number: '03',
    title: 'TRANSFORM',
    services: ['Basements', 'Interior & Exterior Remodeling', 'Commercial Construction'],
  },
] as const;

export const wedge = {
  tagline: business.tagline,
  // Owner-direct accountability copy. No competitor names.
  heading: 'You talk to the owner. Start to finish.',
  body: [
    'No layers. No hand-offs. When you hire Interior Design Flooring, you work directly with Shawn and Nancy Waziri — the same two people who have run this company since 1989.',
    'The person who walks your site, writes your estimate, and stands behind the work is the owner. Not a project manager you met once.',
  ],
} as const;

export const projects = [
  {
    name: 'Great Falls Project',
    named: true,
  },
  {
    name: 'Maryland Project',
    named: true,
  },
  {
    name: null, // unnamed placeholder — client is compiling a fuller list
    named: false,
  },
] as const;

// The only four approved reviews. Homepage shows two; High Quality Motors leads.
export const reviews = {
  highQualityMotors: {
    name: 'High Quality Motors',
    context: 'Commercial remodel',
    quote:
      'Interior Design Flooring did my whole car dealership remodel. They really took their time. They explained everything to me. I cannot be happier. They exceeded my expectations. I had a lot of contractors come out trying to overcharge me $75,000–$100,000. Interior Design did that in half the cost, but also kept the same quality. Do not go to any other contractor.',
  },
  suzannaJenkins: {
    name: 'Suzanna Jenkins',
    context: 'Hardwood and railing',
    quote:
      'Amazing outcome. I worked with Shawn and Nancy on putting hardwoods and railing on my stairs, catwalk, and into my family room. They were able to match the wood from my original floors and they did an excellent job. Shawn and Nancy stayed with our budget and we are very pleased.',
  },
} as const;

export const homepageReviews = [reviews.highQualityMotors, reviews.suzannaJenkins];

// The real five-step sequence. "Estimate within 24 hours" is the differentiator.
export const processSteps = [
  { number: '01', title: 'Call us', detail: 'Reach Shawn or Nancy directly at 703-430-8129.' },
  { number: '02', title: 'Describe the work', detail: 'Tell us the type of project and the address.' },
  { number: '03', title: 'Site visit', detail: 'We walk the project site ourselves.' },
  {
    number: '04',
    title: 'Estimate within 24 hours',
    detail: 'Your written estimate arrives within one day of the visit.',
    featured: true,
  },
  { number: '05', title: 'Sign at the showroom', detail: 'Stop by our Sterling showroom to sign the contract.' },
] as const;

export const formFields = {
  typeOfWork: [
    'New Build',
    'Addition',
    'Full Renovation',
    'Kitchen or Bath',
    'Basement',
    'Exterior',
    'Commercial',
    'Flooring',
    'Other',
  ],
} as const;

export const cta = {
  primary: 'Request a Free Estimate',
  secondaryLabel: 'Call 703-430-8129',
} as const;

/**
 * Showroom hours — confirmed by the owner (supersedes both the intake form
 * and the older Google Business Profile figures quoted in the brief).
 * Must stay identical to the Google Business Profile for NAP consistency.
 */
export const hours = [
  { days: 'Monday – Friday', open: '10:00 AM', close: '7:30 PM' },
  { days: 'Saturday', open: '10:00 AM', close: '6:00 PM' },
  { days: 'Sunday', open: '11:00 AM', close: '4:00 PM' },
] as const;

export const social = [
  {
    name: 'Instagram',
    handle: '@interiordesignflooring',
    href: 'https://www.instagram.com/interiordesignflooring/',
  },
] as const;

/**
 * The only figures that appear as statistics. Every one is verifiable —
 * no project counts or customer totals, which cannot be substantiated.
 */
export const figures = [
  { value: '1989', label: 'Established', note: '37 years owner-run' },
  { value: '4.7', label: 'Google rating', note: 'From verified reviews' },
  { value: '24 hrs', label: 'Estimate turnaround', note: 'After the site visit' },
  { value: 'Class A', label: 'Virginia licence', note: '#2705162130' },
] as const;

/**
 * Promotional offer. The owner has approved the headline offer; the terms
 * (cap, eligible work, expiry) are still undefined, so the page directs to a
 * conversation rather than stating conditions we have not been given.
 */
export const promo = {
  headline: '15% off your first project',
  detail: 'New customers. Ask us for details when you request your estimate.',
  cta: 'Request a Free Estimate',
} as const;

// Slots that exist but are blocked pending client confirmation. Render these
// visibly as blocked — never soften into publishable copy.
export const blocked = {
  serviceArea: 'SERVICE AREA LIST — BLOCKED PENDING CLIENT CONFIRMATION',
} as const;

export const versions = [
  { id: 'v1', path: '/v1/', label: 'Monumental Dusk', blurb: 'Architectural editorial — oversized wordmark on a near-black ground, one warm accent.' },
  { id: 'v2', path: '/v2/', label: 'Spec Sheet', blurb: 'Swiss and objective — clipped grotesque wordmark, tabular figures doing the persuading.' },
  { id: 'v3', path: '/v3/', label: 'Plan & Elevation', blurb: 'Split screen — one photograph sells on the left, a working technical panel captures the lead on the right.' },
  { id: 'v4', path: '/v4/', label: 'Warm Cream Editorial', blurb: 'Warm and generous — cream ground, serif display, a single gold action.' },
  { id: 'v5', path: '/v5/', label: 'Field Grid', blurb: 'Dark ground — the work as a tiled grid, three cells swapped for the service pillars.' },
] as const;
