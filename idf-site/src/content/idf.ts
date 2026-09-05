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
  /**
   * 571-233-5133 is the number to reach first, on the owner's instruction.
   * 703-430-8129 stays on the site but no longer leads: it is the number on
   * the Google Business Profile and on existing print, so removing it would
   * strand anyone dialling from those.
   *
   * Both numbers, and their tel:/sms: forms, live here and nowhere else.
   * Swapping which one leads is an edit to these five lines.
   */
  phonePrimary: '571-233-5133',
  phonePrimaryHref: 'tel:+15712335133',
  phonePrimarySms: 'sms:+15712335133',
  phoneSecondary: '703-430-8129',
  phoneSecondaryHref: 'tel:+17034308129',
  /**
   * The address published on every page. Cloudflare Email Routing forwards it
   * to interiordesignconstructiondmv@gmail.com.
   *
   * The estimate form deliberately does NOT notify this address — see
   * DEFAULT_NOTIFY_TO in functions/api/estimate.ts. Mail sent here takes an
   * extra hop through the forwarder, and forwarded mail is the kind that gets
   * dropped on SPF/DMARC. The notification goes straight to the destination
   * inbox instead, which is the same place a human would read it anyway.
   *
   * interiordesignflooring@gmail.com, the owner's older address, is not shown
   * on the site but still receives the form notification. It is on the Google
   * Business Profile and on existing print, so mail arrives there regardless.
   */
  email: 'info@interiordesignconstructiondmv.com',
  license: 'Virginia Class A General Contractor #2705162130',
  licenseShort: 'Class A #2705162130',
  licenseNumber: '2705162130',
  owners: 'Shawn and Nancy Waziri',
  region: 'Northern Virginia',
  tagline: 'One Team. One Vision. One Build. No Middlemen. No Delays.',
} as const;

/**
 * COMMERCIAL REMOVED, TEMPORARILY. The owner's commercial classification has
 * lapsed; renewal is submitted and paid but not yet granted. Advertising
 * commercial contracting without the classification is advertising work the
 * company is not currently licensed to take, which is the same exposure as
 * the real estate page.
 *
 * Restore 'Residential & Commercial' here, and the commercial entries marked
 * with the same note below, once the renewal comes through. Real estate
 * commercial is a different thing and is untouched — see `realEstate`.
 */
export const trustBar = [
  'Licensed & Insured',
  'Class A #2705162130',
  'Since 1989',
  'Residential',
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
    // 'Commercial Construction' removed pending the classification renewal.
    services: ['Basements', 'Interior & Exterior Remodeling', 'Additions'],
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

/**
 * Where "Leave us a Google review" sends people.
 *
 * Google's own deep link for writing a review, built from the place ID. It
 * opens the review box directly rather than the listing, which is the whole
 * point — a link to the listing loses most people before they find the button.
 *
 * The place ID is the same one functions/api/reviews.ts reads, and Google
 * permits storing place IDs indefinitely, unlike review content.
 */
export const writeReviewUrl =
  'https://search.google.com/local/writereview?placeid=ChIJr4P8Rvk4tokR4Ni_5rGjQbY';

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
  { number: '01', title: 'Call us', detail: 'Reach Shawn or Nancy directly at 571-233-5133.' },
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
    // 'Commercial' removed pending the classification renewal.
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
  heading: 'Thinking of selling? Start here.',
  standfirst:
    'Tell us about the property and we will come and look at it. You get a straight answer on what is worth doing before it goes on the market, and an introduction to a licensed agent if you need one.',
  intent: [
    'Selling my home',
    'Renting out my property',
    'Buying and want to renovate',
    'Not sure yet',
  ],
  propertyType: [
    'Single-family home',
    'Townhouse',
    'Condominium',
    'Multi-family',
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
  /*
   * These used to say the realtor and the contractor "work for the same
   * company". They do not — the agent's license hangs under Samson Companies
   * LLC — so that was a false statement about the business, on a page that was
   * live and in the main navigation. See the note above `realEstate`.
   */
  points: [
    {
      title: 'We know what work pays back',
      detail:
        'Thirty-seven years of renovation work behind the advice, so what we recommend is what actually needs doing rather than a wish list.',
    },
    {
      title: 'Built around your listing date',
      detail:
        'The work is scheduled to finish before the photographs are taken, not after.',
    },
    {
      title: 'An agent, if you need one',
      detail:
        'We can introduce you to a licensed agent in the area. The listing is handled by them; the work is handled by us.',
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
/**
 * Real estate — the GENERIC version, on the owner's instruction of 5 Sep.
 *
 * What this used to be, and why it changed: the page advertised brokerage
 * services under the Interior Design Flooring name — "our in-house realtor", a
 * list of listing, sales, rental and land services, and a 10% credit
 * conditioned on buying or selling through that realtor. Virginia requires the
 * entity advertising brokerage services to hold a real estate FIRM license and
 * to name it in the advertising, and Samson Companies LLC, where the agent's
 * license hangs, is a different company from this one.
 *
 * Softening the wording alone would not have fixed that. An invitation to
 * "contact us about listing your home" still offers the regulated service. So
 * the page now offers what Interior Design Flooring is actually licensed to
 * do — the renovation work that gets a house ready to sell — and says plainly
 * that the listing is handled by a licensed agent it can introduce you to.
 * A referral is not brokerage and needs no firm license.
 *
 * Three things must NOT come back without the firm license number and an
 * answer on Sameer Waziri's relationship to this company:
 *   1. "in-house realtor", or any wording placing the agent inside this firm
 *   2. a list of brokerage services offered by Interior Design Flooring
 *   3. a discount or credit conditioned on using a particular agent — a thing
 *      of value for referring settlement-service business
 * `realEstateLicense` below keeps the firm name and number for that day.
 */
export const realEstate = {
  standfirst: 'Selling a home? Talk to us before it goes on the market.',
  intro: [
    'Most homes sell for more after the right work is done first, and lose money on the wrong work. We have spent thirty-seven years learning which is which in Northern Virginia.',
    'Tell us about the property and we will tell you honestly what is worth doing, what is not, and what it will cost. If you still need an agent, we can put you in touch with one.',
  ],
  /** What this company actually does. Contracting, not brokerage. */
  points: [
    {
      title: 'What pays back, and what does not',
      detail:
        'A walk-through and a straight answer on which work returns more than it costs, based on the jobs we have actually done.',
    },
    {
      title: 'The work itself',
      detail:
        'Kitchens, bathrooms, flooring, paint, siding and roofing, with the schedule built around your listing date.',
    },
    {
      title: 'An introduction, if you want one',
      detail:
        'We work alongside licensed agents in the area and are glad to introduce you. The listing is theirs; the work is ours.',
    },
  ],
  cta: 'Reach out and we will go through the details with you.',
} as const;

export const cta = {
  primary: 'Request a Free Estimate',
  secondaryLabel: 'Call 571-233-5133',
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
 * The Google rating and review count, as read from the Places API.
 *
 * These are the fallback values, used when the live fetch does not run or does
 * not answer. Anything on the site that prints either number takes it from
 * here, so the page cannot show two different figures — and the live response
 * overwrites both through `data-live-figure`.
 */
export const googleSnapshot = {
  rating: '4.8',
  total: '32',
  readOn: '4 September 2026',
} as const;

/**
 * What you can count on. Credibility points for the About page.
 *
 * Every line here is checkable by a stranger: a license number they can look
 * up, a founding year, a rating published by someone other than us. That is
 * the test each one had to pass.
 *
 * Two things the owner asked for are deliberately not here.
 *
 * "100% customer satisfaction" is contradicted by the company's own Google
 * listing — a 4.8 average is not 100%, and the listing is the first thing a
 * sceptical customer checks. "10,000+ customers" is a quantity claim nobody
 * can substantiate; if Shawn has a real figure from his records, use that and
 * say where it comes from.
 *
 * The satisfaction line is phrased as standing behind the work rather than as
 * a guarantee. An unqualified "satisfaction guaranteed" is read as a promise
 * of a refund on request, which on a sixty-thousand-dollar renovation is a
 * commitment the company would have to honour. "We are not finished until you
 * are" says the same thing to a customer and is a promise a contractor can
 * actually keep.
 */
export const countOn = [
  {
    title: 'The owner, on your job',
    detail:
      'Shawn and Nancy Waziri have run this company since 1989. The person who walks your site, writes your estimate and answers the phone is an owner, not a project manager you meet once.',
  },
  {
    title: 'Licensed and insured, and you can check',
    detail:
      'Virginia Class A General Contractor #2705162130. The number is public — look it up with the Department of Professional and Occupational Regulation before you hire anyone, including us.',
  },
  {
    title: 'We are not finished until you are',
    detail:
      'We stand behind every job and put right what is not right. You do not have to take our word for it: the reviews are published on Google by the customers who wrote them.',
    /** Renders the live rating and count beside this point. */
    showRating: true,
  },
  {
    title: 'A written estimate within 24 hours',
    detail:
      'We walk the site ourselves, then the written estimate arrives within one day of the visit. No waiting a week to find out what it costs.',
  },
  {
    title: 'Thirty-seven years in the same trade',
    detail:
      'Kitchens, bathrooms, floors, additions, whole-home renovations and custom builds across Northern Virginia since 1989 — long enough to know what the work costs and what it should not.',
  },
] as const;

/**
 * The only figures that appear as statistics. Every one is verifiable —
 * no project counts or customer totals, which cannot be substantiated.
 */
export const figures = [
  { value: '1989', label: 'Established', note: '37 years owner-run' },
  /*
   * `live: 'googleRating'` marks this one for the reviews fetch to overwrite,
   * so it can never contradict the average the carousel prints from the same
   * response. The value here is the fallback when that fetch does not run or
   * does not answer — 4.8 across 32 reviews, read from the Places API on
   * 4 Sep 2026. It was 4.7, which had already drifted.
   */
  { value: googleSnapshot.rating, label: 'Google rating', note: 'From verified reviews', live: 'googleRating' },
  { value: '24 hrs', label: 'Estimate turnaround', note: 'After the site visit' },
  { value: 'Class A', label: 'Virginia license', note: '#2705162130' },
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
 * a Virginia Class A license, which is the only license number on this site.
 * Contracting in the other two jurisdictions is licensed separately —
 * Maryland through the MHIC, the District through its own home improvement
 * contractor license. Advertising work in a jurisdiction without holding its
 * license is the same class of exposure as the real estate page. If those
 * licenses do not exist, this should come back to Virginia only.
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
   * Real estate.
   *
   * OPEN, because the page no longer advertises brokerage services. It offers
   * renovation work that prepares a house for sale, and an introduction to a
   * licensed agent — a referral, which needs no real estate firm license.
   *
   * If the brokerage copy ever returns, this gate returns with it and goes
   * back to 'preview' until `realEstateLicense` is confirmed. The three things
   * that must not come back without it are listed above `realEstate`.
   */
  realEstate: true as false | 'preview' | true,

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

  /**
   * Live Google reviews in the carousel.
   *
   * false - the carousel shows only the curated reviews in `reviews` above.
   * true  - on load the page also fetches /api/reviews and, if that returns a
   *         usable set, replaces the curated cards with the live Google ones
   *         and prints the true average and review count above them.
   *
   * The curated reviews stay the server-rendered floor either way. Google's
   * Places API returns at most five reviews and this filters to four stars and
   * up, so the live set can come back with one or none — and a testimonials
   * section that renders empty is worse than one showing four good reviews
   * from last year. The carousel keeps the curated cards unless the live set
   * has at least three.
   *
   * What the flag does and does not strip, measured rather than assumed:
   * with it off, no `data-rc-live` attribute and no card `<template>` reach
   * the HTML, and no request is made — but the carousel's script is hoisted
   * and bundled by Astro regardless of props, so the fetch code itself does
   * ship, inert, with nothing to act on. Unlike `realEstate`, this gate is
   * about a request and a claim, not about copy, so inert bytes are the right
   * trade rather than a second component to keep in step.
   *
   * To reach `true`: put a Google Places API key into the Pages project as the
   * secret `GOOGLE_PLACES_KEY` and redeploy. See CLOUDFLARE.md § 3b. The flag
   * is separate from the key on purpose — the key going missing must not be
   * the thing that decides what the page claims.
   */
  googleReviews: true,
} as const;

/**
 * The advertising disclosure Virginia requires on real estate advertising.
 *
 * THE OWNER HAS ASKED TO LEAVE THE FIRM OUT — "that changes often" — and to
 * name the two salespeople only. That cannot be done, and the reason is worth
 * writing down so nobody relitigates it from memory:
 *
 * A salesperson license is held *under* a brokerage. Virginia requires the
 * licensed firm's name in real estate advertising precisely so the public can
 * tell which brokerage stands behind the advert. Naming two salespeople and
 * no firm is the specific thing the rule exists to prevent, and the exposure
 * lands on their licenses, not on the website.
 *
 * "It changes often" argues for putting it in, not leaving it out: whichever
 * brokerage they hang their licenses with today is the one legally answerable
 * for this page today. Updating it later is one line in this file.
 *
 * NAMING THE FIRM MADE A SECOND PROBLEM VISIBLE, and it was the larger one.
 *
 * The brokerage Sameer's license hangs under is Samson Companies LLC — a
 * different company from Interior Design Flooring. That made every "in-house
 * realtor", "one team" and "same company" line inaccurate: IDF does not
 * provide brokerage services, Samson does, and a client buying or selling
 * contracts with Samson. The 10% credit for using that realtor was then a
 * thing of value moving between two companies for referred settlement-service
 * business, which is a federal question rather than a discount.
 *
 * RESOLVED ON 5 SEP by removing the claim rather than by answering the
 * question. On the owner's instruction the real estate copy is now generic:
 * it offers the renovation work IDF is licensed to do and an introduction to a
 * licensed agent, which is a referral and needs no firm license. All six
 * places that carried the claim have been rewritten —
 *   - realEstate.intro / points   now contracting and a referral
 *   - listing.points              'same company' removed
 *   - HomeSections.astro          homepage band, now 'Selling a home?'
 *   - real-estate.astro           rewritten, gate opened
 *   - list-your-home.astro        meta description
 *   - the 10% credit              removed entirely
 *
 * The question for Sameer is therefore no longer blocking anything, but it is
 * not answered: what his actual relationship to Interior Design Flooring is —
 * staff licensed outside, part-owner of an affiliated firm, or an independent
 * referral partner. That answer is what any future brokerage copy depends on,
 * and `realEstateLicense` keeps the firm name and number for it.
 */
export const realEstateLicense = {
  /**
   * The brokerage Sameer Waziri's license hangs under, and the name that must
   * appear on any real estate advertising this site carries.
   *
   * Spelled in title case deliberately: DPOR records it in capitals, as
   * registries do, and setting a company name in full capitals in body copy is
   * a house-style artefact rather than part of the name.
   */
  firmName: 'Samson Companies LLC',
  /**
   * The firm's own license. A different series from the 0225 salesperson
   * numbers, consistent with a firm license — worth confirming once on the
   * DPOR lookup, since publishing a wrong number is worse than publishing none.
   */
  licenseNumber: '0226021529',
} as const;

/** Main navigation, in the owner's requested order. */
/**
 * Site navigation, grouped.
 *
 * This was nine flat links, which is more than a header can carry without the
 * row wrapping and more than a visitor can scan. It is now five top-level
 * entries, two of which open a short list.
 *
 * A group's `href` is a real page, not a placeholder: the parent is the
 * overview and the children are the pages under it, so clicking the group
 * label goes somewhere sensible if the disclosure is never opened.
 *
 * `/real-estate/` appears as "Selling a home", which is what the page is now
 * called. Labelling that group "Real Estate" would put brokerage language back
 * into the header, which is the thing the 5 Sep rewrite took out.
 *
 * `gated` works at either level. A gated child is dropped from its group; a
 * group whose children all disappear still renders as a plain link to its own
 * page rather than an empty dropdown.
 */
export const nav = [
  { label: 'Home', href: '/' },
  {
    label: 'Services',
    href: '/services/',
    children: [
      { label: 'All services', href: '/services/' },
      { label: 'Custom homes', href: '/custom-homes/' },
      { label: 'Selling a home', href: '/real-estate/', gated: 'realEstate' },
      { label: 'Financing', href: '/financing/' },
    ],
  },
  {
    label: 'Our work',
    href: '/projects/',
    children: [
      { label: 'Projects', href: '/projects/' },
      { label: 'About us', href: '/about/' },
      { label: 'Investors', href: '/investors/' },
    ],
  },
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
  // The Commercial group (renovations, tenant fit-outs, retail and office)
  // is removed pending the classification renewal. Restore it here.
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
    detail: 'Two-story siding and trim work from ladders.',
    alt: 'Two workers, one on a ladder, replacing siding and trim on the upper story of a house.',
    ratio: '4 / 3',
    tags: ['Exterior'],
  },
  {
    slot: 'project-kitchen-cream',
    caption: 'Kitchen remodel, cream cabinetry',
    detail: 'Raised-panel cabinets, granite counters, full appliance run.',
    alt: 'A kitchen with cream raised-panel cabinets, speckled granite counters, wall ovens and a center island.',
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
    detail: 'Upper-story work above a rear deck.',
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
 * Investor program. These are commercial terms the owner has asked to
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
