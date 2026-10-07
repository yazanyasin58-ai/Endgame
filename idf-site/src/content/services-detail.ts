/**
 * The individual service pages, added on the client's menu-structure brief.
 *
 * Why these live here and not as twelve .astro files: they share one layout
 * exactly, and twelve copies of it would drift the moment one is edited. The
 * route is src/pages/services/[slug].astro and it reads this list, so adding a
 * service is a content change, not a code change — the same rule the gallery
 * slots already follow.
 *
 * Rules this content keeps, the same ones the rest of idf.ts keeps:
 *   - no statistics, project counts, timescales or prices that cannot be
 *     substantiated from the owner's own brief
 *   - no outcome or resale-value claims
 *   - nothing about negotiating or settling insurance claims, which is public
 *     adjusting and licensed separately in Virginia
 *
 * `scope` is what the crew actually does. `notes` is the honest limit of the
 * service, shown on the page, because saying where a service stops reads as
 * competence rather than hedging.
 */

export type ServicePage = {
  slug: string;
  /** Menu label — short, as it appears in the Services dropdown. */
  label: string;
  /** <h1> and <title> stem. */
  title: string;
  /** One sentence under the heading. No adjectives that cannot be checked. */
  standfirst: string;
  intro: string[];
  scopeTitle: string;
  scope: string[];
  notes?: string;
};

export const servicePages: ServicePage[] = [
  {
    slug: 'general-contracting',
    label: 'General contracting',
    title: 'General contracting',
    standfirst:
      'One Class A contractor carrying the permits, the trades and the schedule from first drawing to final inspection.',
    intro: [
      'Most of what goes wrong on a renovation is not the carpentry. It is the gap between two trades nobody owns — the electrician who came before the framing was ready, the inspection nobody booked, the change that never reached the person holding the drawings.',
      'Acting as your general contractor means those gaps are ours. We hold the licence, pull the permits, schedule the trades in the order the work actually needs, and stand in front of the inspector. You have one number to call and one person answerable for the result.',
    ],
    scopeTitle: 'What we carry',
    scope: [
      'Permits and the inspection schedule, filed and attended',
      'Trade scheduling and coordination, in build order',
      'Site supervision while the work is live',
      'Materials ordering and delivery timing',
      'Written estimates and change orders before the work happens, not after',
      'Final walkthrough and punch list until you sign it off',
    ],
    notes:
      'We are a Virginia Class A contractor. Work requiring a separate licence — surveying, and any structural engineering stamp — is placed with a licensed professional and coordinated by us.',
  },
  {
    slug: 'home-remodeling',
    label: 'Home remodeling',
    title: 'Whole-home remodeling',
    standfirst:
      'Reworking a house you intend to keep, room by room or all at once.',
    intro: [
      'A whole-home remodel is a sequencing problem before it is a building problem. Which rooms come apart first decides whether you can stay in the house, how long the kitchen is out, and how many times a trade has to come back.',
      'We plan that sequence with you before anything is demolished, and we write it into the estimate so you can see what your life looks like each week rather than finding out.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Layout changes, including removing and rebuilding walls',
      'Kitchens, bathrooms and living space in one programme',
      'Flooring, trim, doors and interior finishes throughout',
      'Electrical, plumbing and HVAC brought up to current code where the work exposes it',
      'Insulation and drywall',
      'Paint and final finishes',
    ],
    notes:
      'Where a wall is structural, the design goes to a licensed engineer before it is priced. We will tell you that at the estimate rather than after the ceiling is open.',
  },
  {
    slug: 'kitchen-remodeling',
    label: 'Kitchen remodeling',
    title: 'Kitchen remodeling',
    standfirst:
      'From a cabinet-and-worktop replacement to moving the room and the services that feed it.',
    intro: [
      'Kitchens are the most disruptive room in a house to lose, so the two questions worth settling first are how long it will be out and what is actually driving the cost — the finishes, or moving the plumbing and gas.',
      'We price those separately in the estimate so you can see which decisions are expensive and which are simply preference.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Cabinetry, worktops, splashbacks and hardware',
      'Appliance fit and the services behind them',
      'Relocating sinks, gas and appliance runs where the layout changes',
      'Electrical, including added circuits, lighting and outlets to code',
      'Flooring and trim',
      'Removing a wall to open the kitchen to living space',
    ],
  },
  {
    slug: 'bathroom-remodeling',
    label: 'Bathroom remodeling',
    title: 'Bathroom remodeling',
    standfirst:
      'Wet-area work done in the right order, so what goes behind the tile is right before the tile goes on.',
    intro: [
      'Almost every bathroom failure is a waterproofing failure, and it shows up two years later inside a wall or on the ceiling below. The visible half of a bathroom is the easy half.',
      'We build the substrate and the waterproofing to the manufacturer’s specification, and we will show you that stage before it is covered.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Full strip-out back to studs where the condition warrants it',
      'Waterproofing and substrate for showers and wet areas',
      'Tile, including floors, walls and shower enclosures',
      'Vanities, fittings and fixtures',
      'Plumbing relocation and supply and waste replacement',
      'Extraction, lighting and code-compliant electrical',
      'Accessible layouts — level thresholds, grab-bar blocking, wider doorways',
    ],
  },
  {
    slug: 'basement-remodeling',
    label: 'Basement remodeling',
    title: 'Basement finishing and remodeling',
    standfirst:
      'Turning below-grade space into rooms that stay dry, and that pass inspection as living space.',
    intro: [
      'A basement becomes legal living space only when it meets the requirements for egress, ceiling height, and fire separation. Finishing one without that is how a house fails an appraisal or an inspection years later.',
      'We check those conditions before pricing the finishes, and if the space cannot meet them we will say so at the estimate.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Moisture control and drainage before anything is framed',
      'Egress windows and wells where the plan adds a bedroom',
      'Framing, insulation and drywall',
      'Bathrooms and wet bars, including below-grade waste',
      'Electrical, lighting and HVAC extension into the space',
      'Flooring suited to below-grade conditions',
      'Fire separation and code compliance for finished basements',
    ],
    notes:
      'If the basement has an active water problem, that is fixed and observed through a wet season before finish materials go in. Finishing over it simply hides it.',
  },
  {
    slug: 'home-additions',
    label: 'Home additions',
    title: 'Home additions',
    standfirst:
      'Adding floor area — out, up, or into a garage or porch — and tying it into the house so it does not read as an addition.',
    intro: [
      'An addition is two projects: the new structure, and the join. The join is what people notice — a roofline that does not line up, a floor that steps, trim that does not match.',
      'It is also the part that needs the most attention to the existing building, which is why we survey what is there before we price what is new.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Single and multi-room additions',
      'Second-storey additions and dormers',
      'Garage, porch and sunroom conversions',
      'In-law and accessory suites where zoning permits',
      'Foundations, framing and roof tie-in',
      'Extending electrical, plumbing and HVAC to serve the new area',
      'Matching siding, roofing, trim and interior finishes to the existing house',
    ],
    notes:
      'Additions are zoning-dependent. Setbacks, lot coverage and, where one applies, an HOA review can change what is buildable — we establish that before design work begins.',
  },
  {
    slug: 'flooring',
    label: 'Flooring',
    title: 'Flooring',
    standfirst:
      'The trade the company started in, in 1989.',
    intro: [
      'Flooring is where Interior Design Flooring began, and it is still the work the owner will talk about longest. Most floor failures come from the subfloor and the moisture conditions under it, not the material on top.',
      'So the subfloor is checked and prepared first, every time, and if a material is wrong for the room we will tell you before it is ordered rather than after it cups.',
    ],
    scopeTitle: 'What we install',
    scope: [
      'Hardwood — solid and engineered, new installation',
      'Refinishing and repair of existing hardwood',
      'Luxury vinyl plank and tile',
      'Tile and stone, including heated floor systems',
      'Carpet',
      'Subfloor repair, levelling and moisture preparation',
      'Stairs, treads, nosings and transitions',
    ],
  },
  {
    slug: 'roofing-siding',
    label: 'Roofing & siding',
    title: 'Roofing and siding',
    standfirst:
      'The building envelope — the part of the house whose job is to keep water out of everything else.',
    intro: [
      'Roofing and siding are worth treating as one system, because water that gets past one usually shows up as damage caused by the other. A roof replaced without correcting the flashing at a wall junction will leak again in the same place.',
      'We look at the whole envelope when we quote either.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Roof replacement and repair',
      'Flashing, valleys, and roof-to-wall detailing',
      'Gutters, downspouts, fascia and soffit',
      'Siding replacement and repair',
      'Trim and exterior carpentry',
      'Storm damage repair',
      'Ventilation in the roof space',
    ],
  },
  {
    slug: 'windows-doors',
    label: 'Windows & doors',
    title: 'Windows and doors',
    standfirst:
      'Replacement and new openings, fitted and flashed so the wall around them stays dry.',
    intro: [
      'A window is only as good as the opening it sits in. Most replacement problems are installation problems — flashing lapped the wrong way, an unsealed sill, a frame packed out of square.',
      'That detail is not visible once the trim is on, which is exactly why it is worth doing properly.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Window replacement, like-for-like or resized',
      'New openings, including the header work they need',
      'Entry, patio and sliding doors',
      'Interior doors and hardware',
      'Egress windows for basement bedrooms',
      'Flashing, sealing and insulating the opening',
      'Interior and exterior trim to match',
    ],
  },
  {
    slug: 'painting-drywall',
    label: 'Painting & drywall',
    title: 'Painting and drywall',
    standfirst:
      'Surface preparation, because paint does not hide anything for long.',
    intro: [
      'Drywall and paint are the finish everyone sees and the first thing that gives away a rushed job. Nail pops, a seam that telegraphs, a line that wanders at the ceiling.',
      'The preparation is most of the labour and almost all of the result.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Drywall hanging, taping and finishing',
      'Repairing damage, cracks and nail pops',
      'Texture matching, and removing textured ceilings',
      'Interior painting, including trim and doors',
      'Exterior painting and preparation',
      'Caulking and surface preparation',
    ],
  },
  {
    slug: 'water-damage-mold',
    label: 'Water damage & mold restoration',
    title: 'Water damage and mold restoration',
    standfirst:
      'Finding the source, drying the structure, then rebuilding what had to come out.',
    intro: [
      'Restoration goes wrong when the rebuild starts before the structure is dry, or before the thing that let the water in has actually been fixed. The finishes look right and the problem returns.',
      'We work in that order — source, dry, verify, rebuild — and we are a general contractor, so the rebuild is done by the same company that opened the wall.',
    ],
    scopeTitle: 'Typical scope',
    scope: [
      'Locating and repairing the source of the water',
      'Removing wet and damaged material',
      'Drying the structure and confirming it is dry before rebuilding',
      'Mold remediation',
      'Structural repair where the framing is affected',
      'Full reconstruction of the affected area',
      'Documenting the damage and the work for your records',
    ],
    notes:
      'Where an insurer is involved we will document the damage and write our estimate for your file. We do not negotiate or settle insurance claims — in Virginia that is public adjusting and it is licensed separately.',
  },
  {
    slug: 'insurance-claim-repairs',
    label: 'Insurance claim repairs',
    title: 'Insurance claim repairs',
    standfirst:
      'The repair work on an insured loss, with the documentation your file needs.',
    intro: [
      'When a claim is involved there are two jobs: the building work, and the paperwork that has to line up with it. We do the building work, and we write our estimate and our documentation so it can go straight into your file.',
      'What we will not do is stand between you and your insurer. That is a licensed activity and a different profession.',
    ],
    scopeTitle: 'What we do',
    scope: [
      'Documenting the damage — photographs, measurements and written scope',
      'A written repair estimate, itemised, suitable for your claim file',
      'Answering the insurer’s questions about our own estimate and our own scope',
      'Remediation, structural repair and full reconstruction',
      'Bringing affected work up to current code',
    ],
    notes:
      'We do not negotiate or settle claims, act for you in dealing with your insurer, or make any offer touching your deductible. Negotiating or settling a claim on a policyholder’s behalf is public adjusting, which is licensed separately in Virginia and is not what we are licensed for.',
  },
];

/** Menu entries for the Services dropdown, in the order the client listed. */
export const serviceMenu = servicePages.map((s) => ({
  label: s.label,
  href: `/services/${s.slug}/`,
}));
