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

/**
 * Customer reviews.
 *
 * Every entry here is a real review, quoted verbatim, with the reviewer's own
 * name as they published it. Nothing in this array may be written, softened,
 * lengthened or invented — a testimonial attributed to a named person who did
 * not say it is a false endorsement, and since the FTC's rule on consumer
 * reviews took effect in 2024 it carries civil penalties per violation as well
 * as the ordinary defamation and right-of-publicity exposure.
 *
 * `rating` is the star rating the reviewer actually gave. It is optional
 * precisely so that it is never guessed: a card with no recorded rating shows
 * the quote without stars rather than assuming five.
 */
export interface Review {
  /** The reviewer's name exactly as they published it. */
  name: string;
  /** What the job was, in a few words. Ours, not theirs. */
  context: string;
  /** The review, word for word. Never edited, never shortened. */
  quote: string;
  /** The stars they actually gave. Omit rather than guess. */
  rating?: 1 | 2 | 3 | 4 | 5;
  /** Where it was published. Shown on the card, so it has to be accurate. */
  source?: 'Google' | 'Facebook' | 'Houzz' | 'Yelp';
}

export const reviews: Review[] = [
  {
    name: 'High Quality Motors',
    context: 'Commercial remodel',
    quote:
      'Interior design flooring did my whole car dealership remodel. They really took their ' +
      'time. They explained everything to me. I cannot be happier. They exceeded my ' +
      'expectations!!! I love the fact that they are very honest about the pricing I had a lot ' +
      'of contractors come out trying to overcharge me $75,000–$100,000. Interior design did ' +
      'that in half the cost, but also KEPT THE SAME QUALITY. Do not go to any other ' +
      'contractor. I recommend everyone from the DC Maryland, Virginia area and all my family ' +
      'and friends to go through Interior Design Flooring.',
  },
  {
    name: 'Carlos Henao',
    context: 'Bathroom renovation, then siding and gutters',
    // "Sean" is how this reviewer spelled the owner's name, four times. It is
    // not a typo in this file and the owner has confirmed it stays. Respelling
    // it to "Shawn" would be editing a quoted person's words.
    quote:
      'We’ve worked with Sean and Nancy on two different occasions. First time was to renovate ' +
      'our bathroom. Sean is good at listening to your needs and making suggestions to improve ' +
      'on them. We are very pleased how our bathroom turned out. The process was fairly ' +
      'painless with a few hiccups along the way but Sean was able to work through them. Second ' +
      'time, they replaced our siding, gutters, fascia and painted the window trims. Again, ' +
      'very easy process, all we had to do was select the colors and get HOA approval. They ' +
      'found 12 pieces of rotted plywood, which Sean communicated to us, they also added a ' +
      'vapor barrier to bring the home up to code. Both times prices were very reasonable and ' +
      'work was good quality. I recommend them to anyone looking to renovate their home.',
  },
  {
    name: 'Justin Drunagel',
    context: 'Flooring install',
    quote:
      'Nancy, Shawn, and the team at Interior Design Flooring did a great job on our small ' +
      'flooring install project. They picked up the slack where another team (Home Depot ' +
      'contractor) was unable or unwilling to finish the job they started. They were able to ' +
      'step in and finish the job for us on a quick turnaround which was a huge help.',
  },
  {
    name: 'Suzanna Jenkins',
    context: 'Hardwood and railing',
    quote:
      'Amazing outcome. I worked with Shawn and Nancy on putting hardwoods and railing on my ' +
      'stairs, catwalk, and into my family room. They were able to match the wood from my ' +
      'original floors and they did an excellent job. Shawn and Nancy stayed with our budget ' +
      'and we are very pleased. They were very professional and communicative throughout the ' +
      'whole job. Definitely will recommend to friends and family.',
  },
];

/**
 * Reviewers the owner has asked to add, by name only.
 *
 * These five are held here rather than in `reviews` because a name is not a
 * review: publishing a quote next to one of these names means writing words
 * that person never said. The carousel is built and will show them the moment
 * the verbatim text arrives - paste each review exactly as published,
 * along with the star rating given, and move the entry into `reviews` above.
 *
 * Source them from the Google Business Profile, which is where the owner
 * reads them: Google Business Profile > Reviews > copy the text.
 */
export const reviewsPending = ['Jeremy Smith', 'Samantha Scott', 'Sam Smith'] as const;

/*
 * To add a review, copy this into the `reviews` array above and fill it in.
 * No other change is needed — the carousel picks it up, shows the stars if
 * `rating` is set and the source label if `source` is set.
 *
 *   {
 *     name: 'Jeremy Smith',
 *     context: 'Kitchen remodel',        // what the job was, in a few words
 *     rating: 5,                          // the stars they actually gave
 *     source: 'Google',
 *     quote: 'Paste the review here, word for word, exactly as published.',
 *   },
 *
 * The one rule: `quote` is transcription, not writing. If the text is not to
 * hand, leave the reviewer in `reviewsPending` — an empty slot costs nothing,
 * an invented quote attributed to a real person is a false endorsement.
 */


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

/**
 * "List your home" intake.
 *
 * A separate form from the estimate request because it asks a different
 * question and reaches a different desk. It posts to the same endpoint with
 * `enquiry` set, so the notification email says which one arrived.
 *
 * Note what this form does NOT collect: no income, no employment, no date of
 * birth, no social security number, nothing that would make an inbox a
 * liability. Name, how to reach them, the address, and what they want to do
 * with it is enough to start a conversation.
 */
export const listing = {
  heading: 'List your home with Interior Design Flooring.',
  standfirst:
    'One team to list it, sell it or rent it, and renovate it. Tell us about the property and our in-house realtor will call you back.',
  intent: [
    'Sell my home',
    'Rent out my property',
    'Buy a home',
    'Find a rental',
    'Sell commercial property',
    'Rent out commercial property',
    'Sell land',
    'Buy land',
    'Not sure yet',
  ],
  propertyType: [
    'Single-family home',
    'Townhouse',
    'Condominium',
    'Multi-family',
    'Commercial',
    'Land',
    'Other',
  ],
  timeline: [
    'As soon as possible',
    'Within 1-3 months',
    'Within 3-6 months',
    '6 months or more',
    'Just exploring',
  ],
  points: [
    {
      title: 'One team, start to finish',
      detail:
        'The realtor who lists your property and the contractor who prepares it work for the same company, so nothing falls between them.',
    },
    {
      title: 'We know what work pays back',
      detail:
        'Thirty-five years of renovation work behind the listing advice, so the recommendation is what actually needs doing rather than a wish list.',
    },
    {
      title: 'Renovation credit for qualifying clients',
      detail:
        'Buy or sell through our in-house realtor and use us for the work, and you may qualify for a renovation discount or credit. Terms are confirmed in writing before the project begins.',
    },
  ],
} as const;

/**
 * Real estate.
 *
 * COPY APPROVED BY THE OWNER, NOT YET CLEARED TO PUBLISH. See the
 * `features.realEstate` gate for what is missing and why. Everything below is
 * written from the owner's own list of services and says nothing about
 * outcomes, prices, timescales or market conditions.
 *
 * Two lines are deliberately absent and must not be added:
 *   - any claim about what a property will sell or rent for
 *   - any stated commission rate or discount percentage, until the owner
 *     supplies the actual terms in writing
 */
export const realEstate = {
  standfirst:
    'Buy, sell, rent, build and renovate through one team.',
  intro: [
    'Our in-house realtor handles the property side of the work, so the same people who renovate a house can also help you list it, sell it, or find it a tenant.',
    'That matters most when the two are connected: a listing that needs work before it goes up, an investment property bought for what it could become, or a piece of land bought to build on.',
  ],
  services: [
    { title: 'List and sell homes', detail: 'Residential listings, from preparing the property to closing.' },
    { title: 'List rental properties and find tenants', detail: 'Marketing the property and placing a tenant in it.' },
    { title: 'Help buyers purchase homes', detail: 'Representing buyers through search, offer and settlement.' },
    { title: 'Help renters find homes', detail: 'Finding and securing a rental for tenants.' },
    { title: 'Residential and commercial', detail: 'Sales and rentals on both sides of the market.' },
    { title: 'Land purchases and sales', detail: 'Buying and selling raw and improved land.' },
    { title: 'Investment properties and fixer-uppers', detail: 'Properties bought for the work they need rather than the state they are in.' },
    { title: 'Land for custom home construction', detail: 'Finding a site to build on, with the builder already at the table.' },
    { title: 'Renovation and development potential', detail: 'Helping investors identify properties worth taking on.' },
  ],
  discount: {
    title: '10% off your renovation',
    body: [
      'Buy or sell through our in-house realtor and use Interior Design Flooring for the renovation or construction work, and you get 10% off the project.',
      'Additional discounts depend on the scope of the work. Ask us when you call and we will confirm everything in writing before the project begins.',
    ],
  },
  /**
   * The in-house realtor, as named by the owner.
   *
   * Ali Waziri (0225273277) was removed: his licence is reported inactive, and
   * an inactive licensee cannot be advertised as providing brokerage services.
   * Restore him only against an active status on the DPOR lookup.
   *
   * The number is a Virginia real estate licence. The 0225 prefix is the
   * salesperson series, not a firm — which is the whole problem with
   * publishing this page as it stands. See the note on `realEstateLicence`.
   */
  realtors: [{ name: 'Sameer Waziri', licence: '0225273319' }],
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
   * Three states, not two:
   *   false     - the page renders a blocked notice and nothing else
   *   'preview' - the full page renders for review, carries a notice saying
   *               it is not cleared, stays out of the nav and out of search
   *   true      - published: page renders clean and appears in the nav
   *
   * Currently 'preview' so the owner can read and approve the copy, which is
   * what they asked for, without the site advertising brokerage services it
   * cannot yet lawfully advertise.
   *
   * To reach `true`, one thing is needed: the Virginia real estate FIRM
   * licence number of the entity doing the advertising, set as
   * `realEstateLicence` below. Virginia requires the licensed firm's name in
   * advertising, and individual agents licensed under some other brokerage
   * does not satisfy it. Do not open this gate on verbal assurance; the
   * licence number is the assurance.
   */
  realEstate: 'preview' as false | 'preview' | true,

  /**
   * On-site finance application.
   *
   * BLOCKED, permanently, and no longer read by any page — kept as the record
   * of a decision rather than as a switch. Do not wire it back up.
   *
   * A pre-approval form collects income and identity data, which belongs on a
   * lender's own secured portal and not on a static marketing site. The
   * Financing page used to reserve a slot for an outbound link to that portal
   * once the lender was named; on the client's instruction it no longer does.
   * The page routes to a conversation instead — no form, no lender link, no
   * lender named — so there is nothing left for this flag to gate.
   */
  financeApplication: false,
} as const;

/**
 * The advertising disclosure Virginia requires on real estate advertising.
 *
 * THE OWNER HAS ASKED TO LEAVE THE FIRM OUT — "that changes often" — and to
 * name the two salespeople only. That cannot be done, and the reason is worth
 * writing down so nobody relitigates it from memory:
 *
 * A salesperson licence is held *under* a brokerage. Virginia requires the
 * licensed firm's name in real estate advertising precisely so the public can
 * tell which brokerage stands behind the advert. Naming two salespeople and
 * no firm is the specific thing the rule exists to prevent, and the exposure
 * lands on their licences, not on the website.
 *
 * "It changes often" argues for putting it in, not leaving it out: whichever
 * brokerage they hang their licences with today is the one legally answerable
 * for this page today. Updating it later is one line in this file.
 *
 * NAMING THE FIRM MAKES A SECOND PROBLEM VISIBLE, and it is the larger one.
 *
 * The brokerage Sameer's licence is reported to hang under is Samson Companies
 * LLC — a different company from Interior Design Flooring. If that holds, then
 * every "in-house realtor", "one team" and "same company" line on this page is
 * inaccurate: IDF does not provide brokerage services, Samson does, and a
 * client buying or selling contracts with Samson. Advertising another firm's
 * brokerage as your own in-house service is the misrepresentation the naming
 * rule exists to catch, and the 10% credit for using that realtor then becomes
 * a thing of value moving between two companies for referred settlement-service
 * business — which is the federal question the README already flags.
 *
 * The licence half of that is now answered: Samson Companies LLC, 0226021529,
 * both recorded below and rendering in the disclosure.
 *
 * ONE QUESTION IS LEFT, and it is a question for Sameer, not for the records:
 * what his actual relationship to Interior Design Flooring is. The licence says
 * where his licence hangs; it does not say whether he is IDF staff licensed
 * outside, a part-owner of an affiliated firm, or an independent referral
 * partner. Each gives different honest copy, and the page currently assumes the
 * one reading the licence contradicts.
 *
 * So the gate stays at 'preview' on a copy problem, not a licensing one. Ask
 * him, then rewrite these lines to match the answer and open it:
 *   - realEstate.intro           'our in-house realtor'
 *   - realEstate.pillars         'One team, start to finish' / 'same company'
 *   - listYourHome               'our in-house realtor will call you back'
 *   - HomeSections.astro         'Our in-house realtor sells and rents ...'
 *   - real-estate.astro          'Our in-house realtor' heading
 *   - list-your-home.astro       meta description
 *
 * The 10% credit needs the same answer before it can stand. Between two
 * genuinely separate companies it is a thing of value for referred
 * settlement-service business, which is the federal question, not a discount.
 */
export const realEstateLicence = {
  /**
   * The brokerage Sameer Waziri's licence hangs under, and the name that must
   * appear on any real estate advertising this site carries.
   *
   * Spelled in title case deliberately: DPOR records it in capitals, as
   * registries do, and setting a company name in full capitals in body copy is
   * a house-style artefact rather than part of the name.
   */
  firmName: 'Samson Companies LLC',
  /**
   * The firm's own licence. A different series from the 0225 salesperson
   * numbers, consistent with a firm licence — worth confirming once on the
   * DPOR lookup, since publishing a wrong number is worse than publishing none.
   */
  licenceNumber: '0226021529',
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
 * Project gallery.
 *
 * These are the company's own photographs, taken from the "By owner" tab of
 * its Google Maps listing — the filter that separates what the business
 * uploaded from what visitors posted. Owner uploads are the company's to
 * publish. The content agrees: crews at work, framing mid-install, job sites.
 *
 * This replaced an earlier set saved from the company's Yelp listing. Those
 * were posted by customers, and a photograph posted in a review belongs to
 * whoever took it — not to the business being reviewed — so they could not be
 * published here at any resolution. Provenance is the question to ask of any
 * image before it is added, not after.
 *
 * Captions describe only what is visible. No addresses, client names, budgets,
 * square footage or dates: none were supplied and none are guessed.
 */
export const gallery = [
  {
    slot: 'project-kitchen-blue-island',
    caption: 'Kitchen remodel',
    detail: 'Blue base cabinetry, waterfall quartz, integrated cooktop.',
    alt: 'A remodelled kitchen with deep blue base cabinets, a thick white quartz island with grey veining, stainless appliances and hardwood floors.',
    ratio: '3 / 4',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-framing-interior',
    caption: 'Interior framing',
    detail: 'New joists and studs going in behind the finishes.',
    alt: 'A worker on a ladder installing framing, with exposed ceiling joists and new stud walls around him.',
    ratio: '3 / 4',
    tags: ['In progress'],
  },
  {
    slot: 'project-siding-crew',
    caption: 'Exterior siding and trim',
    detail: 'Two-storey siding and trim work from ladders.',
    alt: 'Two workers, one on a ladder, replacing siding and trim on the upper storey of a house.',
    ratio: '4 / 3',
    tags: ['Exterior'],
  },
  {
    slot: 'project-kitchen-cream',
    caption: 'Kitchen remodel, cream cabinetry',
    detail: 'Raised-panel cabinets, granite counters, full appliance run.',
    alt: 'A kitchen with cream raised-panel cabinets, speckled granite counters, wall ovens and a centre island.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-kitchen-cream-wide',
    caption: 'Kitchen, island and range wall',
    detail: 'The same kitchen from the adjoining room.',
    alt: 'A cream-cabinet kitchen seen across a granite-topped island, with pendant lights above.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-stairs-hardwood',
    caption: 'Hardwood stairs and landing',
    detail: 'Treads, risers and a curved landing, finished and sealed.',
    alt: 'Glossy hardwood stair treads curving up to a landing, with white risers and a painted balustrade.',
    ratio: '3 / 4',
    tags: ['Flooring'],
  },
  {
    slot: 'project-bath-shower-marble',
    caption: 'Shower enclosure',
    detail: 'Marble-look tile, recessed niche, frameless glass.',
    alt: 'A tiled shower enclosure in marble-look porcelain with a vertical mosaic niche and a frameless glass door.',
    ratio: '3 / 4',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-porch-framing',
    caption: 'Covered porch, framing stage',
    detail: 'Posts, beams and roof structure set.',
    alt: 'A new covered porch under construction, its timber posts and gable roof framing complete against a blue sky.',
    ratio: '4 / 3',
    tags: ['In progress'],
  },
  {
    slot: 'project-floor-dark-hardwood',
    caption: 'Dark hardwood flooring',
    detail: 'Wide boards run through an open plan, daylight across the finish.',
    alt: 'An empty open-plan room with dark hardwood flooring and square columns, sunlight falling across the boards.',
    ratio: '4 / 3',
    tags: ['Flooring'],
  },
  {
    slot: 'project-kitchen-pendants',
    caption: 'Kitchen, pendants and island',
    detail: 'Lantern pendants over a quartz island.',
    alt: 'A finished kitchen with three lantern pendant lights above a white quartz island.',
    ratio: '3 / 4',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-counter-quartz',
    caption: 'Quartz counters and backsplash',
    detail: 'Veined quartz surface run through to the backsplash.',
    alt: 'A white quartz countertop with grey veining, continuing up the wall as a matching backsplash.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-framing-joists',
    caption: 'Structural work in progress',
    detail: 'Ceiling joists and stud walls opened up.',
    alt: 'An interior stripped to its framing, showing new ceiling joists and stud walls, with a worker at the far end.',
    ratio: '4 / 3',
    tags: ['In progress'],
  },
  {
    slot: 'project-kitchen-dark-granite',
    caption: 'Kitchen, dark granite',
    detail: 'Dark granite counters, tiled backsplash, stainless appliances.',
    alt: 'A kitchen with dark speckled granite counters, a grey tiled backsplash and stainless steel appliances.',
    ratio: '4 / 3',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-siding-ladder',
    caption: 'Siding replacement',
    detail: 'Upper-storey work above a rear deck.',
    alt: 'A worker high on an extension ladder replacing siding on the top floor of a house above a deck.',
    ratio: '3 / 4',
    tags: ['Exterior'],
  },
  {
    slot: 'project-porch-build',
    caption: 'Rear addition under construction',
    detail: 'Structure framed and tied into the existing house.',
    alt: 'A rear porch addition mid-construction, framing tied into the back of a house, with workers on site.',
    ratio: '3 / 4',
    tags: ['In progress'],
  },
  {
    slot: 'project-kitchen-blue-island-wide',
    caption: 'Kitchen island and range',
    detail: 'The same island seen from the living side.',
    alt: 'A kitchen island in blue cabinetry with a white quartz top and gas cooktop, viewed from the adjoining living room.',
    ratio: '3 / 4',
    tags: ['Remodeling'],
  },
  {
    slot: 'project-kitchen-cream-ovens',
    caption: 'Kitchen fit-out in progress',
    detail: 'Cabinetry and appliances set, finishes under way.',
    alt: 'A cream-cabinet kitchen with stainless double ovens installed, protective sheeting still on the floor.',
    ratio: '4 / 3',
    tags: ['Remodeling','In progress'],
  },
  {
    slot: 'project-soffit-insulation',
    caption: 'Soffit and insulation work',
    detail: 'Insulation set into a porch ceiling before boarding.',
    alt: 'A worker lifting a batt of insulation into the ceiling of a covered porch.',
    ratio: '3 / 4',
    tags: ['In progress'],
  },
  {
    slot: 'project-porch-roof',
    caption: 'Porch roof framing',
    detail: 'Rafters set against the sky before sheathing.',
    alt: 'Roof rafters of a new porch structure silhouetted against a bright sky, with a worker on a ladder.',
    ratio: '3 / 4',
    tags: ['In progress'],
  },
  {
    slot: 'project-decks-townhomes',
    caption: 'Decks and railings',
    detail: 'Balconies and railings across a run of townhomes.',
    alt: 'A row of townhomes with white-railed balconies and decks above the garages.',
    ratio: '4 / 3',
    tags: ['Exterior'],
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
