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
  /**
   * Budget bands. These are qualifying ranges for the intake form, not price
   * claims — nothing on the site states what any kind of work costs. The
   * owner has not set the band edges yet, so these are provisional and must
   * be confirmed before launch.
   */
  budget: [
    'Under $25,000',
    '$25,000 – $75,000',
    '$75,000 – $150,000',
    '$150,000 – $400,000',
    'Over $400,000',
    'Not sure yet',
  ],
  timeframe: [
    'As soon as possible',
    'Within 1–3 months',
    'Within 3–6 months',
    '6 months or more',
    'Still planning',
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
  // Phone label. The bar sits above the fold and the full label crowds the
  // headline off the line at 375px.
  ctaShort: 'Free estimate',
} as const;

// Slots that exist but are blocked pending client confirmation. Render these
// visibly as blocked — never soften into publishable copy. Empty for now: the
// service area was the last entry and has been confirmed.
export const blocked = {} as const;

/**
 * Service area — confirmed as the DMV, resolving the contradiction between the
 * intake form (DC/VA/MD) and the older marketing line ("Serving Northern
 * Virginia"). The intake form was right.
 *
 * OPEN QUESTION, raised with the owner and not settled here. The company holds
 * a Virginia Class A licence, which is the only licence number on this site.
 * Contracting in the other two jurisdictions is licensed separately —
 * Maryland through the MHIC, the District through its own home improvement
 * contractor licence. Advertising work in a jurisdiction without holding its
 * licence is the same class of exposure as the real estate page. If those
 * licences do not exist, this should come back to Virginia only.
 */
export const serviceArea = {
  short: 'Washington DC, Maryland & Virginia',
  regions: ['Washington, DC', 'Maryland', 'Virginia'],
  detail: 'Serving the greater DMV area from our Sterling showroom.',
} as const;

/* ------------------------------------------------------------------
   Feature gates.

   A gated section renders nothing but a blocked notice until the gate
   is opened, and is omitted from navigation. This is deliberate: some
   of the owner's requested content cannot be published until a legal
   question is settled, and a comment in a file is not a strong enough
   safeguard against it shipping by accident.
   ------------------------------------------------------------------ */
export const features = {
  /**
   * Real estate / brokerage services.
   *
   * BLOCKED. Advertising brokerage services in Virginia requires the
   * advertising entity to hold a real estate FIRM licence — it is not
   * enough for individual agents to be licensed elsewhere, and ads must
   * carry the licensed brokerage name. Until we have the firm licence
   * number, this stays off. Do not open this gate on verbal assurance.
   */
  realEstate: false,

  /**
   * On-site finance application.
   *
   * BLOCKED. A pre-approval form collects income and identity data. That
   * belongs on the lender's own secured portal, not on a static marketing
   * site with no backend. The Financing page links out instead.
   */
  financeApplication: false,
} as const;

/** Main navigation, in the owner's requested order. */
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Services', href: '/services/' },
  { label: 'Custom Homes', href: '/custom-homes/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Real Estate', href: '/real-estate/', gated: 'realEstate' },
  { label: 'Investors', href: '/investors/' },
  { label: 'Financing', href: '/financing/' },
  { label: 'Contact', href: '/contact/' },
] as const;

/** Services, grouped as the owner listed them. */
export const serviceGroups = [
  {
    id: 'remodeling',
    title: 'Remodeling',
    items: ['Kitchens', 'Bathrooms', 'Basements', 'Additions', 'Full home renovations'],
  },
  {
    id: 'interior-exterior',
    title: 'Interior & exterior',
    items: ['Flooring', 'Interior finishes', 'Siding, gutters, fascia and trim', 'Exterior remodeling'],
  },
  {
    id: 'commercial',
    title: 'Commercial',
    items: ['Commercial renovations', 'Tenant fit-outs', 'Retail and office spaces'],
  },
  {
    id: 'restoration',
    title: 'Restoration',
    items: [
      'Insurance restoration',
      'Mold remediation',
      'Water and structural repair',
      'Fire and storm damage repair',
      'Bringing work up to code',
    ],
  },
  {
    id: 'permits',
    title: 'Permits & inspections',
    items: ['Permit applications', 'Scheduling inspections', 'Code compliance'],
  },
] as const;

/**
 * DO NOT USE THE YELP PHOTOGRAPHS.
 *
 * The nine images originally catalogued here were saved from the company's
 * Yelp listing, and the owner has confirmed they were posted by customers.
 * Photographs posted by a customer belong to that customer — not to the
 * business the review is about — so Interior Design Flooring cannot publish
 * them on its own site, at any resolution. Yelp's own terms do not grant that
 * right either.
 *
 * Everything below therefore describes slots waiting on replacement imagery
 * from footage and photographs the company itself owns. If a file named
 * project-1.jpg through project-9.jpg turns up in public/img/, it is almost
 * certainly one of the Yelp saves and must not be committed.
 *
 * Project gallery.
 *
 * One entry per photograph the owner supplied. `slot` is the base filename in
 * public/img/ — src/lib/images.ts resolves it at build time, so an entry whose
 * file is not present falls back to its reserved placeholder and can never ship
 * as a broken image.
 *
 * Captions describe only what is visible in the photograph. No addresses, no
 * client names, no budgets, no square footage, no dates — none of that has been
 * supplied and none of it is guessed. `alt` is written for a screen reader
 * describing the same thing.
 */
export const gallery = [
  {
    slot: 'project-kitchen-cream-wide',
    caption: 'Kitchen remodel',
    detail: 'Raised-panel cabinetry, granite counters and a full appliance run.',
    alt: 'A remodelled kitchen with cream raised-panel cabinets, speckled light granite counters, black wall ovens and a centre island under pendant lights.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-kitchen-cream',
    caption: 'Kitchen remodel, island and range wall',
    detail: 'The same kitchen seen from the adjoining room.',
    alt: 'A cream-cabinet kitchen viewed through a wide doorway, with a granite-topped island in the foreground and pendant lights above it.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-island-blue-quartz',
    caption: 'Kitchen island, waterfall quartz',
    detail: 'Blue base cabinetry, mitred waterfall edge, integrated cooktop and beverage fridge.',
    alt: 'A large kitchen island with deep blue cabinets and a thick white quartz top with grey veining running down the side to the floor.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-tile-install',
    caption: 'Large-format tile going in',
    detail: 'Marble-look porcelain with a black inlay band, set and grouted on site.',
    alt: 'Four installers working on a floor of large white marble-look tiles with black inlay strips, with a wet saw and vacuum beside them.',
    ratio: '4 / 3',
    tags: ['Flooring', 'In progress'],
    inProgress: true,
  },
  {
    slot: 'project-floor-medallion',
    caption: 'Compass medallion inlay',
    detail: 'Cut-stone medallion set into the surrounding tile field.',
    alt: 'A circular compass-rose medallion of cut stone set into a polished marble-look tile floor.',
    ratio: '1 / 1',
    tags: ['Flooring'],
  },
  {
    slot: 'project-staircase',
    caption: 'Staircase and millwork',
    detail: 'Curved stair, wrought-iron balusters, raised-panel wainscoting and hardwood.',
    alt: 'A curved staircase with dark wood treads and handrail, scrolled wrought-iron balusters, white raised-panel wainscoting and a dark hardwood floor.',
    ratio: '3 / 4',
    tags: ['Interior finishes'],
  },
  {
    slot: 'project-bath-freestanding',
    caption: 'Primary bath',
    detail: 'Freestanding tub, floor-mounted filler, marble-look tile surround.',
    alt: 'A white freestanding oval bathtub with a floor-mounted chrome filler, set in front of three windows against a marble-look tiled wall.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-siding',
    caption: 'Siding and exterior work',
    detail: 'Two-storey siding replacement over a screened porch and deck.',
    alt: 'Two workers on extension ladders installing siding on the upper storey of a house above a screened porch and deck.',
    ratio: '4 / 3',
    tags: ['Exterior', 'In progress'],
    inProgress: true,
  },
  {
    slot: 'project-bath-vanity',
    caption: 'Bathroom, tub surround and vanity',
    detail: 'Drop-in tub in a tiled surround, wood vanity, patterned floor border.',
    alt: 'A bathroom with a drop-in tub set into a tiled surround, a medium-wood vanity with a large mirror, and a tile floor with a patterned inlay border.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
    /**
     * Flagged for the owner. This photograph reads as a different era and
     * finish quality from the rest of the set. Confirm it is our own completed
     * work before it goes live — the brief bars stock imagery, and a photo we
     * cannot source is not worth the risk on a portfolio page.
     */
    confirm: true,
  },
] as const;

/**
 * Insurance restoration.
 *
 * The owner's instruction is explicit: do not advertise that we negotiate or
 * settle insurance claims. That instruction also happens to be the legal line.
 * Acting for a policyholder in negotiating or settling a claim is public
 * adjusting, which Virginia licenses separately (Title 38.2). A contractor who
 * does it unlicensed is exposed, and so is the homeowner's claim.
 *
 * So the scope here is repair work and our own paperwork, and the limit is
 * stated on the page rather than left to inference. Three things must never be
 * added to this section:
 *   - any claim to negotiate, settle, handle, maximise or fight a claim
 *   - any offer to waive, discount, absorb or "work around" a deductible,
 *     which is insurance fraud in Virginia regardless of intent
 *   - any promise about what the insurer will cover or pay
 */
export const insuranceRestoration = {
  title: 'Insurance restoration',
  standfirst: 'Repairs after water, mold, fire, storm and other property damage.',
  intro: [
    'When a loss damages your property, we handle the repair side of it: documenting what was affected, writing a detailed repair estimate for your insurance file, doing the remediation, and rebuilding the areas that were damaged.',
    'One licensed contractor from the documentation through to the final finish, so the scope that gets written is the scope that gets built.',
  ],
  items: [
    {
      title: 'Damage documentation',
      detail:
        'Photographs and a written record of the affected areas and materials, taken while the damage is still visible.',
    },
    {
      title: 'Detailed repair estimates',
      detail:
        'A line-item estimate of the repair scope, itemised so it can go into your insurance file.',
    },
    {
      title: 'Communication about our estimate',
      detail:
        'If your adjuster has questions about our scope or our pricing, we explain and stand behind our own figures.',
    },
    {
      title: 'Restoration and remediation',
      detail:
        'Mold remediation, water and structural repair, and bringing the affected area back to a state where it can be rebuilt.',
    },
    {
      title: 'Complete reconstruction',
      detail:
        'Full rebuild of the damaged areas, finished by the same licensed contractor who wrote the estimate.',
    },
  ],
  /**
   * Published on the page, deliberately. Stating the limit plainly is better
   * for the owner than leaving a homeowner to assume we will run their claim.
   */
  limit: {
    title: 'What we do not do',
    body:
      'We are a licensed contractor, not a public adjuster. We do not negotiate your claim, settle it, or represent you to your insurer — those are separately licensed activities in Virginia. What your policy covers and what your insurer pays is between you and your insurance company.',
  },
} as const;

/** Custom home process, in the owner's sequence. */
export const customHomeSteps = [
  { number: '01', title: 'Design & planning', detail: 'Layout, scope and budget agreed before anything is ordered.' },
  { number: '02', title: 'Permits', detail: 'We file the applications and carry the approvals.' },
  { number: '03', title: 'Ground up construction', detail: 'Foundation through framing, systems and envelope.' },
  { number: '04', title: 'Material selections', detail: 'Chosen with you, at the showroom or on site.' },
  { number: '05', title: 'Completion & walkthrough', detail: 'Finished, inspected and handed over.' },
] as const;

export const customHomeOffers = [
  { title: 'Building from the ground up', detail: 'Full custom homes, start to finish, on your timeline.' },
  { title: 'Build on your lot', detail: 'Already own land? We build on it.' },
  { title: 'Townhomes & duplexes', detail: 'Multi-unit residential construction.' },
] as const;

/**
 * Investor programme. These are commercial terms the owner has asked to
 * offer. No specific percentages or dollar figures appear until he sets
 * them — the page describes the benefit and routes to a conversation.
 */
export const investorBenefits = [
  { title: 'Preferred, volume-based pricing', detail: 'Pricing improves as your volume with us grows.' },
  { title: 'Multi-property discounts', detail: 'Better rates when you bring more than one property.' },
  { title: 'Renovation packages', detail: 'Scoped packages built around investor work.' },
  { title: 'Fix-and-flip packages', detail: 'Turnaround work priced and scheduled for resale timelines.' },
  { title: 'Rental turnover pricing', detail: 'Fast, repeatable pricing between tenants.' },
  { title: 'Priority scheduling', detail: 'Repeat investors go to the front of the schedule.' },
  { title: 'Faster estimating', detail: 'Quicker turnaround than our standard 24 hours where we already know the property type.' },
] as const;
